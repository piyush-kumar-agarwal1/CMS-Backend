import expressAsyncHandler from 'express-async-handler';
import Segment from '../models/segmentModel.js';
import Customer from '../models/customerModel.js';


const getSegments = expressAsyncHandler(async (req, res) => {
  const segments = await Segment.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(segments);
});


const getSegmentById = expressAsyncHandler(async (req, res) => {
  const segment = await Segment.findById(req.params.id);

  if (segment && segment.user.equals(req.user._id)) {
    res.json(segment);
  } else {
    res.status(404);
    throw new Error('Segment not found');
  }
});

const buildSegmentQuery = (conditions, conditionLogic) => {
  if (!conditions || conditions.length === 0) {
    return {};
  }

  const queries = conditions.rules.map((rule) => {
    const { field, operator, value } = rule;
    let query = {};

    switch (operator) {
      case '>':
        query[field] = { $gt: parseFloat(value) };
        break;
      case '<':
        query[field] = { $lt: parseFloat(value) };
        break;
      case '=':
        query[field] = parseFloat(value);
        break;
      case 'before':
        query[field] = { $lt: new Date(value) };
        break;
      case 'after':
        query[field] = { $gt: new Date(value) };
        break;
      case 'between':
        const [start, end] = value.split(',').map(d => new Date(d.trim()));
        query[field] = { $gte: start, $lte: end };
        break;
      default:

        break;
    }

    return query;
  });

  return conditionLogic === 'OR' ? { $or: queries } : { $and: queries };
};

const previewSegment = expressAsyncHandler(async (req, res) => {
  const { conditions } = req.body;

  const query = buildSegmentQuery(conditions, conditions.combinator);
  const count = await Customer.countDocuments({
    ...query,
    user: req.user._id
  });

  res.json({ count });
});

const createSegment = expressAsyncHandler(async (req, res) => {
  const { name, description, criteria } = req.body;

  if (!criteria || !criteria.rules || criteria.rules.length === 0) {
    res.status(400);
    throw new Error('Segment criteria is required');
  }

  const segment = await Segment.create({
    user: req.user._id,
    name,
    description,
    conditions: criteria.rules,
    conditionLogic: criteria.logic || 'AND',
  });

  if (segment) {
    // Calculate estimated count
    const query = buildSegmentQuery({ rules: criteria.rules }, criteria.logic || 'AND');
    const count = await Customer.countDocuments({
      ...query,
      user: req.user._id
    });

    segment.estimatedCount = count;
    segment.lastUpdated = Date.now();
    await segment.save();

    res.status(201).json(segment);
  } else {
    res.status(400);
    throw new Error('Invalid segment data');
  }
});

const updateSegment = expressAsyncHandler(async (req, res) => {
  const segment = await Segment.findById(req.params.id);

  if (segment && segment.user.equals(req.user._id)) {
    segment.name = req.body.name || segment.name;
    segment.description = req.body.description || segment.description;
    segment.conditions = req.body.conditions || segment.conditions;
    segment.conditionLogic = req.body.conditionLogic || segment.conditionLogic;
    segment.isActive = req.body.isActive !== undefined ? req.body.isActive : segment.isActive;
    segment.lastUpdated = Date.now();


    const query = buildSegmentQuery(segment.conditions, segment.conditionLogic);
    const count = await Customer.countDocuments({
      ...query,
      user: req.user._id
    });

    segment.estimatedCount = count;

    const updatedSegment = await segment.save();
    res.json(updatedSegment);
  } else {
    res.status(404);
    throw new Error('Segment not found');
  }
});

const deleteSegment = expressAsyncHandler(async (req, res) => {
  const segment = await Segment.findById(req.params.id);

  if (segment && segment.user.equals(req.user._id)) {
    await Segment.deleteOne({ _id: segment._id });
    res.json({ message: 'Segment removed' });
  } else {
    res.status(404);
    throw new Error('Segment not found');
  }
});


const getSegmentCustomers = expressAsyncHandler(async (req, res) => {
  const segment = await Segment.findById(req.params.id);

  if (segment && segment.user.equals(req.user._id)) {
    const query = buildSegmentQuery(segment.conditions, segment.conditionLogic);
    const customers = await Customer.find({
      ...query,
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(customers);
  } else {
    res.status(404);
    throw new Error('Segment not found');
  }
});

export {
  getSegments,
  getSegmentById,
  createSegment,
  updateSegment,
  deleteSegment,
  getSegmentCustomers,
  previewSegment
};