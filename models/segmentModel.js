import mongoose from 'mongoose';

const conditionSchema = mongoose.Schema(
  {
    field: {
      type: String,
      required: true,
    },
    operator: {
      type: String,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const segmentSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    conditions: [conditionSchema],
    conditionLogic: {
      type: String,
      enum: ['AND', 'OR'],
      default: 'AND',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    estimatedCount: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Segment = mongoose.model('Segment', segmentSchema);

export default Segment;