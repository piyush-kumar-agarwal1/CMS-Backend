import expressAsyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import Customer from '../models/customerModel.js';


const getOrders = expressAsyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('customer_id', 'name email')
    .sort({ date: -1 });
  res.json(orders);
});


const getOrderById = expressAsyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer_id', 'name email');

  if (order && order.user.equals(req.user._id)) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});


const createOrder = expressAsyncHandler(async (req, res) => {
  const { order_id, customer_id, amount, date } = req.body;

 
  const customer = await Customer.findOne({ 
    _id: customer_id,
    user: req.user._id 
  });

  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const orderExists = await Order.findOne({ order_id });
  if (orderExists) {
    res.status(400);
    throw new Error('Order ID already exists');
  }

  const order = await Order.create({
    user: req.user._id,
    order_id,
    customer_id,
    amount,
    date: date || Date.now(),
  });

  if (order) {
    // Update customer total spend
    customer.total_spend += amount;
    customer.visits += 1;
    customer.last_active_date = Date.now();
    await customer.save();

    res.status(201).json(order);
  } else {
    res.status(400);
    throw new Error('Invalid order data');
  }
});

export { getOrders, getOrderById, createOrder };