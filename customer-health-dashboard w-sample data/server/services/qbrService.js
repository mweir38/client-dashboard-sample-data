const Customer = require('../models/Customer');
const QBR = require('../models/QBR');
const Feedback = require('../models/Feedback');
const jiraService = require('./jiraService');
const zendeskService = require('./zendeskService');
const hubspotService = require('./hubspotService');

class QBRService {
  // Generate a comprehensive QBR for a customer
  async generateQBR(customerId, quarter, year, userId) {
    try {
      const quarterNumber = parseInt(quarter.replace('Q', ''));
      
      // Check if QBR already exists
      const existingQBR = await QBR.findOne({
        customerId,
        year,
        quarterNumber
      });
      
      if (existingQBR) {
        throw new Error(`QBR for ${quarter} ${year} already exists for this customer`);
      }

      // Get customer data
      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Calculate quarter date range
      const quarterStart = new Date(year, (quarterNumber - 1) * 3, 1);
      const quarterEnd = new Date(year, quarterNumber * 3, 0);
      
      // Get previous quarter for comparison
      const prevQuarter = quarterNumber === 1 ? 4 : quarterNumber - 1;
      const prevYear = quarterNumber === 1 ? year - 1 : year;
      const prevQuarterStart = new Date(prevYear, (prevQuarter - 1) * 3, 1);
      const prevQuarterEnd = new Date(prevYear, prevQuarter * 3, 0);

      // Gather all data needed for QBR
      const [
        currentMetrics,
        previousMetrics,
        feedbackData,
        integrationData
      ] = await Promise.all([
        this.getQuarterMetrics(customer, quarterStart, quarterEnd),
        this.getQuarterMetrics(customer, prevQuarterStart, prevQuarterEnd),
        this.getFeedbackAnalysis(customerId, quarterStart, quarterEnd),
        this.getIntegrationMetrics(customer, quarterStart, quarterEnd)
      ]);

      // Generate QBR sections
      const qbrData = {
        customerId,
        quarter: `Q${quarterNumber} ${year}`,
        year,
        quarterNumber,
        generatedBy: userId,
        
        executiveSummary: await this.generateExecutiveSummary(customer, currentMetrics, previousMetrics, feedbackData),
        businessMetrics: this.calculateBusinessMetrics(currentMetrics, previousMetrics),
        healthAnalysis: this.analyzeHealthTrend(customer, currentMetrics, previousMetrics),
        integrationMetrics: integrationData,
        feedbackAnalysis: feedbackData,
        goalsReview: await this.reviewGoals(customer, quarterNumber, year),
        riskAssessment: this.assessRisks(customer, currentMetrics, feedbackData),
        actionPlan: await this.generateActionPlan(customer, currentMetrics, feedbackData)
      };

      // Save QBR to database
      const qbr = new QBR(qbrData);
      await qbr.save();

      return qbr;
    } catch (error) {
      console.error('Error generating QBR:', error);
      throw error;
    }
  }

  // Get metrics for a specific quarter
  async getQuarterMetrics(customer, startDate, endDate) {
    // In a real implementation, you'd query actual usage/metrics data
    // For now, we'll use the customer's current data as a baseline
    return {
      healthScore: customer.healthScore || 75,
      arr: customer.arr || 0,
      userCount: customer.userCount || 0,
      supportTickets: Math.floor(Math.random() * 50) + 10,
      criticalIssues: Math.floor(Math.random() * 5),
      featureAdoption: Math.floor(Math.random() * 40) + 60,
      engagementScore: Math.floor(Math.random() * 30) + 70
    };
  }

  // Analyze feedback for the quarter
  async getFeedbackAnalysis(customerId, startDate, endDate) {
    try {
      const feedback = await Feedback.find({
        customerId,
        createdAt: { $gte: startDate, $lte: endDate }
      });

      const totalFeedback = feedback.length;
      const positiveCount = feedback.filter(f => f.sentiment === 'positive').length;
      const negativeCount = feedback.filter(f => f.sentiment === 'negative').length;
      const neutralCount = feedback.filter(f => f.sentiment === 'neutral').length;

      // Extract key themes from feedback
      const keyThemes = this.extractKeyThemes(feedback);
      const actionItems = this.generateFeedbackActionItems(feedback);

      return {
        totalFeedback,
        positiveCount,
        negativeCount,
        neutralCount,
        sentimentTrend: this.calculateSentimentTrend(positiveCount, negativeCount, totalFeedback),
        keyThemes,
        actionItems
      };
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      return {
        totalFeedback: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        sentimentTrend: 'stable',
        keyThemes: [],
        actionItems: []
      };
    }
  }

