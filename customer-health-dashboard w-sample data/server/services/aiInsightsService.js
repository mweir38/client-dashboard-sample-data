const Customer = require('../models/Customer');
const Alert = require('../models/Alert');
const QBR = require('../models/QBR');
const OnboardingProject = require('../models/OnboardingProject');

class AIInsightsService {
  /**
   * Generate comprehensive AI insights for a customer
   */
  async generateCustomerInsights(customerId) {
    try {
      const customer = await Customer.findById(customerId)
        .populate('integrations')
        .populate('feedback');

      if (!customer) {
        throw new Error('Customer not found');
      }

      const insights = {
        customer: {
          id: customer._id,
          name: customer.name,
          arr: customer.arr,
          healthScore: customer.healthScore
        },
        riskAnalysis: await this.analyzeRiskFactors(customer),
        opportunities: await this.identifyOpportunities(customer),
        recommendations: await this.generateRecommendations(customer),
        trends: await this.analyzeTrends(customer),
        trendPatterns: this.analyzeTrendPatterns(customer),
        behaviorScore: this.generateBehaviorScore(customer),
        predictiveInsights: await this.generatePredictiveInsights(customer),
        actionItems: await this.generateActionItems(customer),
        priority: this.calculatePriority(customer)
      };

      return insights;
    } catch (error) {
      console.error('Error generating customer insights:', error);
      throw error;
    }
  }

  /**
   * Generate portfolio-wide AI insights
   */
  async generatePortfolioInsights(filters = {}) {
    try {
      const customers = await Customer.find(filters)
        .populate('integrations')
        .populate('feedback');

      const insights = {
        portfolioOverview: await this.analyzePortfolioHealth(customers),
        riskSegments: await this.identifyRiskSegments(customers),
        growthOpportunities: await this.identifyGrowthOpportunities(customers),
        churnPredictions: await this.predictPortfolioChurnRisk(customers),
        optimizationRecommendations: await this.generatePortfolioRecommendations(customers),
        marketInsights: await this.generateMarketInsights(customers),
        strategicRecommendations: await this.generateStrategicRecommendations(customers)
      };

      return insights;
    } catch (error) {
      console.error('Error generating portfolio insights:', error);
      throw error;
    }
  }

  /**
   * Analyze risk factors for a customer using advanced ML-inspired models
   */
  async analyzeRiskFactors(customer) {
    const risks = [];
    const riskScore = this.calculateComprehensiveRiskScore(customer);
    let overallRiskScore = 0;
    let riskFactors = 0;

    // Health Score Risk
    if (customer.healthScore < 4) {
      risks.push({
        type: 'critical_health',
        severity: 'critical',
        description: 'Customer health score is critically low',
        impact: 'High churn risk',
        probability: 0.8,
        recommendation: 'Immediate intervention required'
      });
      overallRiskScore += 0.8;
      riskFactors++;
    } else if (customer.healthScore < 7) {
      risks.push({
        type: 'declining_health',
        severity: 'warning',
        description: 'Customer health score is declining',
        impact: 'Medium churn risk',
        probability: 0.6,
        recommendation: 'Proactive engagement needed'
      });
      overallRiskScore += 0.6;
      riskFactors++;
    }

    // ARR Risk Analysis
    if (customer.arr > 100000) {
      if (customer.healthScore < 6) {
        risks.push({
          type: 'high_value_at_risk',
          severity: 'critical',
          description: 'High-value customer showing signs of dissatisfaction',
          impact: 'Significant revenue risk',
          probability: 0.7,
          recommendation: 'Executive-level intervention'
        });
        overallRiskScore += 0.7;
        riskFactors++;
      }
    }

    // Integration Health Risk
    if (customer.integrations) {
      const integrationIssues = this.analyzeIntegrationHealth(customer.integrations);
      if (integrationIssues.length > 0) {
        risks.push({
          type: 'integration_issues',
          severity: 'warning',
          description: 'Integration health issues detected',
          impact: 'Reduced customer satisfaction',
          probability: 0.5,
          recommendation: 'Review and fix integration issues',
          details: integrationIssues
        });
        overallRiskScore += 0.5;
        riskFactors++;
      }
    }

    // Usage Pattern Risk
    const usageRisk = this.analyzeUsagePatterns(customer);
    if (usageRisk) {
      risks.push(usageRisk);
      overallRiskScore += usageRisk.probability;
      riskFactors++;
    }

    // Support Ticket Risk
    const supportRisk = await this.analyzeSupportPatterns(customer);
    if (supportRisk) {
      risks.push(supportRisk);
      overallRiskScore += supportRisk.probability;
      riskFactors++;
    }

    return {
      risks,
      overallRiskScore: riskFactors > 0 ? overallRiskScore / riskFactors : 0,
      riskLevel: this.calculateRiskLevel(overallRiskScore / riskFactors),
      topRisks: risks.slice(0, 3)
    };
  }

