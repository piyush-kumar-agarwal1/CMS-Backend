import Joi from 'joi';

export const customerSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  email: Joi.string().required().email(),
  phone: Joi.string().pattern(/^\+?[\d\s-()]{10,}$/).allow(''),
  total_spend: Joi.number().min(0).default(0),
  visits: Joi.number().integer().min(0).default(0),
  last_active_date: Joi.date().default(Date.now),
  status: Joi.string().valid('active', 'inactive', 'pending').default('active'),
});

export const orderSchema = Joi.object({
  order_id: Joi.string().required(),
  customer_id: Joi.string().required(),
  amount: Joi.number().required().min(0),
  date: Joi.date().default(Date.now),
});