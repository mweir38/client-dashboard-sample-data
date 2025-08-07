// utils/healthScore.js

const jiraService = require('../services/jiraService');
const zendeskService = require('../services/zendeskService');
const hubspotService = require('../services/hubspotService');

/**
 * Calculate a normalized health score (0–10) for a customer.
 * Factors: feedback, product usage, support load, renewal risk, sentiment, social, and third-party integrations
 */

function calculateHealthScore({
  feedback,
  sentimentTrend,
  ticketVolume,
  productUsage,
  renewalLikelihood,
  socialStats,
  integrationData
}) {
  let score = 0;
  let totalWeight = 0;

  // ⭐ 1. Feedback Rating Average (out of 10) - Weight: 2.0
  if (feedback?.length) {
    const avgRating = feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length;
    score += (avgRating / 10) * 2.0;
    totalWeight += 2.0;
  }

  // ⭐ 2. Sentiment Trend - Weight: 1.0
  if (sentimentTrend?.length >= 2) {
    const latest = sentimentTrend.slice(-2);
    const improving = latest[1].score >= latest[0].score;
    score += improving ? 1.0 : 0.5;
    totalWeight += 1.0;
  }

  // ⭐ 3. Legacy Ticket Volume (fewer = healthier) - Weight: 1.0 (reduced due to Zendesk integration)
  if (typeof ticketVolume === "number") {
    const maxThreshold = 10;
    const inverted = Math.max(0, (maxThreshold - ticketVolume) / maxThreshold); // 0-1
    score += inverted * 1.0;
    totalWeight += 1.0;
  }

  // ⭐ 4. Product Usage (OC, Planner, etc.) - Weight: 1.5
  if (Array.isArray(productUsage)) {
    const count = productUsage.length;
    const capped = Math.min(count, 4); // max score if 4 tools used
    score += (capped / 4) * 1.5;
    totalWeight += 1.5;
  }

  // ⭐ 5. Renewal Likelihood - Weight: 1.5
  if (renewalLikelihood) {
    const normalized = {
      high: 1.0,
      medium: 0.6,
      low: 0.2,
    }[renewalLikelihood.toLowerCase()] || 0.5;
    score += normalized * 1.5;
    totalWeight += 1.5;
  }

  // ⭐ 6. Social Engagement - Weight: 1.0
  const socialTotal = (socialStats?.linkedin || 0) + (socialStats?.twitter || 0);
  if (socialTotal !== undefined) {
    const norm = Math.min(socialTotal, 10) / 10;
    score += norm * 1.0;
    totalWeight += 1.0;
  }

  // ⭐ 7. Third-Party Integration Health Scores - Weight: 3.0 (heavily weighted)
  if (integrationData) {
    let integrationScore = 0;
    let integrationCount = 0;

    // Jira Development Health
    if (integrationData.jira) {
      const jiraHealth = jiraService.calculateDevelopmentHealth(integrationData.jira);
      integrationScore += jiraHealth / 100; // Normalize to 0-1
      integrationCount++;
    }

    // Zendesk Support Health
    if (integrationData.zendesk) {
      const zendeskHealth = zendeskService.calculateSupportHealth(integrationData.zendesk);
      integrationScore += zendeskHealth / 100; // Normalize to 0-1
      integrationCount++;
    }

    // HubSpot Sales Health
    if (integrationData.hubspot) {
      const hubspotHealth = hubspotService.calculateSalesHealth(integrationData.hubspot);
      integrationScore += hubspotHealth / 100; // Normalize to 0-1
      integrationCount++;
    }

    if (integrationCount > 0) {
      const avgIntegrationHealth = integrationScore / integrationCount;
      score += avgIntegrationHealth * 3.0;
      totalWeight += 3.0;
    }
  }

  // Final normalization
  if (totalWeight === 0) return 5.0; // Default neutral score if no data
  const finalScore = Math.round((score / totalWeight) * 10 * 10) / 10; // scale to 10, one decimal
  return Math.max(0, Math.min(10, finalScore));
}

/**
 * Calculate health score with integration data fetching
 */
