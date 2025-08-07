const mongoose = require('mongoose');

const qbrSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  quarter: {
    type: String,
    required: true // Format: "Q1 2024"
  },
  year: {
    type: Number,
    required: true
  },
  quarterNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Executive Summary
  executiveSummary: {
    overallHealth: String,
    keyAchievements: [String],
    majorChallenges: [String],
    recommendations: [String]
  },
  
  // Business Metrics
  businessMetrics: {
    arr: Number,
    arrGrowth: Number, // percentage
    userGrowth: Number, // percentage
    featureAdoption: Number, // percentage
    supportTickets: Number,
    criticalIssues: Number
  },
  
  // Health Score Analysis
  healthAnalysis: {
    currentScore: Number,
    previousScore: Number,
    trend: String, // 'improving', 'stable', 'declining'
    factors: [{
      category: String,
      impact: String, // 'positive', 'negative', 'neutral'
      description: String
    }]
  },
  
  // Integration Performance
  integrationMetrics: {
    jira: {
      totalTickets: Number,
      resolvedTickets: Number,
      avgResolutionTime: Number,
      criticalIssues: Number
    },
    zendesk: {
      totalTickets: Number,
      satisfactionScore: Number,
      avgResponseTime: Number,
      escalations: Number
    },
    hubspot: {
      engagementScore: Number,
      meetingsHeld: Number,
      emailOpens: Number,
      lifecycleStage: String
    }
  },
  
  // Feedback Analysis
  feedbackAnalysis: {
    totalFeedback: Number,
    positiveCount: Number,
    negativeCount: Number,
    neutralCount: Number,
    sentimentTrend: String,
    keyThemes: [String],
    actionItems: [String]
  },
  
  // Goals and Objectives
  goalsReview: {
    previousGoals: [{
      goal: String,
      status: String, // 'achieved', 'in-progress', 'missed'
      notes: String
    }],
    upcomingGoals: [{
      goal: String,
      timeline: String,
      owner: String
    }]
  },
  
  // Risk Assessment
  riskAssessment: {
    renewalRisk: String, // 'low', 'medium', 'high'
    churnProbability: Number, // percentage
    riskFactors: [String],
    mitigationStrategies: [String]
  },
  
  // Action Plan
  actionPlan: {
    immediateActions: [{
      action: String,
      owner: String,
      dueDate: Date,
      priority: String // 'high', 'medium', 'low'
    }],
    longTermInitiatives: [{
      initiative: String,
      timeline: String,
      expectedOutcome: String
    }]
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
qbrSchema.index({ customerId: 1, year: 1, quarterNumber: 1 }, { unique: true });

module.exports = mongoose.model('QBR', qbrSchema);