const Customer = require('../models/Customer');

class AlertsService {
  constructor() {
    this.alertTypes = {
      NEGATIVE_FEEDBACK: 'negative_feedback',
      RENEWAL_RISK: 'renewal_risk',
      LOW_ENGAGEMENT: 'low_engagement',
      CRITICAL_ISSUES: 'critical_issues',
      SUPPORT_OVERLOAD: 'support_overload',
      SALES_STAGNATION: 'sales_stagnation'
    };

    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
  }

  /**
   * Generate smart alerts for a customer based on their data with intelligent thresholds
   */
  async generateCustomerAlerts(customer) {
    const alerts = [];
    const now = new Date();

    // Calculate dynamic thresholds based on customer profile
    const thresholds = this.calculateDynamicThresholds(customer);

    // 1. Negative Feedback Pattern Alert
    const negativeFeedbackAlert = this.checkNegativeFeedbackPattern(customer, now, thresholds);
    if (negativeFeedbackAlert) alerts.push(negativeFeedbackAlert);

    // 2. Renewal Risk Alert with ML-inspired scoring
    const renewalRiskAlert = this.checkRenewalRisk(customer, now, thresholds);
    if (renewalRiskAlert) alerts.push(renewalRiskAlert);

    // 3. Low Engagement Alert with behavior analysis
    const lowEngagementAlert = this.checkLowEngagement(customer, now, thresholds);
    if (lowEngagementAlert) alerts.push(lowEngagementAlert);

    // 4. Critical Issues Alert (from Jira) with trend analysis
    const criticalIssuesAlert = this.checkCriticalIssues(customer, thresholds);
    if (criticalIssuesAlert) alerts.push(criticalIssuesAlert);

    // 5. Support Overload Alert (from Zendesk) with pattern detection
    const supportOverloadAlert = this.checkSupportOverload(customer, thresholds);
    if (supportOverloadAlert) alerts.push(supportOverloadAlert);

    // 6. Sales Stagnation Alert (from HubSpot)
    const salesStagnationAlert = this.checkSalesStagnation(customer, thresholds);
    if (salesStagnationAlert) alerts.push(salesStagnationAlert);

    // 7. NEW: Health Score Decline Alert
    const healthDeclineAlert = this.checkHealthScoreDecline(customer, thresholds);
    if (healthDeclineAlert) alerts.push(healthDeclineAlert);

    // 8. NEW: Product Adoption Stagnation Alert
    const adoptionAlert = this.checkProductAdoptionStagnation(customer, thresholds);
    if (adoptionAlert) alerts.push(adoptionAlert);

    // 9. NEW: Escalation Risk Alert
    const escalationAlert = this.checkEscalationRisk(customer, thresholds);
    if (escalationAlert) alerts.push(escalationAlert);

    // Prioritize alerts based on urgency and impact
    return this.prioritizeAlerts(alerts, customer);
  }

  /**
   * Check for negative feedback patterns with dynamic thresholds
   */
  checkNegativeFeedbackPattern(customer, now, thresholds) {
    if (!customer.feedback || customer.feedback.length === 0) return null;

    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const recentFeedback = customer.feedback.filter(f => 
      new Date(f.date) >= twoWeeksAgo
    );

    const negativeFeedback = recentFeedback.filter(f => f.rating <= 3);
    
    if (negativeFeedback.length >= thresholds.negativeFeedbackCount) {
      return {
        type: this.alertTypes.NEGATIVE_FEEDBACK,
        severity: negativeFeedback.length >= 5 ? this.severityLevels.CRITICAL : this.severityLevels.HIGH,
        title: `${negativeFeedback.length} negative feedback in 2 weeks`,
        description: `Customer has received ${negativeFeedback.length} negative feedback entries (rating ≤ 3) in the past 2 weeks. Immediate attention required.`,
        data: {
          count: negativeFeedback.length,
          averageRating: (negativeFeedback.reduce((sum, f) => sum + f.rating, 0) / negativeFeedback.length).toFixed(1),
          timeframe: '2 weeks'
        },
        createdAt: now,
        actionRequired: true
      };
    }

    return null;
  }

