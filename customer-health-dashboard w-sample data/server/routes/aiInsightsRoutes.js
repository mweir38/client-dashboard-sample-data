const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const aiInsightsService = require('../services/aiInsightsService');

// @route   GET api/ai-insights/customer/:customerId
// @desc    Get AI-powered insights for a specific customer
// @access  Private/Admin
router.get('/customer/:customerId', auth, authorize('admin'), async (req, res) => {
  try {
    const insights = await aiInsightsService.generateCustomerInsights(req.params.customerId);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (err) {
    console.error('Error generating customer insights:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to generate customer insights' 
    });
  }
});

// @route   GET api/ai-insights/portfolio
// @desc    Get AI-powered portfolio insights
// @access  Private/Admin
router.get('/portfolio', auth, authorize('admin'), async (req, res) => {
  try {
    const filters = req.query;
    const insights = await aiInsightsService.generatePortfolioInsights(filters);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (err) {
    console.error('Error generating portfolio insights:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to generate portfolio insights' 
    });
  }
});

// @route   GET api/ai-insights/risk-analysis
// @desc    Get AI-powered risk analysis for all customers
// @access  Private/Admin
router.get('/risk-analysis', auth, authorize('admin'), async (req, res) => {
  try {
    const filters = req.query;
    const insights = await aiInsightsService.generatePortfolioInsights(filters);
    
    const riskAnalysis = {
      highRiskCustomers: insights.riskSegments.segments.critical,
      atRiskCustomers: insights.riskSegments.segments.atRisk,
      churnPredictions: insights.churnPredictions,
      recommendations: insights.optimizationRecommendations
    };
    
    res.json({
      success: true,
      data: riskAnalysis
    });
  } catch (err) {
    console.error('Error generating risk analysis:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to generate risk analysis' 
    });
  }
});

// @route   GET api/ai-insights/opportunities
// @desc    Get AI-powered growth opportunities
// @access  Private
router.get('/opportunities', auth, authorize('admin'), async (req, res) => {
  try {
    const filters = req.query;
    const insights = await aiInsightsService.generatePortfolioInsights(filters);
    
    const opportunities = {
      growthOpportunities: insights.growthOpportunities,
      marketInsights: insights.marketInsights,
      strategicRecommendations: insights.strategicRecommendations
    };
    
    res.json({
      success: true,
      data: opportunities
    });
  } catch (err) {
    console.error('Error generating opportunities:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to generate opportunities' 
    });
  }
});

// @route   GET api/ai-insights/predictions
// @desc    Get AI-powered predictions for customers
// @access  Private
router.get('/predictions', auth, authorize('admin'), async (req, res) => {
  try {
    const { customerId } = req.query;
    
    if (customerId) {
      // Get predictions for specific customer
      const insights = await aiInsightsService.generateCustomerInsights(customerId);
      res.json({
        success: true,
        data: insights.predictiveInsights
      });
    } else {
      // Get portfolio-wide predictions
      const insights = await aiInsightsService.generatePortfolioInsights(req.query);
      res.json({
        success: true,
        data: {
          churnPredictions: insights.churnPredictions,
          portfolioOverview: insights.portfolioOverview
        }
      });
    }
  } catch (err) {
    console.error('Error generating predictions:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to generate predictions' 
    });
  }
});

// @route   GET api/ai-insights/trends
// @desc    Get AI-powered trend analysis
// @access  Private
router.get('/trends', auth, authorize('admin'), async (req, res) => {
  try {
    const { customerId } = req.query;
    
    if (customerId) {
      // Get trends for specific customer
      const insights = await aiInsightsService.generateCustomerInsights(customerId);
      res.json({
        success: true,
        data: insights.trends
      });
    } else {
      // Get portfolio-wide trends
      const insights = await aiInsightsService.generatePortfolioInsights(req.query);
      res.json({
        success: true,
        data: {
          portfolioOverview: insights.portfolioOverview,
          marketInsights: insights.marketInsights
        }
      });
    }
  } catch (err) {
    console.error('Error generating trends:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to generate trends' 
    });
  }
});

