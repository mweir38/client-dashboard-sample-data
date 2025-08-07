const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  healthScore: { type: Number, default: 0 },
  arr: { type: Number, default: 0 },
  healthScoreHistory: [
    {
      date: { type: Date, default: Date.now },
      score: { type: Number },
    },
  ],
  tools: [{ type: String }],
  
  // Third-party integration data
  integrations: {
    jira: {
      projectKey: { type: String },
      openIssues: { type: Number, default: 0 },
      resolvedIssues: { type: Number, default: 0 },
      avgResolutionTime: { type: Number, default: 0 }, // in hours
      criticalIssues: { type: Number, default: 0 },
      lastSync: { type: Date }
    },
    zendesk: {
      organizationId: { type: String },
      openTickets: { type: Number, default: 0 },
      solvedTickets: { type: Number, default: 0 },
      avgResponseTime: { type: Number, default: 0 }, // in hours
      satisfactionScore: { type: Number, default: 0 }, // 1-5 scale
      escalatedTickets: { type: Number, default: 0 },
      lastSync: { type: Date }
    },
    hubspot: {
      companyId: { type: String },
      lastActivity: { type: Date },
      engagementScore: { type: Number, default: 0 }, // 0-100
      dealStage: { type: String },
      totalDeals: { type: Number, default: 0 },
      wonDeals: { type: Number, default: 0 },
      emailOpens: { type: Number, default: 0 },
      emailClicks: { type: Number, default: 0 },
      lastSync: { type: Date }
    }
  },
  
  // Calculated metrics from integrations
  metrics: {
    supportHealth: { type: Number, default: 0 }, // 0-100
    developmentHealth: { type: Number, default: 0 }, // 0-100
    salesHealth: { type: Number, default: 0 }, // 0-100
    overallEngagement: { type: Number, default: 0 }, // 0-100
    lastCalculated: { type: Date }
  },
  
  // Additional customer data for alerts
  feedback: [{
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    date: { type: Date, default: Date.now },
    source: String
  }],
  
  sentimentTrend: [{
    score: { type: Number, min: 0, max: 100 },
    date: { type: Date, default: Date.now }
  }],
  
  ticketVolume: { type: Number, default: 0 },
  productUsage: [{
    name: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['OC', 'OC2', 'EFB', 'Flight Planner', 'PCS', 'VMO Manager', 'Other'],
      required: true 
    },
    customName: { type: String } // For when type is 'Other'
  }],
  renewalLikelihood: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  
  socialStats: {
    linkedin: { type: Number, default: 0 },
    twitter: { type: Number, default: 0 }
  },
  
  // Renewal and contract information
  renewalDate: { type: Date },
  contractValue: { type: Number, default: 0 },
  
  // Integration data cache
  integrationData: {
    jira: {
      projectKey: String,
      openIssues: { type: Number, default: 0 },
      resolvedIssues: { type: Number, default: 0 },
      avgResolutionTime: { type: Number, default: 0 },
      criticalIssues: { type: Number, default: 0 },
      lastSync: Date
    },
    zendesk: {
      organizationId: String,
      openTickets: { type: Number, default: 0 },
      solvedTickets: { type: Number, default: 0 },
      urgentTickets: { type: Number, default: 0 },
      avgFirstResponseTime: { type: Number, default: 0 },
      satisfactionScore: { type: Number, default: 0 },
      totalRatings: { type: Number, default: 0 },
      lastSync: Date
    },
    hubspot: {
      companyId: String,
      totalDeals: { type: Number, default: 0 },
      wonDeals: { type: Number, default: 0 },
      openDeals: { type: Number, default: 0 },
      totalDealValue: { type: Number, default: 0 },
      wonDealValue: { type: Number, default: 0 },
      contactCount: { type: Number, default: 0 },
      lifecycleStage: { type: String, default: 'unknown' },
      daysSinceLastActivity: { type: Number, default: 0 },
      annualRevenue: { type: Number, default: 0 },
      lastSync: Date
    }
  },
  
  // AI-generated insights and alerts
  aiSummary: String,
  lastAISummaryUpdate: Date,
  lastHealthScoreUpdate: Date,
  
  // Sample data for demo purposes
  sampleData: {
    jiraTickets: [{
      key: String,
      id: String,
      summary: String,
      description: String,
      status: String,
      priority: String,
      assignee: String,
      reporter: String,
      created: Date,
      updated: Date,
      resolved: Date,
      issueType: String,
      labels: [String],
      components: [String]
    }],
    zendeskTickets: [{
      id: String,
      subject: String,
      description: String,
      status: String,
      priority: String,
      requester: String,
      assignee: String,
      created_at: Date,
      updated_at: Date,
      solved_at: Date,
      first_response_time: Number,
      tags: [String]
    }]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);