  /**
   * Check for renewal risk based on engagement and timeline with smart thresholds
   */
  checkRenewalRisk(customer, now, thresholds) {
    // Check if renewal is coming up (within 30-90 days)
    if (!customer.renewalDate) return null;

    const renewalDate = new Date(customer.renewalDate);
    const daysUntilRenewal = Math.ceil((renewalDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilRenewal <= 90 && daysUntilRenewal > 0) {
      // Check for low engagement indicators
      const lowEngagementFactors = [];
      
      // Check product usage
      if (!customer.productUsage || customer.productUsage.length < 2) {
        lowEngagementFactors.push('low product usage');
      }

      // Check health score
      if (customer.healthScore < 60) {
        lowEngagementFactors.push('low health score');
      }

      // Check recent activity from integrations
      if (customer.integrationData?.hubspot?.daysSinceLastActivity > 30) {
        lowEngagementFactors.push('no recent sales activity');
      }

      if (lowEngagementFactors.length > 0) {
        const severity = daysUntilRenewal <= 30 ? this.severityLevels.CRITICAL : 
                        daysUntilRenewal <= 60 ? this.severityLevels.HIGH : this.severityLevels.MEDIUM;

        return {
          type: this.alertTypes.RENEWAL_RISK,
          severity,
          title: `Renewal in ${daysUntilRenewal} days, ${lowEngagementFactors.join(' & ')}`,
          description: `Customer renewal is approaching in ${daysUntilRenewal} days with concerning engagement indicators: ${lowEngagementFactors.join(', ')}.`,
          data: {
            daysUntilRenewal,
            renewalDate: renewalDate.toISOString().split('T')[0],
            riskFactors: lowEngagementFactors,
            healthScore: customer.healthScore
          },
          createdAt: now,
          actionRequired: true
        };
      }
    }

    return null;
  }

  /**
   * Check for low engagement patterns
   */
  checkLowEngagement(customer, now, thresholds) {
    const engagementScore = this.calculateEngagementScore(customer);
    
    if (engagementScore < 30) {
      return {
        type: this.alertTypes.LOW_ENGAGEMENT,
        severity: engagementScore < 15 ? this.severityLevels.HIGH : this.severityLevels.MEDIUM,
        title: `Low customer engagement (${engagementScore}% score)`,
        description: `Customer shows minimal engagement across products and services. Consider proactive outreach.`,
        data: {
          engagementScore,
          productUsage: customer.productUsage?.length || 0,
          lastActivity: customer.integrationData?.hubspot?.daysSinceLastActivity || 'unknown'
        },
        createdAt: now,
        actionRequired: false
      };
    }

    return null;
  }

  /**
   * Check for critical issues from Jira
   */
  checkCriticalIssues(customer, thresholds) {
    const jiraData = customer.integrationData?.jira;
    if (!jiraData || jiraData.criticalIssues < thresholds.criticalIssuesCount) return null;

    return {
      type: this.alertTypes.CRITICAL_ISSUES,
      severity: jiraData.criticalIssues >= 3 ? this.severityLevels.CRITICAL : this.severityLevels.HIGH,
      title: `${jiraData.criticalIssues} critical development issues`,
      description: `Customer has ${jiraData.criticalIssues} critical issues in development. Average resolution time: ${jiraData.avgResolutionTime}h.`,
      data: {
        criticalIssues: jiraData.criticalIssues,
        openIssues: jiraData.openIssues,
        avgResolutionTime: jiraData.avgResolutionTime
      },
      createdAt: new Date(),
      actionRequired: true
    };
  }

  /**
   * Check for support overload from Zendesk
   */
  checkSupportOverload(customer, thresholds) {
    const zendeskData = customer.integrationData?.zendesk;
    if (!zendeskData) return null;

    const totalTickets = zendeskData.openTickets + zendeskData.solvedTickets;
    const openRatio = totalTickets > 0 ? zendeskData.openTickets / totalTickets : 0;

    if (zendeskData.urgentTickets >= 3 || openRatio > 0.4) {
      return {
        type: this.alertTypes.SUPPORT_OVERLOAD,
        severity: zendeskData.urgentTickets >= 5 ? this.severityLevels.CRITICAL : this.severityLevels.HIGH,
        title: `Support overload: ${zendeskData.urgentTickets} urgent tickets`,
        description: `Customer has ${zendeskData.urgentTickets} urgent support tickets and ${Math.round(openRatio * 100)}% open ticket ratio.`,
        data: {
          urgentTickets: zendeskData.urgentTickets,
          openTickets: zendeskData.openTickets,
          openRatio: Math.round(openRatio * 100),
          satisfactionScore: zendeskData.satisfactionScore
        },
        createdAt: new Date(),
        actionRequired: true
      };
    }

    return null;
  }

  /**
   * Check for sales stagnation from HubSpot
   */
  checkSalesStagnation(customer, thresholds) {
    const hubspotData = customer.integrationData?.hubspot;
    if (!hubspotData) return null;

    const isStagnant = hubspotData.daysSinceLastActivity > 60 && 
                     hubspotData.openDeals === 0 && 
                     hubspotData.lifecycleStage !== 'customer';

    if (isStagnant) {
      return {
        type: this.alertTypes.SALES_STAGNATION,
        severity: this.severityLevels.MEDIUM,
        title: `Sales stagnation: ${hubspotData.daysSinceLastActivity} days inactive`,
        description: `No sales activity for ${hubspotData.daysSinceLastActivity} days, no open deals, lifecycle stage: ${hubspotData.lifecycleStage}.`,
        data: {
          daysSinceLastActivity: hubspotData.daysSinceLastActivity,
          openDeals: hubspotData.openDeals,
          lifecycleStage: hubspotData.lifecycleStage,
          totalDealValue: hubspotData.totalDealValue
        },
        createdAt: new Date(),
        actionRequired: false
      };
    }

    return null;
  }

  /**
   * Calculate overall engagement score
   */
  calculateEngagementScore(customer) {
    let score = 0;
    let factors = 0;

    // Product usage factor (0-40 points)
    if (customer.productUsage) {
      score += Math.min(customer.productUsage.length * 10, 40);
      factors++;
    }

    // Health score factor (0-30 points)
    if (customer.healthScore) {
      score += (customer.healthScore / 100) * 30;
      factors++;
    }

    // Recent activity factor (0-30 points)
    const daysSinceActivity = customer.integrationData?.hubspot?.daysSinceLastActivity || 90;
    if (daysSinceActivity <= 7) score += 30;
    else if (daysSinceActivity <= 30) score += 20;
    else if (daysSinceActivity <= 60) score += 10;
    factors++;

    return factors > 0 ? Math.round(score / factors) : 0;
  }

  /**
   * Generate AI-powered summary for customer
   */
  generateAISummary(customer, alerts) {
    const healthStatus = customer.healthScore >= 80 ? 'Healthy' : 
                        customer.healthScore >= 60 ? 'At Risk' : 'Critical';
    
    let summary = `${customer.name} is currently in ${healthStatus} status with a health score of ${customer.healthScore}.`;

    // Add integration insights
    const integrationInsights = [];
    if (customer.integrationData?.jira) {
      integrationInsights.push(`${customer.integrationData.jira.openIssues} open development issues`);
    }
    if (customer.integrationData?.zendesk) {
      integrationInsights.push(`${customer.integrationData.zendesk.openTickets} support tickets`);
    }
    if (customer.integrationData?.hubspot) {
      integrationInsights.push(`${customer.integrationData.hubspot.lifecycleStage} lifecycle stage`);
    }

    if (integrationInsights.length > 0) {
      summary += ` Current status: ${integrationInsights.join(', ')}.`;
    }

    // Add alert summary
    if (alerts.length > 0) {
      const criticalAlerts = alerts.filter(a => a.severity === this.severityLevels.CRITICAL).length;
      const highAlerts = alerts.filter(a => a.severity === this.severityLevels.HIGH).length;
      
      if (criticalAlerts > 0) {
        summary += ` ⚠️ ${criticalAlerts} critical alert${criticalAlerts > 1 ? 's' : ''} require immediate attention.`;
      } else if (highAlerts > 0) {
        summary += ` ⚡ ${highAlerts} high-priority alert${highAlerts > 1 ? 's' : ''} need review.`;
      }
    } else {
      summary += ` ✅ No active alerts - customer appears stable.`;
    }

    // Add recommendations
    const recommendations = this.generateRecommendations(customer, alerts);
    if (recommendations.length > 0) {
      summary += ` Recommended actions: ${recommendations.join(', ')}.`;
    }

    return summary;
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(customer, alerts) {
    const recommendations = [];

    // Based on alerts
    alerts.forEach(alert => {
      switch (alert.type) {
        case this.alertTypes.NEGATIVE_FEEDBACK:
          recommendations.push('schedule customer success call');
          break;
        case this.alertTypes.RENEWAL_RISK:
          recommendations.push('initiate renewal discussion');
          break;
        case this.alertTypes.CRITICAL_ISSUES:
          recommendations.push('escalate to development team');
          break;
        case this.alertTypes.SUPPORT_OVERLOAD:
          recommendations.push('assign dedicated support manager');
          break;
      }
    });

    // Based on health score
    if (customer.healthScore < 60) {
      recommendations.push('conduct health check meeting');
    }

    // Based on engagement
    if (!customer.productUsage || customer.productUsage.length < 2) {
      recommendations.push('provide product training');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Get all alerts for dashboard overview
   */
  async getAllActiveAlerts() {
    try {
      const customers = await Customer.find();
      const allAlerts = [];

      for (const customer of customers) {
        const customerAlerts = await this.generateCustomerAlerts(customer);
        customerAlerts.forEach(alert => {
          alert.customerId = customer._id;
          alert.customerName = customer.name;
        });
        allAlerts.push(...customerAlerts);
      }

      // Sort by severity and creation date
      return allAlerts.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    } catch (error) {
      console.error('Error getting all active alerts:', error);
      return [];
    }
  }
  /**
   * Calculate dynamic thresholds based on customer profile and historical data
   */
  calculateDynamicThresholds(customer) {
    const arr = customer.arr || 0;
    const healthScore = customer.healthScore || 5;
    const productCount = customer.productUsage?.length || 0;

    // Base thresholds
    let thresholds = {
      negativeFeedbackCount: 3,
      lowEngagementDays: 14,
      criticalIssuesCount: 2,
      supportTicketCount: 10,
      healthScoreDecline: 1.0,
      renewalRiskDays: 90
    };

    // Adjust thresholds based on customer value (ARR)
    if (arr > 100000) { // High-value customers get more sensitive thresholds
      thresholds.negativeFeedbackCount = 2;
      thresholds.lowEngagementDays = 7;
      thresholds.criticalIssuesCount = 1;
      thresholds.supportTicketCount = 5;
      thresholds.healthScoreDecline = 0.5;
      thresholds.renewalRiskDays = 120;
    } else if (arr > 50000) { // Medium-value customers
      thresholds.negativeFeedbackCount = 2;
      thresholds.lowEngagementDays = 10;
      thresholds.criticalIssuesCount = 1;
      thresholds.supportTicketCount = 7;
      thresholds.healthScoreDecline = 0.7;
      thresholds.renewalRiskDays = 100;
    }

    // Adjust based on health score (unhealthy customers need closer monitoring)
    if (healthScore < 5) {
      thresholds.negativeFeedbackCount = Math.max(1, thresholds.negativeFeedbackCount - 1);
      thresholds.lowEngagementDays = Math.max(3, thresholds.lowEngagementDays - 3);
      thresholds.healthScoreDecline = Math.max(0.3, thresholds.healthScoreDecline - 0.2);
    }

    // Adjust based on product adoption (more products = higher expectations)
    if (productCount >= 3) {
      thresholds.lowEngagementDays = Math.max(5, thresholds.lowEngagementDays - 2);
    } else if (productCount === 0) {
      thresholds.lowEngagementDays = thresholds.lowEngagementDays + 7; // More lenient for new customers
    }

    return thresholds;
  }

  /**
   * Check for health score decline patterns
   */
  checkHealthScoreDecline(customer, thresholds) {
    if (!customer.healthScoreHistory || customer.healthScoreHistory.length < 3) {
      return null;
    }

    const recent = customer.healthScoreHistory.slice(-3);
    const decline = recent[0].score - recent[recent.length - 1].score;

    if (decline >= thresholds.healthScoreDecline) {
      return {
        type: 'health_decline',
        severity: decline >= 2.0 ? this.severityLevels.CRITICAL : 
                 decline >= 1.5 ? this.severityLevels.HIGH : this.severityLevels.MEDIUM,
        title: `Health score declining by ${decline.toFixed(1)} points`,
        description: `Customer health score has declined by ${decline.toFixed(1)} points over recent period. Current score: ${recent[recent.length - 1].score}/10`,
        data: {
          decline: decline.toFixed(1),
          currentScore: recent[recent.length - 1].score,
          previousScore: recent[0].score,
          trend: 'declining'
        },
        createdAt: new Date(),
        actionRequired: true,
        priority: decline >= 2.0 ? 'urgent' : decline >= 1.5 ? 'high' : 'medium'
      };
    }

    return null;
  }

  /**
   * Check for product adoption stagnation
   */
  checkProductAdoptionStagnation(customer, thresholds) {
    const productCount = customer.productUsage?.length || 0;
    const arr = customer.arr || 0;
    const daysSinceUpdate = this.getDaysSinceLastActivity(customer);

    // High ARR customers should have more product adoption
    if (arr > 50000 && productCount <= 1 && daysSinceUpdate > 60) {
      return {
        type: 'product_adoption_stagnation',
        severity: arr > 100000 ? this.severityLevels.HIGH : this.severityLevels.MEDIUM,
        title: `Low product adoption for high-value customer`,
        description: `Customer with $${arr.toLocaleString()} ARR is only using ${productCount} product(s). Expansion opportunity identified.`,
        data: {
          productCount,
          arr,
          daysSinceUpdate,
          expansionPotential: 'high'
        },
        createdAt: new Date(),
        actionRequired: true,
        priority: 'medium'
      };
    }

    return null;
  }

  /**
   * Check for escalation risk based on multiple factors
   */
  checkEscalationRisk(customer, thresholds) {
    let riskScore = 0;
    let riskFactors = [];

    // Critical Jira issues
    if (customer.integrationData?.jira?.criticalIssues > 0) {
      riskScore += 30;
      riskFactors.push(`${customer.integrationData.jira.criticalIssues} critical Jira issues`);
    }

    // High-priority Zendesk tickets
    if (customer.integrationData?.zendesk?.urgentTickets > 2) {
      riskScore += 25;
      riskFactors.push(`${customer.integrationData.zendesk.urgentTickets} urgent support tickets`);
    }

    // Low satisfaction score
    if (customer.integrationData?.zendesk?.satisfactionScore < 60) {
      riskScore += 20;
      riskFactors.push(`Low satisfaction score (${customer.integrationData.zendesk.satisfactionScore}%)`);
    }

    // Multiple negative feedback
    const recentNegativeFeedback = customer.feedback?.filter(f => {
      const feedbackDate = new Date(f.date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return feedbackDate > weekAgo && f.rating <= 2;
    }).length || 0;

    if (recentNegativeFeedback >= 2) {
      riskScore += 25;
      riskFactors.push(`${recentNegativeFeedback} negative feedback in past week`);
    }

    if (riskScore >= 50) {
      return {
        type: 'escalation_risk',
        severity: riskScore >= 75 ? this.severityLevels.CRITICAL : this.severityLevels.HIGH,
        title: `High escalation risk detected`,
        description: `Customer shows multiple risk indicators that may lead to escalation. Risk score: ${riskScore}/100`,
        data: {
          riskScore,
          riskFactors,
          recommendedAction: 'immediate_attention'
        },
        createdAt: new Date(),
        actionRequired: true,
        priority: riskScore >= 75 ? 'urgent' : 'high'
      };
    }

    return null;
  }

  /**
   * Prioritize alerts based on urgency, impact, and customer value
   */
  prioritizeAlerts(alerts, customer) {
    const arr = customer.arr || 0;
    const healthScore = customer.healthScore || 5;

    return alerts.map(alert => {
      let priorityScore = 0;

      // Base priority from severity
      switch (alert.severity) {
        case this.severityLevels.CRITICAL:
          priorityScore += 40;
          break;
        case this.severityLevels.HIGH:
          priorityScore += 30;
          break;
        case this.severityLevels.MEDIUM:
          priorityScore += 20;
          break;
        default:
          priorityScore += 10;
      }

      // Customer value multiplier
      if (arr > 100000) priorityScore += 20;
      else if (arr > 50000) priorityScore += 10;
      else if (arr > 20000) priorityScore += 5;

      // Health score modifier
      if (healthScore < 4) priorityScore += 15;
      else if (healthScore < 6) priorityScore += 10;
      else if (healthScore < 8) priorityScore += 5;

      // Set final priority
      if (priorityScore >= 70) alert.priority = 'urgent';
      else if (priorityScore >= 50) alert.priority = 'high';
      else if (priorityScore >= 30) alert.priority = 'medium';
      else alert.priority = 'low';

      alert.priorityScore = priorityScore;
      return alert;
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }

  getDaysSinceLastActivity(customer) {
    if (!customer.lastHealthScoreUpdate) return 999;
    const now = new Date();
    const lastActivity = new Date(customer.lastHealthScoreUpdate);
    return Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
  }
}

module.exports = new AlertsService();