import express from 'express';
import { analyzeCampaign, chatWithAI, generateCampaignIdeas } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/chat', protect, chatWithAI);
router.post('/analyze/:campaignId', protect, analyzeCampaign);
router.post('/campaign-ideas', protect, generateCampaignIdeas);  // Add this line

export default router;