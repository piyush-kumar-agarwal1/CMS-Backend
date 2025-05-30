import mongoose from 'mongoose';

const messageSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Campaign',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Customer',
    },
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'social'],
      required: true,
    },
    content: {
      subject: { type: String },
      body: { type: String, required: true },
      mediaUrl: { type: String },
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'failed', 'opened', 'clicked'],
      default: 'queued',
    },
    sentAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    openedAt: {
      type: Date,
    },
    clickedAt: {
      type: Date,
    },
    failedReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;