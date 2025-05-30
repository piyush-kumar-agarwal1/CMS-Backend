import express from 'express';
import { 
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { customerSchema } from '../validation/schemas.js';

const router = express.Router();


router.route('/new')
  .get(protect, (req, res) => {
    res.json({ message: 'Create new customer form' });
  });

router.route('/')
  .get(protect, getCustomers)
  .post(protect, validateRequest(customerSchema), createCustomer);

router.route('/:id')
  .get(protect, getCustomerById)
  .put(protect, validateRequest(customerSchema), updateCustomer)
  .delete(protect, deleteCustomer);

export default router;