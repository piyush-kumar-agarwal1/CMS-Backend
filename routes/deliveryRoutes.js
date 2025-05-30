import express from 'express';
import { 
  handleDeliveryReceipt, 
  sendMessage, 
  getCommunicationLogs 
} from '../controllers/deliveryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/logs', protect, getCommunicationLogs);
router.post('/receipt', handleDeliveryReceipt);
router.post('/send', protect, sendMessage);

export default router;