  /**
   * Identify growth opportunities
   */
  async identifyOpportunities(customer) {
    const opportunities = [];

    // Upsell Opportunities
    if (customer.healthScore >= 8 && customer.arr < 200000) {
      opportunities.push({
        type: 'upsell',
        category: 'revenue_growth',
        description: 'High-health customer ready for expansion',
        potentialValue: customer.arr * 0.3,
        confidence: 0.8,
        recommendation: 'Present expansion opportunities',
        timeline: '30-60 days'
      });
    }

    // Feature Adoption Opportunities
    const featureOpportunities = this.analyzeFeatureAdoption(customer);
    opportunities.push(...featureOpportunities);

    // Referral Opportunities
    if (customer.healthScore >= 9) {
      opportunities.push({
        type: 'referral',
        category: 'network_effect',
        description: 'Highly satisfied customer likely to refer',
        potentialValue: customer.arr * 0.5,
        confidence: 0.7,
        recommendation: 'Ask for referrals and testimonials',
        timeline: '15-30 days'
      });
    }

    // Integration Expansion
    const integrationOpportunities = this.analyzeIntegrationOpportunities(customer);
    opportunities.push(...integrationOpportunities);

    return {
      opportunities,
      totalPotentialValue: opportunities.reduce((sum, opp) => sum + opp.potentialValue, 0),
      priorityOpportunities: opportunities.slice(0, 3)
    };
  }

  /**
   * Generate actionable recommendations
   */
  async generateRecommendations(customer) {
    const recommendations = [];

    // Health Score Based Recommendations
    if (customer.healthScore < 4) {
      recommendations.push({
        type: 'immediate_action',
        priority: 'critical',
        title: 'Immediate Customer Success Intervention',
        description: 'Customer requires immediate attention to prevent churn',
        actions: [
          'Schedule executive-level meeting within 24 hours',
          'Assign senior customer success manager',
          'Create recovery plan with specific milestones',
          'Offer immediate support and resources'
        ],
        expectedOutcome: 'Stabilize customer relationship and improve health score',
        timeline: '1-2 weeks'
      });
    } else if (customer.healthScore < 7) {
      recommendations.push({
        type: 'proactive_engagement',
        priority: 'high',
        title: 'Proactive Customer Engagement',
        description: 'Customer needs proactive engagement to improve satisfaction',
        actions: [
          'Schedule regular check-in calls',
          'Provide additional training and resources',
          'Identify and address pain points',
          'Create success plan with clear goals'
        ],
        expectedOutcome: 'Improve health score and customer satisfaction',
        timeline: '2-4 weeks'
      });
    }

    // ARR Based Recommendations
    if (customer.arr > 100000) {
      recommendations.push({
        type: 'strategic_account',
        priority: 'high',
        title: 'Strategic Account Management',
        description: 'High-value customer requires strategic attention',
        actions: [
          'Assign dedicated account manager',
          'Create quarterly business reviews',
          'Develop strategic roadmap',
          'Provide executive sponsorship'
        ],
        expectedOutcome: 'Strengthen relationship and identify growth opportunities',
        timeline: 'Ongoing'
      });
    }

    // Integration Based Recommendations
    if (customer.integrations) {
      const integrationRecs = this.generateIntegrationRecommendations(customer.integrations);
      recommendations.push(...integrationRecs);
    }

    // Usage Based Recommendations
    const usageRecs = this.generateUsageRecommendations(customer);
    recommendations.push(...usageRecs);

    return {
      recommendations,
      priorityRecommendations: recommendations.filter(r => r.priority === 'critical' || r.priority === 'high'),
      implementationPlan: this.createImplementationPlan(recommendations)
    };
  }

  /**
   * Analyze customer trends
   */
  async analyzeTrends(customer) {
    const trends = [];

    // Health Score Trend
    if (customer.healthScoreHistory && customer.healthScoreHistory.length > 1) {
      const recentScores = customer.healthScoreHistory.slice(-3).map(h => h.score);
      const trend = this.calculateTrend(recentScores);
      
      trends.push({
        metric: 'health_score',
        direction: trend.direction,
        magnitude: trend.magnitude,
        description: `Health score is ${trend.direction} by ${trend.magnitude}%`,
        confidence: trend.confidence,
        implications: this.getTrendImplications('health_score', trend)
      });
    }

    // Usage Trend Analysis
    const usageTrend = this.analyzeUsageTrends(customer);
    if (usageTrend) {
      trends.push(usageTrend);
    }

    // Support Trend Analysis
    const supportTrend = await this.analyzeSupportTrends(customer);
    if (supportTrend) {
      trends.push(supportTrend);
    }

    return {
      trends,
      overallTrend: this.calculateOverallTrend(trends),
      keyInsights: this.extractKeyInsights(trends)
    };
  }

