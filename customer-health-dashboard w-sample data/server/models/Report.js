const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['customer-health', 'qbr', 'onboarding', 'alerts', 'integrations', 'financial', 'custom'],
    required: true
  },
  description: String,
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  // Report filters and parameters
  filters: {
    dateRange: {
      start: Date,
      end: Date
    },
    customers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    }],
    healthScoreRange: {
      min: Number,
      max: Number
    },
    arrRange: {
      min: Number,
      max: Number
    },
    status: [String],
    tags: [String]
  },
  // Report data and metrics
  data: {
    summary: {
      totalCustomers: Number,
      healthyCustomers: Number,
      atRiskCustomers: Number,
      criticalCustomers: Number,
      totalARR: Number,
      averageHealthScore: Number
    },
    metrics: {
      healthScoreDistribution: [{
        range: String,
        count: Number,
        percentage: Number
      }],
      arrDistribution: [{
        range: String,
        count: Number,
        percentage: Number
      }],
      integrationStatus: {
        jira: Number,
        zendesk: Number,
        hubspot: Number
      },
      alertsByType: [{
        type: String,
        count: Number
      }]
    },
    trends: [{
      date: Date,
      healthScore: Number,
      customerCount: Number
    }],
    topCustomers: [{
      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
      },
      healthScore: Number,
      arr: Number,
      status: String
    }]
  },
  // Report configuration
  config: {
    includeCharts: {
      type: Boolean,
      default: true
    },
    includeTables: {
      type: Boolean,
      default: true
    },
    includeTrends: {
      type: Boolean,
      default: true
    },
    includeRecommendations: {
      type: Boolean,
      default: true
    },
    format: {
      type: String,
      enum: ['pdf', 'excel', 'csv', 'json'],
      default: 'pdf'
    }
  },
  // Report status and metadata
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed', 'archived'],
    default: 'generating'
  },
  filePath: String,
  fileSize: Number,
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: Date,
  // Scheduling
  schedule: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly']
    },
    nextRun: Date,
    recipients: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
ReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Report', ReportSchema); 