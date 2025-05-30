import express from 'express';
import { getOrders, getOrderById, createOrder } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { orderSchema } from '../validation/schemas.js';

const router = express.Router();

router.route('/')
  .get(protect, getOrders)
  .post(protect, validateRequest(orderSchema), createOrder);

router.route('/:id')
  .get(protect, getOrderById);

export default router;