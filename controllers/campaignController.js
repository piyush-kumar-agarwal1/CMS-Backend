import expressAsyncHandler from 'express-async-handler';
import Campaign from '../models/campaignModel.js';
import Segment from '../models/segmentModel.js';
import Customer from '../models/customerModel.js';
import Message from '../models/messageModel.js';
import CommunicationLog from '../models/communicationLogModel.js';
import { sendEmail, sendSMS, sendPushNotification } from '../services/messageService.js';


const getCampaigns = expressAsyncHandler(async (req, res) => {
  const campaigns = await Campaign.find({ user: req.user._id })
    .populate('segment', 'name estimatedCount')
    .sort({ createdAt: -1 });
  res.json(campaigns);
});


const getCampaignById = expressAsyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id)
    .populate('segment', 'name description conditions conditionLogic estimatedCount');

  if (campaign && campaign.user.equals(req.user._id)) {
    res.json(campaign);
  } else {
    res.status(404);
    throw new Error('Campaign not found');
  }
});


const createCampaign = expressAsyncHandler(async (req, res) => {
  const { name, description, type, segmentId, message, scheduledDate } = req.body;


  // Verify the segment exists and belongs to the user
  const segment = await Segment.findById(segmentId);
  if (!segment || !segment.user.equals(req.user._id)) {
    res.status(404);
    throw new Error('Segment not found');
  }

  const campaign = await Campaign.create({
    user: req.user._id,
    name,
    description,
    type,
    segment: segmentId,
    content: {
      subject: message?.subject,
      body: message?.content,
      template: message?.template,
    },
    scheduledDate,
    status: scheduledDate ? 'scheduled' : 'draft',
  });

  if (campaign) {
    await campaign.populate('segment', 'name estimatedCount');
    res.status(201).json(campaign);
  } else {
    res.status(400);
    throw new Error('Invalid campaign data');
  }
});


const sendCampaign = expressAsyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign || !campaign.user.equals(req.user._id)) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  const segment = await Segment.findById(campaign.segment);
  if (!segment) {
    res.status(404);
    throw new Error('Segment not found');
  }

  // Fix: Properly filter customers based on segment conditions
  let customers;
  if (segment.conditions && segment.conditions.length > 0) {
    // Build query based on segment conditions
    const query = { user: req.user._id };

    segment.conditions.forEach(condition => {
      if (condition.field === 'totalSpent' || condition.field === 'total_spend') {
        const value = parseFloat(condition.value);
        if (condition.operator === 'gt') query.totalSpent = { $gt: value };
        else if (condition.operator === 'lt') query.totalSpent = { $lt: value };
        else if (condition.operator === 'eq') query.totalSpent = value;
      }
      // Add more condition handling as needed
    });

    customers = await Customer.find(query);
  } else {
    // If no conditions, get all customers for the user
    customers = await Customer.find({ user: req.user._id });
  }

  if (customers.length === 0) {
    res.status(400);
    throw new Error('No customers found for this segment');
  }


  campaign.status = 'sending';
  await campaign.save();

  let sentCount = 0;
  let failedCount = 0;


  for (const customer of customers) {
    try {
      const personalizedMessage = campaign.content.body.replace(
        '{{firstName}}',
        customer.name.split(' ')[0]
      );

      const message = await Message.create({
        user: req.user._id,
        campaign: campaign._id,
        customer: customer._id,
        type: campaign.type,
        content: {
          subject: campaign.content.subject,
          body: personalizedMessage,
          mediaUrl: campaign.content.mediaUrl,
        },
        status: 'queued',
      });

      // Replace simulation with real sending
      let deliveryResult;

      if (campaign.type === 'email') {
        deliveryResult = await sendEmail(
          customer.email,
          campaign.content.subject || 'Message from CustomerConnect',
          personalizedMessage
        );
      } else if (campaign.type === 'sms') {
        if (!customer.phone) {
          throw new Error('Customer has no phone number');
        }
        deliveryResult = await sendSMS(customer.phone, personalizedMessage);
      } else if (campaign.type === 'push') {
        deliveryResult = await sendPushNotification(customer._id, personalizedMessage);
      }

      const status = deliveryResult.success ? 'SENT' : 'FAILED';
      const failureReason = deliveryResult.success ? null : deliveryResult.error;

      await CommunicationLog.create({
        user: req.user._id,
        customer: customer._id,
        segment: segment._id,
        status,
        failureReason,
        metadata: {
          message: personalizedMessage,
          campaignId: campaign._id,
          messageId: message._id,
          externalMessageId: deliveryResult.messageId
        },
      });

      message.status = deliveryResult.success ? 'delivered' : 'failed';
      message.deliveredAt = deliveryResult.success ? new Date() : undefined;
      message.failedReason = failureReason;
      await message.save();

      if (deliveryResult.success) {
        sentCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      console.error(`Failed to send message to customer ${customer._id}:`, error);
      failedCount++;
    }
  }

  campaign.metrics.sent = sentCount;
  campaign.metrics.delivered = sentCount;
  campaign.metrics.failed = failedCount;
  campaign.status = 'sent';
  await campaign.save();

  res.json({
    message: `Campaign delivered to ${customers.length} customers`,
    messageCount: customers.length,
    sent: sentCount,
    failed: failedCount,
  });
});


const updateCampaign = expressAsyncHandler(async (req, res) => {
  const { name, description, type, segmentId, message, scheduledDate } = req.body;

  const campaign = await Campaign.findById(req.params.id);

  if (campaign && campaign.user.equals(req.user._id)) {
    // Verify the segment exists and belongs to the user
    if (segmentId) {
      const segment = await Segment.findById(segmentId);
      if (!segment || !segment.user.equals(req.user._id)) {
        res.status(404);
        throw new Error('Segment not found');
      }
    }

    campaign.name = name || campaign.name;
    campaign.description = description || campaign.description;
    campaign.type = type || campaign.type;
    campaign.segment = segmentId || campaign.segment;
    campaign.content = {
      subject: message?.subject || campaign.content.subject,
      body: message?.content || campaign.content.body,
      template: message?.template || campaign.content.template,
    };
    campaign.scheduledDate = scheduledDate || campaign.scheduledDate;

    const updatedCampaign = await campaign.save();
    await updatedCampaign.populate('segment', 'name estimatedCount');

    res.json(updatedCampaign);
  } else {
    res.status(404);
    throw new Error('Campaign not found');
  }
});


const deleteCampaign = expressAsyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (campaign && campaign.user.equals(req.user._id)) {
    // Only allow deletion if campaign hasn't been sent
    if (campaign.status === 'sent') {
      res.status(400);
      throw new Error('Cannot delete a campaign that has already been sent');
    }

    await Campaign.deleteOne({ _id: campaign._id });
    res.json({ message: 'Campaign removed' });
  } else {
    res.status(404);
    throw new Error('Campaign not found');
  }
});

export {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign
};