  /**
   * Generate predictive insights
   */
  async generatePredictiveInsights(customer) {
    const predictions = [];

    // Churn Prediction
    const churnRisk = this.predictChurnRisk(customer);
    predictions.push({
      type: 'churn_prediction',
      metric: 'churn_risk',
      value: churnRisk.probability,
      confidence: churnRisk.confidence,
      timeframe: '90 days',
      factors: churnRisk.factors,
      recommendation: churnRisk.recommendation
    });

    // Health Score Prediction
    const healthPrediction = this.predictHealthScore(customer);
    predictions.push({
      type: 'health_prediction',
      metric: 'predicted_health_score',
      value: healthPrediction.score,
      confidence: healthPrediction.confidence,
      timeframe: '30 days',
      factors: healthPrediction.factors,
      recommendation: healthPrediction.recommendation
    });

    // Revenue Prediction
    const revenuePrediction = this.predictRevenue(customer);
    predictions.push({
      type: 'revenue_prediction',
      metric: 'predicted_arr',
      value: revenuePrediction.arr,
      confidence: revenuePrediction.confidence,
      timeframe: '12 months',
      factors: revenuePrediction.factors,
      recommendation: revenuePrediction.recommendation
    });

    return {
      predictions,
      overallPrediction: this.calculateOverallPrediction(predictions),
      confidence: this.calculateAverageConfidence(predictions)
    };
  }

  /**
   * Generate action items
   */
  async generateActionItems(customer) {
    const actionItems = [];

    // Immediate Actions (Next 24 hours)
    if (customer.healthScore < 4) {
      actionItems.push({
        priority: 'immediate',
        timeframe: '24 hours',
        action: 'Schedule emergency customer meeting',
        owner: 'Customer Success Manager',
        description: 'Critical customer requires immediate attention'
      });
    }

    // Short-term Actions (Next week)
    if (customer.healthScore < 7) {
      actionItems.push({
        priority: 'high',
        timeframe: '1 week',
        action: 'Create customer success plan',
        owner: 'Customer Success Manager',
        description: 'Develop comprehensive plan to improve customer health'
      });
    }

    // Medium-term Actions (Next month)
    if (customer.arr > 100000) {
      actionItems.push({
        priority: 'medium',
        timeframe: '1 month',
        action: 'Schedule quarterly business review',
        owner: 'Account Manager',
        description: 'Strategic review with customer stakeholders'
      });
    }

    // Long-term Actions (Next quarter)
    actionItems.push({
      priority: 'medium',
      timeframe: '3 months',
      action: 'Evaluate expansion opportunities',
      owner: 'Sales Team',
      description: 'Identify potential upsell and cross-sell opportunities'
    });

    return {
      actionItems,
      immediateActions: actionItems.filter(item => item.priority === 'immediate'),
      shortTermActions: actionItems.filter(item => item.timeframe === '1 week'),
      mediumTermActions: actionItems.filter(item => item.timeframe === '1 month'),
      longTermActions: actionItems.filter(item => item.timeframe === '3 months')
    };
  }

  // Helper methods
  calculatePriority(customer) {
    let priority = 'low';
    
    if (customer.healthScore < 4 || customer.arr > 100000) {
      priority = 'critical';
    } else if (customer.healthScore < 7 || customer.arr > 50000) {
      priority = 'high';
    } else if (customer.healthScore < 8) {
      priority = 'medium';
    }
    
    return priority;
  }

  calculateRiskLevel(riskScore) {
    if (riskScore >= 0.7) return 'critical';
    if (riskScore >= 0.5) return 'high';
    if (riskScore >= 0.3) return 'medium';
    return 'low';
  }

  analyzeIntegrationHealth(integrations) {
    const issues = [];
    
    // Check if integrations exist and have recent activity
    if (integrations.jira) {
      if (!integrations.jira.lastSync || 
          (new Date() - new Date(integrations.jira.lastSync)) > 7 * 24 * 60 * 60 * 1000) {
        issues.push('Jira integration not recently synced');
      }
      if (integrations.jira.criticalIssues > 5) {
        issues.push('High number of critical Jira issues');
      }
    }
    
    if (integrations.zendesk) {
      if (!integrations.zendesk.lastSync || 
          (new Date() - new Date(integrations.zendesk.lastSync)) > 7 * 24 * 60 * 60 * 1000) {
        issues.push('Zendesk integration not recently synced');
      }
      if (integrations.zendesk.escalatedTickets > 3) {
        issues.push('High number of escalated Zendesk tickets');
      }
    }
    
    if (integrations.hubspot) {
      if (!integrations.hubspot.lastSync || 
          (new Date() - new Date(integrations.hubspot.lastSync)) > 7 * 24 * 60 * 60 * 1000) {
        issues.push('HubSpot integration not recently synced');
      }
      if (integrations.hubspot.engagementScore < 30) {
        issues.push('Low HubSpot engagement score');
      }
    }
    
    return issues;
  }

