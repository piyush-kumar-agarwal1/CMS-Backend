import expressAsyncHandler from 'express-async-handler';
import axios from 'axios';
import Campaign from '../models/campaignModel.js';
import Message from '../models/messageModel.js';
import Customer from '../models/customerModel.js';

const analyzeCampaign = expressAsyncHandler(async (req, res) => {
  const { campaignId } = req.params;

  try {

    const campaign = await Campaign.findById(campaignId)
      .populate('segment', 'name conditions')
      .exec();

    if (!campaign) {
      res.status(404);
      throw new Error('Campaign not found');
    }


    const messages = await Message.find({ campaign: campaignId })
      .populate('customer', 'name totalSpend visits lastActiveDate')
      .limit(10)
      .exec();


    const sampleLogs = messages.map(msg => ({
      name: msg.customer.name,
      status: msg.status,
      totalSpend: msg.customer.totalSpend,
      visits: msg.customer.visits,
      lastActive: Math.floor((Date.now() - new Date(msg.customer.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)),
      message: msg.content.body
    }));


    const promptText = `You are an AI CRM assistant. Analyze the following campaign:

📌 Campaign Info:
- Name: ${campaign.name}
- Objective: ${campaign.description || 'Not specified'}
- Created: ${campaign.createdAt}
- Audience Size: ${campaign.segment.estimatedCount}
- Sent: ${campaign.metrics.sent}, Failed: ${campaign.metrics.failed}

🧑‍🤝‍🧑 Segment Logic: ${JSON.stringify(campaign.segment.conditions)}

📊 Sample Logs:
${sampleLogs.map(log =>
      `- Name: ${log.name}, Status: ${log.status}, Spend: ₹${log.totalSpend}, Visits: ${log.visits}, Last Active: ${log.lastActive} days ago, Message: "${log.message}"`
    ).join('\n')}

---
Now generate:
1. Natural language performance summary
2. 2–3 message suggestions
3. Campaign tags (like "Win-back")
4. Recommended day/time for next campaign

Respond as:
- Summary:
- Suggestions:
- Tags:
- Next Best Send Time:`;


    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: promptText
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );


    const content = response.data.candidates[0].content.parts[0].text;
    const sections = content.split('\n\n');

    const insights = {
      summary: sections[0].replace('Summary: ', '').trim(),
      suggestions: sections[1].replace('Suggestions:\n', '').split('\n').map(s => s.replace('- ', '')),
      tags: sections[2].replace('Tags: ', '').split(', '),
      nextBestTime: sections[3].replace('Next Best Send Time: ', '').trim()
    };

    res.json(insights);
  } catch (error) {
    console.error('AI Analysis error:', error.response?.data || error.message);
    res.status(500);
    throw new Error(`Failed to generate campaign insights: ${error.response?.data?.error?.message || error.message}`);
  }
});


const chatWithAI = expressAsyncHandler(async (req, res) => {
  const { query } = req.body;

  if (!query || !query.trim()) {
    res.status(400);
    throw new Error('Query is required');
  }

  try {
    const promptText = `You are an AI CRM assistant for CustomerConnect. Help users with customer relationship management, segmentation, campaigns, and marketing strategies.

User Query: ${query}

Provide helpful, actionable advice in a conversational tone. Focus on practical CRM solutions, customer segmentation strategies, campaign optimization, and data-driven insights.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: promptText
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.candidates[0].content.parts[0].text;
    res.json({ response: aiResponse });

  } catch (error) {
    console.error('AI Chat error:', error.response?.data || error.message);

    // Fallback response if Gemini API fails
    const fallbackResponse = `I'm here to help with your CRM needs! Here are some ways I can assist:

• **Customer Segmentation**: Create targeted groups based on behavior, demographics, or purchase history
• **Campaign Optimization**: Improve open rates, click-through rates, and conversions  
• **Message Personalization**: Craft compelling content for different customer segments
• **Analytics Insights**: Understand your customer data and campaign performance

What specific aspect of your CRM strategy would you like help with?`;

    res.json({ response: fallbackResponse });
  }
});

// Update exports
export { analyzeCampaign, chatWithAI };