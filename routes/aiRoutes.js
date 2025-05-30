import express from 'express';
import { analyzeCampaign, chatWithAI } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/analyze/:campaignId', protect, analyzeCampaign);
router.post('/chat', protect, chatWithAI);

export default router;