  analyzeUsagePatterns(customer) {
    // Mock usage pattern analysis
    if (customer.healthScore < 6) {
      return {
        type: 'low_usage',
        severity: 'warning',
        description: 'Customer showing low product usage patterns',
        impact: 'Reduced engagement and satisfaction',
        probability: 0.6,
        recommendation: 'Increase product adoption through training and support'
      };
    }
    return null;
  }

  async analyzeSupportPatterns(customer) {
    // Mock support pattern analysis
    const alerts = await Alert.find({ customerId: customer._id, status: 'open' });
    
    if (alerts.length > 3) {
      return {
        type: 'high_support_volume',
        severity: 'warning',
        description: 'High volume of support tickets',
        impact: 'Customer satisfaction at risk',
        probability: 0.7,
        recommendation: 'Proactive support and issue resolution'
      };
    }
    return null;
  }

  analyzeFeatureAdoption(customer) {
    // Mock feature adoption analysis
    return [{
      type: 'feature_adoption',
      category: 'product_usage',
      description: 'Opportunity to increase feature adoption',
      potentialValue: customer.arr * 0.1,
      confidence: 0.6,
      recommendation: 'Feature training and enablement',
      timeline: '30 days'
    }];
  }

  analyzeIntegrationOpportunities(customer) {
    // Mock integration opportunities
    const opportunities = [];
    
    if (!customer.integrations?.jira) {
      opportunities.push({
        type: 'integration_expansion',
        category: 'product_integration',
        description: 'Add Jira integration for better project management',
        potentialValue: customer.arr * 0.15,
        confidence: 0.7,
        recommendation: 'Present Jira integration benefits',
        timeline: '60 days'
      });
    }
    
    return opportunities;
  }

  generateIntegrationRecommendations(integrations) {
    const recommendations = [];
    
    if (integrations.jira) {
      if (!integrations.jira.lastSync || 
          (new Date() - new Date(integrations.jira.lastSync)) > 7 * 24 * 60 * 60 * 1000) {
        recommendations.push({
          type: 'integration_optimization',
          priority: 'medium',
          title: 'Refresh Jira Integration',
          description: 'Jira integration has not been recently synced',
          actions: [
            'Review integration configuration',
            'Test connection and permissions',
            'Provide integration training',
            'Monitor usage and adoption'
          ],
          expectedOutcome: 'Improved project management and customer satisfaction',
          timeline: '2 weeks'
        });
      }
      
      if (integrations.jira.criticalIssues > 5) {
        recommendations.push({
          type: 'issue_resolution',
          priority: 'high',
          title: 'Address Critical Jira Issues',
          description: 'High number of critical issues in Jira',
          actions: [
            'Review and prioritize critical issues',
            'Assign resources to resolve issues',
            'Communicate with customer about resolution timeline',
            'Monitor issue resolution progress'
          ],
          expectedOutcome: 'Reduced critical issues and improved customer satisfaction',
          timeline: '1 week'
        });
      }
    }
    
    return recommendations;
  }

  generateUsageRecommendations(customer) {
    // Mock usage recommendations
    return [{
      type: 'usage_optimization',
      priority: 'medium',
      title: 'Improve Product Adoption',
      description: 'Customer could benefit from increased product usage',
      actions: [
        'Provide additional training sessions',
        'Create usage optimization plan',
        'Assign product specialist',
        'Monitor usage metrics'
      ],
      expectedOutcome: 'Increased product adoption and satisfaction',
      timeline: '4 weeks'
    }];
  }

  createImplementationPlan(recommendations) {
    return {
      immediate: recommendations.filter(r => r.priority === 'critical'),
      shortTerm: recommendations.filter(r => r.priority === 'high'),
      mediumTerm: recommendations.filter(r => r.priority === 'medium'),
      longTerm: recommendations.filter(r => r.priority === 'low')
    };
  }

  calculateTrend(data) {
    if (data.length < 2) return { direction: 'stable', magnitude: 0, confidence: 0 };
    
    const first = data[0];
    const last = data[data.length - 1];
    const change = ((last - first) / first) * 100;
    
    return {
      direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
      magnitude: Math.abs(change),
      confidence: 0.8
    };
  }

  getTrendImplications(metric, trend) {
    if (metric === 'health_score') {
      if (trend.direction === 'decreasing') {
        return 'Customer satisfaction declining, intervention may be needed';
      } else if (trend.direction === 'increasing') {
        return 'Customer satisfaction improving, opportunity for expansion';
      }
    }
    return 'Monitor for continued trends';
  }