  // Get integration metrics for the quarter
  async getIntegrationMetrics(customer, startDate, endDate) {
    const metrics = {
      jira: {
        totalTickets: 0,
        resolvedTickets: 0,
        avgResolutionTime: 0,
        criticalIssues: 0
      },
      zendesk: {
        totalTickets: 0,
        satisfactionScore: 0,
        avgResponseTime: 0,
        escalations: 0
      },
      hubspot: {
        engagementScore: 0,
        meetingsHeld: 0,
        emailOpens: 0,
        lifecycleStage: 'unknown'
      }
    };

    try {
      // Get Jira metrics
      if (customer.integrations?.jira?.enabled) {
        const jiraData = await jiraService.getCustomerMetrics(customer._id);
        metrics.jira = {
          totalTickets: jiraData.totalIssues || 0,
          resolvedTickets: jiraData.resolvedIssues || 0,
          avgResolutionTime: jiraData.avgResolutionTime || 0,
          criticalIssues: jiraData.criticalIssues || 0
        };
      }

      // Get Zendesk metrics
      if (customer.integrations?.zendesk?.enabled) {
        const zendeskData = await zendeskService.getCustomerMetrics(customer._id);
        metrics.zendesk = {
          totalTickets: zendeskData.totalTickets || 0,
          satisfactionScore: zendeskData.satisfactionScore || 0,
          avgResponseTime: zendeskData.avgResponseTime || 0,
          escalations: zendeskData.escalations || 0
        };
      }

      // Get HubSpot metrics
      if (customer.integrations?.hubspot?.enabled) {
        const hubspotData = await hubspotService.getCustomerMetrics(customer._id);
        metrics.hubspot = {
          engagementScore: hubspotData.engagementScore || 0,
          meetingsHeld: hubspotData.meetingsHeld || 0,
          emailOpens: hubspotData.emailOpens || 0,
          lifecycleStage: hubspotData.lifecycleStage || 'unknown'
        };
      }
    } catch (error) {
      console.error('Error fetching integration metrics:', error);
    }

    return metrics;
  }

  // Generate executive summary
  async generateExecutiveSummary(customer, currentMetrics, previousMetrics, feedbackData) {
    const healthTrend = currentMetrics.healthScore > previousMetrics.healthScore ? 'improving' : 
                      currentMetrics.healthScore < previousMetrics.healthScore ? 'declining' : 'stable';
    
    const overallHealth = currentMetrics.healthScore >= 80 ? 'Excellent' :
                         currentMetrics.healthScore >= 60 ? 'Good' :
                         currentMetrics.healthScore >= 40 ? 'At Risk' : 'Critical';

    const keyAchievements = [];
    const majorChallenges = [];
    const recommendations = [];

    // Analyze achievements
    if (currentMetrics.healthScore > previousMetrics.healthScore) {
      keyAchievements.push(`Health score improved by ${(currentMetrics.healthScore - previousMetrics.healthScore).toFixed(1)} points`);
    }
    if (currentMetrics.arr > previousMetrics.arr) {
      const growth = ((currentMetrics.arr - previousMetrics.arr) / previousMetrics.arr * 100).toFixed(1);
      keyAchievements.push(`ARR grew by ${growth}%`);
    }
    if (feedbackData.positiveCount > feedbackData.negativeCount) {
      keyAchievements.push(`Positive customer sentiment with ${feedbackData.positiveCount} positive feedback items`);
    }

    // Identify challenges
    if (currentMetrics.criticalIssues > 0) {
      majorChallenges.push(`${currentMetrics.criticalIssues} critical issues requiring immediate attention`);
    }
    if (feedbackData.negativeCount > feedbackData.positiveCount) {
      majorChallenges.push(`Negative sentiment trend with ${feedbackData.negativeCount} negative feedback items`);
    }
    if (currentMetrics.healthScore < 60) {
      majorChallenges.push('Customer health score below acceptable threshold');
    }

    // Generate recommendations
    if (currentMetrics.healthScore < 70) {
      recommendations.push('Schedule immediate customer success intervention');
    }
    if (currentMetrics.criticalIssues > 0) {
      recommendations.push('Prioritize resolution of critical technical issues');
    }
    if (feedbackData.negativeCount > 0) {
      recommendations.push('Address customer concerns identified in feedback analysis');
    }
    if (currentMetrics.featureAdoption < 70) {
      recommendations.push('Implement feature adoption program to increase product utilization');
    }

    return {
      overallHealth,
      keyAchievements,
      majorChallenges,
      recommendations
    };
  }