async function calculateHealthScoreWithIntegrations(customer) {
  try {
    let integrationData = {};

    // Fetch Jira metrics if configured
    if (customer.integrations?.jira?.projectKey) {
      try {
        integrationData.jira = await jiraService.getCustomerMetrics(customer.integrations.jira.projectKey);
      } catch (error) {
        console.warn(`Failed to fetch Jira data for customer ${customer._id}:`, error.message);
      }
    }

    // Fetch Zendesk metrics if configured
    if (customer.integrations?.zendesk?.organizationId) {
      try {
        integrationData.zendesk = await zendeskService.getCustomerMetrics(customer.integrations.zendesk.organizationId);
      } catch (error) {
        console.warn(`Failed to fetch Zendesk data for customer ${customer._id}:`, error.message);
      }
    }

    // Fetch HubSpot metrics if configured
    if (customer.integrations?.hubspot?.companyId) {
      try {
        integrationData.hubspot = await hubspotService.getCustomerMetrics(customer.integrations.hubspot.companyId);
      } catch (error) {
        console.warn(`Failed to fetch HubSpot data for customer ${customer._id}:`, error.message);
      }
    }

    // Calculate health score with all data
    const healthScore = calculateHealthScore({
      feedback: customer.feedback,
      sentimentTrend: customer.sentimentTrend,
      ticketVolume: customer.ticketVolume,
      productUsage: customer.productUsage,
      renewalLikelihood: customer.renewalLikelihood,
      socialStats: customer.socialStats,
      integrationData
    });

    return {
      healthScore,
      integrationData,
      calculatedAt: new Date()
    };
  } catch (error) {
    console.error('Error calculating health score with integrations:', error);
    // Fallback to basic calculation
    return {
      healthScore: calculateHealthScore({
        feedback: customer.feedback,
        sentimentTrend: customer.sentimentTrend,
        ticketVolume: customer.ticketVolume,
        productUsage: customer.productUsage,
        renewalLikelihood: customer.renewalLikelihood,
        socialStats: customer.socialStats
      }),
      integrationData: {},
      calculatedAt: new Date()
    };
  }
}

/**
 * Calculate renewal likelihood based on customer data
 * This provides an automated assessment that can be used as a starting point
 */
function calculateRenewalLikelihood(customer) {
  let score = 0;
  let factors = [];

  // Health Score Factor (0-10 scale)
  if (customer.healthScore !== undefined) {
    const healthFactor = customer.healthScore / 10;
    score += healthFactor * 0.3; // 30% weight
    factors.push(`Health Score: ${customer.healthScore}/10`);
  }

  // Product Usage Factor
  if (customer.productUsage && customer.productUsage.length > 0) {
    const usageFactor = Math.min(customer.productUsage.length / 3, 1); // Normalize to 0-1, max at 3+ products
    score += usageFactor * 0.2; // 20% weight
    factors.push(`Product Usage: ${customer.productUsage.length} products`);
  }

  // Support Satisfaction Factor
  if (customer.integrationData?.zendesk?.satisfactionScore !== undefined) {
    const satisfactionFactor = customer.integrationData.zendesk.satisfactionScore / 100;
    score += satisfactionFactor * 0.25; // 25% weight
    factors.push(`Support Satisfaction: ${customer.integrationData.zendesk.satisfactionScore}%`);
  }

  // Ticket Volume Factor (lower is better)
  const totalTickets = (customer.integrationData?.jira?.openIssues || 0) + 
                      (customer.integrationData?.zendesk?.openTickets || 0);
  if (totalTickets > 0) {
    const ticketFactor = Math.max(0, 1 - (totalTickets / 20)); // Normalize, 20+ tickets = 0 score
    score += ticketFactor * 0.15; // 15% weight
    factors.push(`Open Tickets: ${totalTickets}`);
  }

  // Recent Activity Factor
  if (customer.lastHealthScoreUpdate) {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(customer.lastHealthScoreUpdate)) / (1000 * 60 * 60 * 24));
    const activityFactor = Math.max(0, 1 - (daysSinceUpdate / 30)); // 30+ days = 0 score
    score += activityFactor * 0.1; // 10% weight
    factors.push(`Days Since Activity: ${daysSinceUpdate}`);
  }

  // Determine likelihood based on score
  let likelihood;
  if (score >= 0.7) {
    likelihood = 'high';
  } else if (score >= 0.4) {
    likelihood = 'medium';
  } else {
    likelihood = 'low';
  }

  return {
    likelihood,
    score: Math.round(score * 100) / 100,
    factors
  };
}

module.exports = {
  calculateHealthScore,
  calculateHealthScoreWithIntegrations,
  calculateRenewalLikelihood
};
