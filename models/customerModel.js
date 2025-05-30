import mongoose from 'mongoose';

const customerSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: [0, 'Total spent cannot be negative'],
    },
    total_spend: {
      type: Number,
      default: 0,
      min: [0, 'Total spend cannot be negative'],
    },
    visitCount: {
      type: Number,
      default: 0,
      min: [0, 'Visit count cannot be negative'],
    },
    visits: {
      type: Number,
      default: 0,
      min: [0, 'Visits cannot be negative'],
    },
    lastVisit: {
      type: Date,
      default: Date.now,
    },
    last_active_date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for user and email
customerSchema.index({ user: 1, email: 1 }, { unique: true });

// Pre-save middleware to sync fields
customerSchema.pre('save', function(next) {
  // Sync totalSpent and total_spend
  if (this.isModified('totalSpent')) {
    this.total_spend = this.totalSpent;
  } else if (this.isModified('total_spend')) {
    this.totalSpent = this.total_spend;
  }
  
  // Sync visitCount and visits
  if (this.isModified('visitCount')) {
    this.visits = this.visitCount;
  } else if (this.isModified('visits')) {
    this.visitCount = this.visits;
  }
  
  // Sync lastVisit and last_active_date
  if (this.isModified('lastVisit')) {
    this.last_active_date = this.lastVisit;
  } else if (this.isModified('last_active_date')) {
    this.lastVisit = this.last_active_date;
  }
  
  next();
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;