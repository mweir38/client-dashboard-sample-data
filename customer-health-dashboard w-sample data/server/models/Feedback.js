const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['product', 'support', 'sales', 'general'],
    default: 'general'
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  source: {
    type: String,
    enum: ['survey', 'support_ticket', 'sales_call', 'email', 'other'],
    default: 'survey'
  },
  date: {
    type: Date,
    default: Date.now
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient queries
FeedbackSchema.index({ customerId: 1, date: -1 });
FeedbackSchema.index({ rating: 1 });
FeedbackSchema.index({ sentiment: 1 });
FeedbackSchema.index({ category: 1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);