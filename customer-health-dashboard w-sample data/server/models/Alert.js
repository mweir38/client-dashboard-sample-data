const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['health-score', 'integration', 'qbr', 'onboarding', 'financial', 'custom']
  },
  severity: {
    type: String,
    required: true,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'acknowledged', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolutionNotes: String,
  // Alert metadata
  source: {
    type: String,
    enum: ['system', 'manual', 'integration'],
    default: 'system'
  },
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Integration specific data
  integrationData: {
    source: String, // 'jira', 'zendesk', 'hubspot'
    externalId: String,
    url: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  // Alert lifecycle
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date,
  // Escalation
  escalationLevel: {
    type: Number,
    default: 0
  },
  escalatedAt: Date,
  escalationNotes: String
});

// Update the updatedAt field on save
AlertSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
AlertSchema.index({ customerId: 1, status: 1, severity: 1 });
AlertSchema.index({ createdAt: -1 });
AlertSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('Alert', AlertSchema); 