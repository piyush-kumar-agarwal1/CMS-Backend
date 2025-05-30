import expressAsyncHandler from 'express-async-handler';
import Customer from '../models/customerModel.js';


const getCustomers = expressAsyncHandler(async (req, res) => {
  const customers = await Customer.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(customers);
});


const getCustomerById = expressAsyncHandler(async (req, res) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400);
    throw new Error('Invalid customer ID');
  }

  const customer = await Customer.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (customer) {
    res.json(customer);
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

const createCustomer = expressAsyncHandler(async (req, res) => {
  const { name, email, phone, total_spend, totalSpent, visits, last_active_date, status } = req.body;

  // Validate required fields
  if (!name || !email) {
    res.status(400);
    throw new Error('Name and email are required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  // Check if customer already exists for this user
  const customerExists = await Customer.findOne({ email, user: req.user._id });

  if (customerExists) {
    res.status(400);
    throw new Error('Customer with this email already exists');
  }

  // Handle both field names for total spent
  const finalTotalSpent = totalSpent || total_spend || 0;

  const customer = await Customer.create({
    user: req.user._id,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone || '',
    totalSpent: finalTotalSpent,
    total_spend: finalTotalSpent,
    visitCount: visits || 0,
    visits: visits || 0,
    lastVisit: last_active_date || new Date(),
    last_active_date: last_active_date || new Date(),
    status: status || 'active',
  });

  if (customer) {
    res.status(201).json(customer);
  } else {
    res.status(400);
    throw new Error('Invalid customer data');
  }
});

const updateCustomer = expressAsyncHandler(async (req, res) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400);
    throw new Error('Invalid customer ID');
  }

  const customer = await Customer.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (customer) {
    // Update fields
    customer.name = req.body.name || customer.name;
    customer.email = req.body.email || customer.email;
    customer.phone = req.body.phone || customer.phone;

    // Handle both field names for total spent
    if (req.body.totalSpent !== undefined) {
      customer.totalSpent = req.body.totalSpent;
      customer.total_spend = req.body.totalSpent;
    } else if (req.body.total_spend !== undefined) {
      customer.total_spend = req.body.total_spend;
      customer.totalSpent = req.body.total_spend;
    }

    // Handle visit counts
    if (req.body.visitCount !== undefined) {
      customer.visitCount = req.body.visitCount;
      customer.visits = req.body.visitCount;
    } else if (req.body.visits !== undefined) {
      customer.visits = req.body.visits;
      customer.visitCount = req.body.visits;
    }

    if (req.body.lastVisit) {
      customer.lastVisit = req.body.lastVisit;
      customer.last_active_date = req.body.lastVisit;
    } else if (req.body.last_active_date) {
      customer.last_active_date = req.body.last_active_date;
      customer.lastVisit = req.body.last_active_date;
    }

    if (req.body.status) {
      customer.status = req.body.status;
    }

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

const deleteCustomer = expressAsyncHandler(async (req, res) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400);
    throw new Error('Invalid customer ID');
  }

  const customer = await Customer.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (customer) {
    await Customer.deleteOne({ _id: customer._id });
    res.json({ message: 'Customer removed' });
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

export {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};