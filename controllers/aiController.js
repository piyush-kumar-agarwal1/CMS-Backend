import expressAsyncHandler from 'express-async-handler';
import axios from 'axios';
import Campaign from '../models/campaignModel.js';
import Message from '../models/messageModel.js';
import Customer from '../models/customerModel.js';
import Segment from '../models/segmentModel.js';

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
Generate insights without any markdown formatting (no asterisks, no bold text):
1. Natural language performance summary
2. 2-3 message suggestions
3. Campaign tags (like "Win-back")
4. Recommended day/time for next campaign

Use this exact format without any asterisks or special formatting:
- Summary: [your summary here]
- Suggestions: [suggestion 1] | [suggestion 2] | [suggestion 3]
- Tags: [tag1], [tag2], [tag3]
- Next Best Send Time: [your recommendation]`;


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

    // Clean up any remaining asterisks and formatting
    let cleanContent = content
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold
      .replace(/\*(.*?)\*/g, '$1')      // Remove italic
      .replace(/\*/g, '')               // Remove remaining asterisks
      .replace(/#{1,6}\s+/g, '');       // Remove headers

    const insights = {
      summary: '',
      suggestions: [],
      tags: [],
      nextBestTime: ''
    };

    // Parse each section more reliably
    const summaryMatch = cleanContent.match(/- Summary:\s*([^\n-]+)/);
    if (summaryMatch) {
      insights.summary = summaryMatch[1].trim();
    }

    const suggestionsMatch = cleanContent.match(/- Suggestions:\s*([^\n-]+)/);
    if (suggestionsMatch) {
      insights.suggestions = suggestionsMatch[1]
        .split('|')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    const tagsMatch = cleanContent.match(/- Tags:\s*([^\n-]+)/);
    if (tagsMatch) {
      insights.tags = tagsMatch[1]
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
    }

    const timeMatch = cleanContent.match(/- Next Best Send Time:\s*([^\n-]+)/);
    if (timeMatch) {
      insights.nextBestTime = timeMatch[1].trim();
    }

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

Provide concise, actionable advice in a conversational tone. Focus on practical CRM solutions. Use proper formatting with bullet points and paragraphs. Do not use markdown syntax like ** for formatting. Keep responses under 4 paragraphs when possible.`;

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

    // Get the raw response
    let aiResponse = response.data.candidates[0].content.parts[0].text;

    // Clean up formatting issues
    aiResponse = aiResponse
      // Remove markdown-style formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Replace bullet markers for consistency
      .replace(/^\s*\*\s+/gm, '• ')
      // Ensure proper spacing after periods
      .replace(/\.(?=[A-Z])/g, '. ');

    res.json({ response: aiResponse });

  } catch (error) {
    console.error('AI Chat error:', error.response?.data || error.message);

    // Fallback response if Gemini API fails
    const fallbackResponse = `I'm here to help with your CRM needs! Here are some ways I can assist:

• Customer Segmentation: Create targeted groups based on behavior, demographics, or purchase history
• Campaign Optimization: Improve open rates, click-through rates, and conversions  
• Message Personalization: Craft compelling content for different customer segments
• Analytics Insights: Understand your customer data and campaign performance

What specific aspect of your CRM strategy would you like help with?`;

    res.json({ response: fallbackResponse });
  }
});


const generateCampaignIdeas = expressAsyncHandler(async (req, res) => {
  const { segmentId, objective, type } = req.body;

  if (!segmentId || !objective || !type) {
    res.status(400);
    throw new Error('Missing required parameters');
  }

  try {
    // Get the segment info
    const segment = await Segment.findById(segmentId)
      .populate('user', 'name')
      .exec();

    if (!segment) {
      res.status(404);
      throw new Error('Segment not found');
    }

    // Get a sample of customers to understand audience
    const customers = await Customer.find({
      user: req.user._id
    }).limit(3).exec();

    const promptText = `You are an AI marketing assistant. Create marketing campaign ideas for:

Audience: ${segment.name} (${segment.description || 'No description'})
Segment criteria: ${JSON.stringify(segment.conditions || {})}
Campaign type: ${type} (email, sms, or push)
Objective: ${objective}
Sample customers: ${customers.map(c => `${c.name} (Total spent: ${c.totalSpent || 'unknown'})`).join(', ')}

Provide:
1. 3 message content suggestions for a ${type} campaign (keep them short and compelling)
2. Best day and time to send this campaign based on the audience
3. 2-3 relevant tags for tracking this campaign

Do not use any markdown formatting like ** or * in your response. Use plain text only.

Respond in this format:
- Suggestions:
  Suggestion 1
  Suggestion 2
  Suggestion 3
- BestSendTime: Day, Time
- Tags: tag1, tag2, tag3`;

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

    // Extract and parse the response with enhanced formatting cleanup
    let content = response.data.candidates[0].content.parts[0].text;

    // Clean up markdown formatting before parsing
    content = content
      // Remove all types of markdown bold formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      // Remove all types of markdown italic formatting
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove extra asterisks that might be used as bullet points
      .replace(/^\s*\*+\s*/gm, '')
      // Clean up any remaining asterisks
      .replace(/\*/g, '');

    // Parse suggestions, send time, and tags from cleaned response
    const suggestionsMatch = content.match(/- Suggestions:\s*([^\n-]+)/);
    let suggestions = [];
    if (suggestionsMatch) {
      suggestions = suggestionsMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('-'))
        .slice(0, 3); // Limit to 3 suggestions
    }

    const timeMatch = content.match(/- BestSendTime:\s*([^\n]+)/);
    const bestSendTime = timeMatch ? timeMatch[1].trim() : '';

    const tagsMatch = content.match(/- Tags:\s*([^\n]+)/);
    const tags = tagsMatch ?
      tagsMatch[1].split(',').map(tag => tag.trim().replace(/\*/g, ''))
      : [];

    res.json({
      suggestions,
      bestSendTime,
      tags
    });
  } catch (error) {
    console.error('AI Campaign Ideas error:', error.response?.data || error.message);
    res.status(500);
    throw new Error(`Failed to generate campaign ideas: ${error.response?.data?.error?.message || error.message}`);
  }
});

// Update exports
export { analyzeCampaign, chatWithAI, generateCampaignIdeas };