  analyzeUsageTrends(customer) {
    // Mock usage trend analysis
    return {
      metric: 'product_usage',
      direction: 'stable',
      magnitude: 5,
      description: 'Product usage is stable',
      confidence: 0.7,
      implications: 'Customer is engaged but may need encouragement for growth'
    };
  }

  async analyzeSupportTrends(customer) {
    // Mock support trend analysis
    return {
      metric: 'support_tickets',
      direction: 'decreasing',
      magnitude: 15,
      description: 'Support ticket volume is decreasing',
      confidence: 0.8,
      implications: 'Customer issues are being resolved effectively'
    };
  }

  calculateOverallTrend(trends) {
    if (trends.length === 0) return 'stable';
    
    const positive = trends.filter(t => t.direction === 'increasing').length;
    const negative = trends.filter(t => t.direction === 'decreasing').length;
    
    if (positive > negative) return 'improving';
    if (negative > positive) return 'declining';
    return 'stable';
  }

  extractKeyInsights(trends) {
    return trends.map(trend => ({
      insight: trend.description,
      action: this.getTrendAction(trend)
    }));
  }

  getTrendAction(trend) {
    if (trend.direction === 'decreasing') {
      return 'Investigate and address underlying issues';
    } else if (trend.direction === 'increasing') {
      return 'Leverage positive momentum for growth';
    }
    return 'Continue monitoring';
  }

  predictChurnRisk(customer) {
    let probability = 0.1; // Base churn probability
    let factors = [];
    
    if (customer.healthScore < 4) {
      probability += 0.4;
      factors.push('Critical health score');
    } else if (customer.healthScore < 7) {
      probability += 0.2;
      factors.push('Low health score');
    }
    
    if (customer.arr > 100000) {
      probability -= 0.1; // High-value customers less likely to churn
      factors.push('High-value customer');
    }
    
    return {
      probability: Math.min(probability, 0.9),
      confidence: 0.8,
      factors,
      recommendation: probability > 0.5 ? 'Immediate intervention required' : 'Monitor closely'
    };
  }

  predictHealthScore(customer) {
    let score = customer.healthScore;
    let factors = [];
    
    if (customer.healthScore < 4) {
      score += 1; // Likely to improve with intervention
      factors.push('Intervention planned');
    }
    
    return {
      score: Math.min(score, 10),
      confidence: 0.7,
      factors,
      recommendation: 'Focus on improving customer satisfaction'
    };
  }

  predictRevenue(customer) {
    let arr = customer.arr;
    let factors = [];
    
    if (customer.healthScore >= 8) {
      arr *= 1.15; // 15% growth potential
      factors.push('High customer satisfaction');
    }
    
    return {
      arr,
      confidence: 0.6,
      factors,
      recommendation: 'Focus on expansion opportunities'
    };
  }

  calculateOverallPrediction(predictions) {
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    return {
      confidence: avgConfidence,
      summary: this.generatePredictionSummary(predictions)
    };
  }

  calculateAverageConfidence(predictions) {
    return predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
  }

  generatePredictionSummary(predictions) {
    const churnPrediction = predictions.find(p => p.type === 'churn_prediction');
    const healthPrediction = predictions.find(p => p.type === 'health_prediction');
    
    if (churnPrediction && churnPrediction.value > 0.5) {
      return 'High churn risk - immediate action required';
    } else if (healthPrediction && healthPrediction.value < 6) {
      return 'Health score declining - intervention needed';
    }
    return 'Customer stable with growth potential';
  }

  // Portfolio analysis methods
  async analyzePortfolioHealth(customers) {
    const totalCustomers = customers.length;
    const healthyCustomers = customers.filter(c => c.healthScore >= 7).length;
    const atRiskCustomers = customers.filter(c => c.healthScore >= 4 && c.healthScore < 7).length;
    const criticalCustomers = customers.filter(c => c.healthScore < 4).length;
    
    return {
      totalCustomers,
      healthyCustomers,
      atRiskCustomers,
      criticalCustomers,
      healthDistribution: {
        healthy: (healthyCustomers / totalCustomers) * 100,
        atRisk: (atRiskCustomers / totalCustomers) * 100,
        critical: (criticalCustomers / totalCustomers) * 100
      },
      averageHealthScore: customers.reduce((sum, c) => sum + c.healthScore, 0) / totalCustomers
    };
  }