  // Calculate business metrics comparison
  calculateBusinessMetrics(currentMetrics, previousMetrics) {
    const arrGrowth = previousMetrics.arr > 0 ? 
      ((currentMetrics.arr - previousMetrics.arr) / previousMetrics.arr * 100) : 0;
    
    const userGrowth = previousMetrics.userCount > 0 ? 
      ((currentMetrics.userCount - previousMetrics.userCount) / previousMetrics.userCount * 100) : 0;

    return {
      arr: currentMetrics.arr,
      arrGrowth: Math.round(arrGrowth * 100) / 100,
      userGrowth: Math.round(userGrowth * 100) / 100,
      featureAdoption: currentMetrics.featureAdoption,
      supportTickets: currentMetrics.supportTickets,
      criticalIssues: currentMetrics.criticalIssues
    };
  }

  // Analyze health score trend
  analyzeHealthTrend(customer, currentMetrics, previousMetrics) {
    const scoreDiff = currentMetrics.healthScore - previousMetrics.healthScore;
    const trend = scoreDiff > 5 ? 'improving' : scoreDiff < -5 ? 'declining' : 'stable';

    const factors = [];
    
    if (currentMetrics.criticalIssues > 0) {
      factors.push({
        category: 'Technical Issues',
        impact: 'negative',
        description: `${currentMetrics.criticalIssues} critical issues affecting customer experience`
      });
    }
    
    if (currentMetrics.featureAdoption > 80) {
      factors.push({
        category: 'Product Adoption',
        impact: 'positive',
        description: 'High feature adoption rate indicates strong product engagement'
      });
    }
    
    if (currentMetrics.supportTickets > previousMetrics.supportTickets) {
      factors.push({
        category: 'Support Volume',
        impact: 'negative',
        description: 'Increased support ticket volume may indicate customer friction'
      });
    }

    return {
      currentScore: currentMetrics.healthScore,
      previousScore: previousMetrics.healthScore,
      trend,
      factors
    };
  }

  // Review goals (placeholder - would integrate with goal tracking system)
  async reviewGoals(customer, quarterNumber, year) {
    return {
      previousGoals: [
        {
          goal: 'Increase feature adoption by 20%',
          status: 'in-progress',
          notes: 'Currently at 15% increase, on track for completion'
        },
        {
          goal: 'Reduce support ticket volume by 10%',
          status: 'achieved',
          notes: 'Successfully reduced tickets by 12% through proactive support'
        }
      ],
      upcomingGoals: [
        {
          goal: 'Implement advanced analytics features',
          timeline: 'Next quarter',
          owner: 'Product Team'
        },
        {
          goal: 'Conduct user training sessions',
          timeline: '30 days',
          owner: 'Customer Success'
        }
      ]
    };
  }

