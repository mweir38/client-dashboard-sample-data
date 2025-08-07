const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const alertsService = require('../services/alertsService');
const aiInsightsService = require('../services/aiInsightsService');
const { auth, authorize } = require('../middleware/auth');

// @route   GET api/alerts
// @desc    Get all active alerts across all customers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const alerts = await alertsService.getAllActiveAlerts();
    res.json(alerts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/alerts/customer/:id
// @desc    Get alerts for a specific customer
// @access  Private
router.get('/customer/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }

    const alerts = await alertsService.generateCustomerAlerts(customer);
    res.json(alerts);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/alerts/customer/:id/summary
// @desc    Get AI-generated summary for a customer
// @access  Private
router.get('/customer/:id/summary', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }

    // Check if we have a recent AI summary (less than 1 hour old)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (customer.aiSummary && customer.lastAISummaryUpdate && customer.lastAISummaryUpdate > oneHourAgo) {
      return res.json({
        summary: customer.aiSummary,
        lastUpdated: customer.lastAISummaryUpdate,
        cached: true
      });
    }

    // Generate fresh summary
    const alerts = await alertsService.generateCustomerAlerts(customer);
    const summary = alertsService.generateAISummary(customer, alerts);

    // Update customer with new summary
    customer.aiSummary = summary;
    customer.lastAISummaryUpdate = new Date();
    await customer.save();

    res.json({
      summary,
      lastUpdated: customer.lastAISummaryUpdate,
      cached: false,
      alerts: alerts.length
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/alerts/refresh-all
// @desc    Refresh AI summaries for all customers (admin only)
// @access  Private/Admin
router.post('/refresh-all', auth, authorize('admin'), async (req, res) => {
  try {
    const customers = await Customer.find();
    const results = [];

    for (const customer of customers) {
      try {
        const alerts = await alertsService.generateCustomerAlerts(customer);
        const summary = alertsService.generateAISummary(customer, alerts);

        customer.aiSummary = summary;
        customer.lastAISummaryUpdate = new Date();
        await customer.save();

        results.push({
          customerId: customer._id,
          customerName: customer.name,
          alertCount: alerts.length,
          summaryLength: summary.length,
          updated: true
        });
      } catch (error) {
        console.error(`Error updating customer ${customer._id}:`, error.message);
        results.push({
          customerId: customer._id,
          customerName: customer.name,
          error: error.message,
          updated: false
        });
      }
    }

    res.json({
      message: 'AI summary refresh completed',
      results,
      totalCustomers: customers.length,
      successfulUpdates: results.filter(r => r.updated).length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Helper function to generate portfolio analytics
async function generatePortfolioAnalytics() {
  try {
    const customers = await Customer.find();
    let totalRiskScore = 0;
    let behaviorCategories = { Champion: 0, Advocate: 0, Passive: 0, 'At Risk': 0, Critical: 0 };
    let trendDirections = { improving: 0, declining: 0, stable: 0 };
    let validCustomers = 0;

    for (const customer of customers) {
      // Calculate risk score using the AI insights service
      const riskScore = aiInsightsService.calculateComprehensiveRiskScore(customer);
      totalRiskScore += riskScore;
      
      // Get behavior score
      const behaviorAnalysis = aiInsightsService.generateBehaviorScore(customer);
      if (behaviorAnalysis.category) {
        behaviorCategories[behaviorAnalysis.category]++;
      }

      // Get trend patterns
      const trendAnalysis = aiInsightsService.analyzeTrendPatterns(customer);
      if (trendAnalysis.predictedDirection) {
        const direction = trendAnalysis.predictedDirection.includes('improving') ? 'improving' :
                         trendAnalysis.predictedDirection.includes('declining') ? 'declining' : 'stable';
        trendDirections[direction]++;
      }

      validCustomers++;
    }

    const avgRiskScore = validCustomers > 0 ? Math.round(totalRiskScore / validCustomers) : 0;
    
    // Determine dominant behavior category
    const dominantBehavior = Object.keys(behaviorCategories).reduce((a, b) => 
      behaviorCategories[a] > behaviorCategories[b] ? a : b
    );

    // Determine overall trend direction
    const dominantTrend = Object.keys(trendDirections).reduce((a, b) => 
      trendDirections[a] > trendDirections[b] ? a : b
    );

    return {
      riskScore: avgRiskScore,
      behaviorScore: {
        category: dominantBehavior,
        distribution: behaviorCategories
      },
      trendDirection: dominantTrend,
      trendDistribution: trendDirections,
      totalCustomers: validCustomers
    };
  } catch (error) {
    console.error('Error generating portfolio analytics:', error);
    return {
      riskScore: 0,
      behaviorScore: { category: 'Unknown' },
      trendDirection: 'stable'
    };
  }
}

// @route   GET api/alerts/dashboard-insights
// @desc    Get key insights for dashboard with enhanced analytics
// @access  Private
router.get('/dashboard-insights', auth, async (req, res) => {
  try {
    const alerts = await alertsService.getAllActiveAlerts();
    
    // Categorize alerts
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const highAlerts = alerts.filter(a => a.severity === 'high');
    const mediumAlerts = alerts.filter(a => a.severity === 'medium');
    const lowAlerts = alerts.filter(a => a.severity === 'low');
    const actionRequiredAlerts = alerts.filter(a => a.actionRequired);
    
    // Non-overlapping categories for display
    const criticalActionRequired = alerts.filter(a => a.severity === 'critical' && a.actionRequired);
    const nonCriticalActionRequired = alerts.filter(a => a.severity !== 'critical' && a.actionRequired);
    const criticalNoAction = alerts.filter(a => a.severity === 'critical' && !a.actionRequired);
    const otherAlerts = alerts.filter(a => a.severity !== 'critical' && !a.actionRequired);
    
    // Get alert type distribution
    const alertTypes = {};
    alerts.forEach(alert => {
      alertTypes[alert.type] = (alertTypes[alert.type] || 0) + 1;
    });

    // Get customers with most alerts
    const customerAlertCounts = {};
    alerts.forEach(alert => {
      const key = alert.customerId.toString();
      if (!customerAlertCounts[key]) {
        customerAlertCounts[key] = {
          customerId: alert.customerId,
          customerName: alert.customerName,
          count: 0,
          criticalCount: 0
        };
      }
      customerAlertCounts[key].count++;
      if (alert.severity === 'critical') {
        customerAlertCounts[key].criticalCount++;
      }
    });

    const topRiskCustomers = Object.values(customerAlertCounts)
      .sort((a, b) => b.criticalCount - a.criticalCount || b.count - a.count)
      .slice(0, 5);

    // Generate insights
    const insights = [];
    
    if (criticalAlerts.length > 0) {
      insights.push({
        type: 'critical',
        title: `${criticalAlerts.length} Critical Alert${criticalAlerts.length > 1 ? 's' : ''}`,
        description: `Immediate attention required for ${criticalAlerts.length} customer${criticalAlerts.length > 1 ? 's' : ''}`,
        count: criticalAlerts.length,
        priority: 1
      });
    }

    if (actionRequiredAlerts.length > 0) {
      insights.push({
        type: 'action_required',
        title: `${actionRequiredAlerts.length} Action${actionRequiredAlerts.length > 1 ? 's' : ''} Required`,
        description: `${actionRequiredAlerts.length} alert${actionRequiredAlerts.length > 1 ? 's' : ''} need${actionRequiredAlerts.length === 1 ? 's' : ''} follow-up`,
        count: actionRequiredAlerts.length,
        priority: 2
      });
    }

    // Add specific alert type insights
    if (alertTypes.renewal_risk > 0) {
      insights.push({
        type: 'renewal_risk',
        title: `${alertTypes.renewal_risk} Renewal Risk${alertTypes.renewal_risk > 1 ? 's' : ''}`,
        description: `Customer${alertTypes.renewal_risk > 1 ? 's' : ''} approaching renewal with engagement concerns`,
        count: alertTypes.renewal_risk,
        priority: 3
      });
    }

    if (alertTypes.negative_feedback > 0) {
      insights.push({
        type: 'negative_feedback',
        title: `${alertTypes.negative_feedback} Negative Feedback Pattern${alertTypes.negative_feedback > 1 ? 's' : ''}`,
        description: `Customer${alertTypes.negative_feedback > 1 ? 's' : ''} showing concerning feedback trends`,
        count: alertTypes.negative_feedback,
        priority: 4
      });
    }

    // Generate enhanced analytics
    const analytics = await generatePortfolioAnalytics();

    res.json({
      summary: {
        totalAlerts: alerts.length,
        criticalAlerts: criticalAlerts.length,
        highAlerts: highAlerts.length,
        mediumAlerts: mediumAlerts.length,
        lowAlerts: lowAlerts.length,
        actionRequired: actionRequiredAlerts.length,
        // Non-overlapping breakdown for accurate display
        breakdown: {
          criticalActionRequired: criticalActionRequired.length,
          nonCriticalActionRequired: nonCriticalActionRequired.length,
          criticalNoAction: criticalNoAction.length,
          otherAlerts: otherAlerts.length
        }
      },
      insights: insights.sort((a, b) => a.priority - b.priority),
      alertTypes,
      topRiskCustomers,
      analytics,
      lastUpdated: new Date()
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;