  async identifyRiskSegments(customers) {
    const segments = {
      critical: customers.filter(c => c.healthScore < 4),
      atRisk: customers.filter(c => c.healthScore >= 4 && c.healthScore < 7),
      stable: customers.filter(c => c.healthScore >= 7 && c.healthScore < 8),
      healthy: customers.filter(c => c.healthScore >= 8)
    };
    
    return {
      segments,
      recommendations: {
        critical: 'Immediate intervention required',
        atRisk: 'Proactive engagement needed',
        stable: 'Monitor and nurture',
        healthy: 'Focus on expansion opportunities'
      }
    };
  }

  async identifyGrowthOpportunities(customers) {
    const opportunities = [];
    
    customers.forEach(customer => {
      if (customer.healthScore >= 8 && customer.arr < 200000) {
        opportunities.push({
          customer: customer.name,
          type: 'upsell',
          potentialValue: customer.arr * 0.3,
          confidence: 0.8
        });
      }
    });
    
    return {
      opportunities,
      totalPotentialValue: opportunities.reduce((sum, opp) => sum + opp.potentialValue, 0),
      topOpportunities: opportunities.slice(0, 5)
    };
  }

  async predictPortfolioChurnRisk(customers) {
    const churnPredictions = customers.map(customer => ({
      customer: customer.name,
      risk: this.predictChurnRisk(customer).probability,
      factors: this.predictChurnRisk(customer).factors
    }));
    
    return {
      predictions: churnPredictions,
      highRiskCustomers: churnPredictions.filter(p => p.risk > 0.5),
      averageRisk: churnPredictions.reduce((sum, p) => sum + p.risk, 0) / churnPredictions.length
    };
  }

  async generatePortfolioRecommendations(customers) {
    const recommendations = [];
    
    const criticalCount = customers.filter(c => c.healthScore < 4).length;
    if (criticalCount > 0) {
      recommendations.push({
        type: 'critical_intervention',
        priority: 'critical',
        description: `${criticalCount} customers require immediate attention`,
        action: 'Implement customer recovery program'
      });
    }
    
    const atRiskCount = customers.filter(c => c.healthScore >= 4 && c.healthScore < 7).length;
    if (atRiskCount > 0) {
      recommendations.push({
        type: 'proactive_engagement',
        priority: 'high',
        description: `${atRiskCount} customers need proactive engagement`,
        action: 'Increase customer success touchpoints'
      });
    }
    
    return recommendations;
  }

  async generateMarketInsights(customers) {
    // Mock market insights
    return {
      marketTrends: [
        'Increasing adoption of customer success platforms',
        'Growing focus on customer health metrics',
        'Rising importance of proactive engagement'
      ],
      competitiveAnalysis: [
        'Strong position in mid-market segment',
        'Opportunity to expand enterprise presence',
        'Differentiation through AI-powered insights'
      ],
      recommendations: [
        'Invest in AI and automation capabilities',
        'Expand enterprise sales team',
        'Develop advanced analytics features'
      ]
    };
  }

  async generateStrategicRecommendations(customers) {
    return {
      shortTerm: [
        'Implement customer health monitoring dashboard',
        'Establish proactive engagement program',
        'Develop customer success playbooks'
      ],
      mediumTerm: [
        'Expand AI-powered insights capabilities',
        'Build predictive analytics platform',
        'Enhance integration ecosystem'
      ],
      longTerm: [
        'Develop comprehensive customer success platform',
        'Establish thought leadership in customer health',
        'Create industry-specific solutions'
      ]
    };
  }

  /**
   * Calculate comprehensive risk score using multiple data points
   */
  calculateComprehensiveRiskScore(customer) {
    let riskScore = 0;
    let maxScore = 0;

    // 1. Health Score Risk (25%)
    maxScore += 25;
    if (customer.healthScore < 4) {
      riskScore += 25;
    } else if (customer.healthScore < 6) {
      riskScore += 15;
    } else if (customer.healthScore < 8) {
      riskScore += 8;
    }

    // 2. Engagement Risk (20%)
    maxScore += 20;
    const daysSinceLastActivity = this.getDaysSinceLastActivity(customer);
    if (daysSinceLastActivity > 30) {
      riskScore += 20;
    } else if (daysSinceLastActivity > 14) {
      riskScore += 12;
    } else if (daysSinceLastActivity > 7) {
      riskScore += 6;
    }

    // 3. Support Issues Risk (20%)
    maxScore += 20;
    const supportRisk = this.calculateSupportRisk(customer);
    riskScore += supportRisk;

    // 4. Financial Risk (15%)
    maxScore += 15;
    if (customer.renewalLikelihood === 'low') {
      riskScore += 15;
    } else if (customer.renewalLikelihood === 'medium') {
      riskScore += 8;
    }

    // 5. Product Adoption Risk (10%)
    maxScore += 10;
    const productCount = customer.productUsage?.length || 0;
    if (productCount === 0) {
      riskScore += 10;
    } else if (productCount === 1) {
      riskScore += 6;
    } else if (productCount === 2) {
      riskScore += 3;
    }

    // 6. Feedback Sentiment Risk (10%)
    maxScore += 10;
    const sentimentRisk = this.calculateSentimentRisk(customer);
    riskScore += sentimentRisk;

    // Return normalized score (0-100)
    return Math.round((riskScore / maxScore) * 100);
  }