// @route   GET api/ai-insights/recommendations
// @desc    Get AI-powered recommendations
// @access  Private
router.get('/recommendations', auth, authorize('admin'), async (req, res) => {
  try {
    const { customerId } = req.query;
    
    if (customerId) {
      // Get recommendations for specific customer
      const insights = await aiInsightsService.generateCustomerInsights(customerId);
      res.json({
        success: true,
        data: {
          recommendations: insights.recommendations,
          actionItems: insights.actionItems
        }
      });
    } else {
      // Get portfolio-wide recommendations
      const insights = await aiInsightsService.generatePortfolioInsights(req.query);
      res.json({
        success: true,
        data: {
          optimizationRecommendations: insights.optimizationRecommendations,
          strategicRecommendations: insights.strategicRecommendations
        }
      });
    }
  } catch (err) {
    console.error('Error generating recommendations:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to generate recommendations' 
    });
  }
});

// @route   GET api/ai-insights/action-items
// @desc    Get AI-powered action items
// @access  Private
router.get('/action-items', auth, authorize('admin'), async (req, res) => {
  try {
    const { customerId } = req.query;
    
    if (customerId) {
      // Get action items for specific customer
      const insights = await aiInsightsService.generateCustomerInsights(customerId);
      res.json({
        success: true,
        data: insights.actionItems
      });
    } else {
      // Get portfolio-wide action items
      const insights = await aiInsightsService.generatePortfolioInsights(req.query);
      
      // Generate portfolio-wide action items
      const actionItems = {
        immediate: [],
        shortTerm: [],
        mediumTerm: [],
        longTerm: []
      };
      
      // Add critical intervention actions
      if (insights.portfolioOverview.criticalCustomers > 0) {
        actionItems.immediate.push({
          priority: 'critical',
          timeframe: '24 hours',
          action: 'Address critical customers',
          owner: 'Customer Success Team',
          description: `${insights.portfolioOverview.criticalCustomers} customers require immediate attention`
        });
      }
      
      // Add proactive engagement actions
      if (insights.portfolioOverview.atRiskCustomers > 0) {
        actionItems.shortTerm.push({
          priority: 'high',
          timeframe: '1 week',
          action: 'Proactive engagement program',
          owner: 'Customer Success Team',
          description: `Engage ${insights.portfolioOverview.atRiskCustomers} at-risk customers`
        });
      }
      
      res.json({
        success: true,
        data: actionItems
      });
    }
  } catch (err) {
    console.error('Error generating action items:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to generate action items' 
    });
  }
});

// @route   GET api/ai-insights/summary
// @desc    Get AI-powered insights summary
// @access  Private
router.get('/summary', auth, authorize('admin'), async (req, res) => {
  try {
    const filters = req.query;
    const insights = await aiInsightsService.generatePortfolioInsights(filters);
    
    const summary = {
      portfolioHealth: insights.portfolioOverview,
      topRisks: insights.riskSegments.segments.critical.slice(0, 3),
      topOpportunities: insights.growthOpportunities.topOpportunities,
      keyRecommendations: insights.optimizationRecommendations.slice(0, 3),
      churnRisk: insights.churnPredictions.averageRisk,
      totalPotentialValue: insights.growthOpportunities.totalPotentialValue
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    console.error('Error generating insights summary:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to generate insights summary' 
    });
  }
});

// @route   POST api/ai-insights/analyze
// @desc    Analyze specific customer data with AI
// @access  Private
router.post('/analyze', auth, authorize('admin'), async (req, res) => {
  try {
    const { customerId, analysisType } = req.body;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }
    
    const insights = await aiInsightsService.generateCustomerInsights(customerId);
    
    let analysisResult;
    switch (analysisType) {
      case 'risk':
        analysisResult = insights.riskAnalysis;
        break;
      case 'opportunities':
        analysisResult = insights.opportunities;
        break;
      case 'recommendations':
        analysisResult = insights.recommendations;
        break;
      case 'trends':
        analysisResult = insights.trends;
        break;
      case 'predictions':
        analysisResult = insights.predictiveInsights;
        break;
      case 'actions':
        analysisResult = insights.actionItems;
        break;
      default:
        analysisResult = insights;
    }
    
    res.json({
      success: true,
      data: analysisResult
    });
  } catch (err) {
    console.error('Error analyzing customer data:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to analyze customer data' 
    });
  }
});

module.exports = router; 