  // Assess renewal and churn risks
  assessRisks(customer, currentMetrics, feedbackData) {
    let renewalRisk = 'low';
    let churnProbability = 10;
    const riskFactors = [];
    const mitigationStrategies = [];

    // Assess risk factors
    if (currentMetrics.healthScore < 60) {
      renewalRisk = 'high';
      churnProbability += 40;
      riskFactors.push('Low health score indicates customer dissatisfaction');
      mitigationStrategies.push('Schedule immediate executive business review');
    }

    if (feedbackData.negativeCount > feedbackData.positiveCount) {
      renewalRisk = renewalRisk === 'high' ? 'high' : 'medium';
      churnProbability += 20;
      riskFactors.push('Negative sentiment trend in customer feedback');
      mitigationStrategies.push('Address specific customer concerns identified in feedback');
    }

    if (currentMetrics.criticalIssues > 2) {
      renewalRisk = 'high';
      churnProbability += 30;
      riskFactors.push('Multiple critical technical issues affecting customer operations');
      mitigationStrategies.push('Escalate critical issues to engineering leadership');
    }

    if (currentMetrics.featureAdoption < 50) {
      renewalRisk = renewalRisk === 'low' ? 'medium' : renewalRisk;
      churnProbability += 15;
      riskFactors.push('Low feature adoption suggests limited product value realization');
      mitigationStrategies.push('Implement comprehensive onboarding and training program');
    }

    return {
      renewalRisk,
      churnProbability: Math.min(churnProbability, 95),
      riskFactors,
      mitigationStrategies
    };
  }

  // Generate action plan
  async generateActionPlan(customer, currentMetrics, feedbackData) {
    const immediateActions = [];
    const longTermInitiatives = [];

    // Immediate actions based on current state
    if (currentMetrics.criticalIssues > 0) {
      immediateActions.push({
        action: 'Resolve all critical technical issues',
        owner: 'Engineering Team',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        priority: 'high'
      });
    }

    if (feedbackData.negativeCount > 0) {
      immediateActions.push({
        action: 'Follow up on negative customer feedback',
        owner: 'Customer Success Manager',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        priority: 'high'
      });
    }

    if (currentMetrics.healthScore < 70) {
      immediateActions.push({
        action: 'Schedule customer health intervention meeting',
        owner: 'Account Manager',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        priority: 'medium'
      });
    }

    // Long-term initiatives
    if (currentMetrics.featureAdoption < 80) {
      longTermInitiatives.push({
        initiative: 'Comprehensive product training program',
        timeline: '60 days',
        expectedOutcome: 'Increase feature adoption to 85%+'
      });
    }

    longTermInitiatives.push({
      initiative: 'Quarterly business review process optimization',
      timeline: '90 days',
      expectedOutcome: 'Improved customer relationship management and proactive issue identification'
    });

    return {
      immediateActions,
      longTermInitiatives
    };
  }

  // Helper methods
  extractKeyThemes(feedback) {
    const themes = [];
    const commonWords = {};
    
    feedback.forEach(f => {
      if (f.content) {
        const words = f.content.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 4) { // Only consider meaningful words
            commonWords[word] = (commonWords[word] || 0) + 1;
          }
        });
      }
    });

    // Get top themes
    const sortedWords = Object.entries(commonWords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    return sortedWords.length > 0 ? sortedWords : ['No significant themes identified'];
  }

  generateFeedbackActionItems(feedback) {
    const actionItems = [];
    
    feedback.filter(f => f.sentiment === 'negative').forEach(f => {
      if (f.content && f.content.toLowerCase().includes('bug')) {
        actionItems.push('Investigate and resolve reported bugs');
      }
      if (f.content && f.content.toLowerCase().includes('slow')) {
        actionItems.push('Optimize system performance');
      }
      if (f.content && f.content.toLowerCase().includes('support')) {
        actionItems.push('Improve customer support response times');
      }
    });

    return actionItems.length > 0 ? [...new Set(actionItems)] : ['No specific action items identified'];
  }

  calculateSentimentTrend(positive, negative, total) {
    if (total === 0) return 'stable';
    const ratio = positive / total;
    return ratio > 0.6 ? 'positive' : ratio < 0.4 ? 'negative' : 'stable';
  }

  // Get all QBRs for a customer
  async getCustomerQBRs(customerId) {
    return await QBR.find({ customerId })
      .populate('generatedBy', 'name email')
      .sort({ year: -1, quarterNumber: -1 });
  }

  // Get specific QBR
  async getQBR(qbrId) {
    return await QBR.findById(qbrId)
      .populate('customerId', 'name')
      .populate('generatedBy', 'name email');
  }

  // Delete QBR
  async deleteQBR(qbrId) {
    return await QBR.findByIdAndDelete(qbrId);
  }
}

module.exports = new QBRService();