  getDaysSinceLastActivity(customer) {
    if (!customer.lastHealthScoreUpdate) return 999;
    const now = new Date();
    const lastActivity = new Date(customer.lastHealthScoreUpdate);
    return Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
  }

  calculateSupportRisk(customer) {
    let risk = 0;
    const integrationData = customer.integrationData;

    // Jira issues risk
    if (integrationData?.jira) {
      const criticalIssues = integrationData.jira.criticalIssues || 0;
      const openIssues = integrationData.jira.openIssues || 0;
      
      if (criticalIssues > 3) risk += 8;
      else if (criticalIssues > 1) risk += 5;
      else if (criticalIssues > 0) risk += 2;

      if (openIssues > 15) risk += 6;
      else if (openIssues > 8) risk += 4;
      else if (openIssues > 3) risk += 2;
    }

    // Zendesk tickets risk
    if (integrationData?.zendesk) {
      const openTickets = integrationData.zendesk.openTickets || 0;
      const satisfactionScore = integrationData.zendesk.satisfactionScore || 100;
      
      if (openTickets > 10) risk += 4;
      else if (openTickets > 5) risk += 2;
      
      if (satisfactionScore < 60) risk += 6;
      else if (satisfactionScore < 80) risk += 3;
    }

    return Math.min(risk, 20); // Cap at 20
  }

  calculateSentimentRisk(customer) {
    if (!customer.feedback || customer.feedback.length === 0) return 2;
    
    const recentFeedback = customer.feedback
      .filter(f => {
        const feedbackDate = new Date(f.date);
        const monthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        return feedbackDate > monthsAgo;
      })
      .slice(-5); // Last 5 feedback items

    if (recentFeedback.length === 0) return 2;

    const avgRating = recentFeedback.reduce((sum, f) => sum + (f.rating || 3), 0) / recentFeedback.length;
    
    if (avgRating < 2) return 10;
    if (avgRating < 3) return 7;
    if (avgRating < 3.5) return 4;
    if (avgRating < 4) return 2;
    return 0;
  }

  /**
   * Generate predictive behavior insights
   */
  generateBehaviorScore(customer) {
    let behaviorScore = 0;
    let factors = [];

    // Product adoption velocity
    const productCount = customer.productUsage?.length || 0;
    if (productCount >= 3) {
      behaviorScore += 25;
      factors.push('High product adoption');
    } else if (productCount >= 2) {
      behaviorScore += 15;
      factors.push('Moderate product adoption');
    } else if (productCount >= 1) {
      behaviorScore += 8;
      factors.push('Basic product adoption');
    } else {
      factors.push('Low product adoption');
    }

    // Support engagement pattern
    const supportHealth = customer.metrics?.supportHealth || 0;
    if (supportHealth >= 85) {
      behaviorScore += 20;
      factors.push('Excellent support satisfaction');
    } else if (supportHealth >= 70) {
      behaviorScore += 15;
      factors.push('Good support satisfaction');
    } else if (supportHealth >= 50) {
      behaviorScore += 8;
      factors.push('Moderate support satisfaction');
    } else {
      factors.push('Poor support satisfaction');
    }

    // Development engagement
    const devHealth = customer.metrics?.developmentHealth || 0;
    if (devHealth >= 80) {
      behaviorScore += 20;
      factors.push('Active development collaboration');
    } else if (devHealth >= 60) {
      behaviorScore += 12;
      factors.push('Moderate development engagement');
    } else {
      factors.push('Limited development engagement');
    }

    // Sales engagement
    const salesHealth = customer.metrics?.salesHealth || 0;
    if (salesHealth >= 80) {
      behaviorScore += 15;
      factors.push('Strong sales relationship');
    } else if (salesHealth >= 60) {
      behaviorScore += 10;
      factors.push('Moderate sales engagement');
    } else {
      factors.push('Limited sales engagement');
    }

    // Activity consistency
    const daysSinceActivity = this.getDaysSinceLastActivity(customer);
    if (daysSinceActivity <= 7) {
      behaviorScore += 20;
      factors.push('Highly active customer');
    } else if (daysSinceActivity <= 14) {
      behaviorScore += 15;
      factors.push('Regular activity pattern');
    } else if (daysSinceActivity <= 30) {
      behaviorScore += 8;
      factors.push('Moderate activity level');
    } else {
      factors.push('Low activity level');
    }

    return {
      score: Math.min(behaviorScore, 100),
      factors,
      category: this.categorizeBehavior(behaviorScore)
    };
  }

