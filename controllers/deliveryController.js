import expressAsyncHandler from 'express-async-handler';
import CommunicationLog from '../models/communicationLogModel.js';
import Customer from '../models/customerModel.js';


const simulateDelivery = () => {
  const success = Math.random() < 0.9;
  return {
    status: success ? 'SENT' : 'FAILED',
    failureReason: success ? null : 'Simulation: Delivery failed',
  };
};


const getCommunicationLogs = expressAsyncHandler(async (req, res) => {
  const logs = await CommunicationLog.find({ user: req.user._id })
    .populate('customer', 'name email')
    .populate('segment', 'name')
    .sort({ sentAt: -1 });
  res.json(logs);
});


const handleDeliveryReceipt = expressAsyncHandler(async (req, res) => {
  const { messageId, status, failureReason } = req.body;

  const log = await CommunicationLog.findById(messageId);
  if (!log) {
    res.status(404);
    throw new Error('Message log not found');
  }

  log.status = status;
  log.failureReason = failureReason;
  await log.save();

  res.json({ success: true });
});


const sendMessage = expressAsyncHandler(async (req, res) => {
  const { customerId, segmentId, message, userId } = req.body;


  const customer = await Customer.findById(customerId);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  
  const personalizedMessage = message.replace(
    '{{firstName}}',
    customer.name.split(' ')[0]
  );

  const log = await CommunicationLog.create({
    user: userId,
    customer: customerId,
    segment: segmentId,
    status: 'PENDING',
    metadata: { message: personalizedMessage },
  });

  
  const { status, failureReason } = simulateDelivery();

  
  log.status = status;
  log.failureReason = failureReason;
  await log.save();

  res.json(log);
});

export { handleDeliveryReceipt, sendMessage, getCommunicationLogs };