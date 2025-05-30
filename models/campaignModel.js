import mongoose from 'mongoose';

const campaignSchema = mongoose.Schema(
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
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'social'],
      required: true,
    },
    segment: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Segment',
    },
    content: {
      subject: { type: String },
      body: { type: String, required: true },
      template: { type: String },
      mediaUrl: { type: String },
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'],
      default: 'draft',
    },
    metrics: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;