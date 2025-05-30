import mongoose from 'mongoose';

const communicationLogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Customer',
    },
    segment: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Segment',
    },
    status: {
      type: String,
      enum: ['SENT', 'FAILED'],
      required: true,
    },
    failureReason: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const CommunicationLog = mongoose.model('CommunicationLog', communicationLogSchema);

export default CommunicationLog;