  categorizeBehavior(score) {
    if (score >= 80) return 'Champion';
    if (score >= 60) return 'Advocate';
    if (score >= 40) return 'Passive';
    if (score >= 20) return 'At Risk';
    return 'Critical';
  }

  /**
   * Advanced trend analysis with pattern detection
   */
  analyzeTrendPatterns(customer) {
    const trends = {
      healthTrend: this.analyzeHealthTrend(customer),
      engagementTrend: this.analyzeEngagementTrend(customer),
      satisfactionTrend: this.analyzeSatisfactionTrend(customer),
      predictedDirection: 'stable'
    };

    // Determine overall trend direction
    const trendScores = [
      trends.healthTrend.direction === 'improving' ? 1 : trends.healthTrend.direction === 'declining' ? -1 : 0,
      trends.engagementTrend.direction === 'improving' ? 1 : trends.engagementTrend.direction === 'declining' ? -1 : 0,
      trends.satisfactionTrend.direction === 'improving' ? 1 : trends.satisfactionTrend.direction === 'declining' ? -1 : 0
    ];

    const overallTrend = trendScores.reduce((sum, score) => sum + score, 0);
    
    if (overallTrend >= 2) trends.predictedDirection = 'improving';
    else if (overallTrend <= -2) trends.predictedDirection = 'declining';
    else if (overallTrend === 1) trends.predictedDirection = 'slightly_improving';
    else if (overallTrend === -1) trends.predictedDirection = 'slightly_declining';

    return trends;
  }

  analyzeHealthTrend(customer) {
    if (!customer.healthScoreHistory || customer.healthScoreHistory.length < 2) {
      return { direction: 'insufficient_data', confidence: 0 };
    }

    const recent = customer.healthScoreHistory.slice(-5); // Last 5 data points
    const changeSum = recent.slice(1).reduce((sum, curr, idx) => {
      return sum + (curr.score - recent[idx].score);
    }, 0);

    const avgChange = changeSum / (recent.length - 1);
    
    let direction = 'stable';
    let confidence = Math.min(Math.abs(avgChange) * 20, 100); // Convert to confidence percentage

    if (avgChange > 0.3) direction = 'improving';
    else if (avgChange < -0.3) direction = 'declining';

    return { direction, confidence, avgChange };
  }

  analyzeEngagementTrend(customer) {
    // Analyze engagement based on ticket patterns and activity
    const integrationData = customer.integrationData;
    let engagementScore = 50; // Baseline

    if (integrationData?.jira?.openIssues) {
      const recentActivity = integrationData.jira.lastSync;
      const daysSinceSync = recentActivity ? Math.floor((Date.now() - new Date(recentActivity)) / (1000 * 60 * 60 * 24)) : 999;
      
      if (daysSinceSync <= 1) engagementScore += 20;
      else if (daysSinceSync <= 7) engagementScore += 10;
      else if (daysSinceSync <= 14) engagementScore += 5;
      else engagementScore -= 10;
    }

    if (integrationData?.zendesk?.openTickets) {
      const ticketCount = integrationData.zendesk.openTickets;
      if (ticketCount > 0 && ticketCount <= 3) engagementScore += 10; // Healthy engagement
      else if (ticketCount > 10) engagementScore -= 15; // Overwhelmed
    }

    return {
      direction: engagementScore > 60 ? 'improving' : engagementScore < 40 ? 'declining' : 'stable',
      confidence: Math.abs(engagementScore - 50) * 2,
      score: engagementScore
    };
  }

  analyzeSatisfactionTrend(customer) {
    if (!customer.feedback || customer.feedback.length < 2) {
      return { direction: 'insufficient_data', confidence: 0 };
    }

    const recentFeedback = customer.feedback
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (recentFeedback.length < 2) {
      return { direction: 'insufficient_data', confidence: 0 };
    }

    const avgRating = recentFeedback.reduce((sum, f) => sum + (f.rating || 3), 0) / recentFeedback.length;
    const firstHalf = recentFeedback.slice(0, Math.ceil(recentFeedback.length / 2));
    const secondHalf = recentFeedback.slice(Math.ceil(recentFeedback.length / 2));

    const firstAvg = firstHalf.reduce((sum, f) => sum + (f.rating || 3), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, f) => sum + (f.rating || 3), 0) / secondHalf.length;

    const change = firstAvg - secondAvg; // Note: first is more recent

    return {
      direction: change > 0.3 ? 'improving' : change < -0.3 ? 'declining' : 'stable',
      confidence: Math.min(Math.abs(change) * 50, 100),
      avgRating,
      change
    };
  }
}

module.exports = new AIInsightsService(); 