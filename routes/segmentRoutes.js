import express from 'express';
import {
  getSegments,
  getSegmentById,
  createSegment,
  updateSegment,
  deleteSegment,
  getSegmentCustomers,
  previewSegment,
} from '../controllers/segmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getSegments)
  .post(protect, createSegment);

router.post('/preview', protect, previewSegment);

router.route('/:id')
  .get(protect, getSegmentById)
  .put(protect, updateSegment)
  .delete(protect, deleteSegment);

router.route('/:id/customers')
  .get(protect, getSegmentCustomers);

export default router;