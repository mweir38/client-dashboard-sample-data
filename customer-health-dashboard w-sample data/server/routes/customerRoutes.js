const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { calculateHealthScoreWithIntegrations, calculateRenewalLikelihood } = require('../utils/healthScore');

// @route   GET api/customers
// @desc    Get all customers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json(customers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/customers/:id
// @desc    Get customer by ID with fresh API data
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }

    // Check if we should fetch fresh API data (if data is older than 30 minutes)
    const shouldRefresh = !customer.lastHealthScoreUpdate ||
                         (Date.now() - new Date(customer.lastHealthScoreUpdate).getTime()) > 30 * 60 * 1000;

    if (shouldRefresh && req.query.refresh !== 'false') {
      try {
        const result = await calculateHealthScoreWithIntegrations(customer);
        
        // Update customer with fresh data
        customer.healthScore = result.healthScore;
        customer.integrationData = result.integrationData;
        customer.lastHealthScoreUpdate = result.calculatedAt;

        // Add to health score history if score changed
        const lastScore = customer.healthScoreHistory[customer.healthScoreHistory.length - 1]?.score;
        if (lastScore !== result.healthScore) {
          customer.healthScoreHistory.push({
            date: result.calculatedAt,
            score: result.healthScore
          });
        }

        await customer.save();
      } catch (integrationError) {
        console.error('Integration data fetch failed:', integrationError.message);
        // Continue with cached data if available
      }
    }
    
    res.json(customer);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/customers
// @desc    Create a new customer (admin only)
// @access  Private/Admin
router.post('/', auth, authorize('admin'), async (req, res) => {
  const { name, arr, healthScore, tools, productUsage } = req.body;

  try {
    const customer = new Customer({
      name,
      arr: arr || 0,
      healthScore: healthScore || 0,
      tools: tools || [],
      productUsage: productUsage || [],
      healthScoreHistory: [{
        date: new Date(),
        score: healthScore || 0
      }]
    });

    await customer.save();
    res.json(customer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/customers/:id
// @desc    Update customer (admin only)
// @access  Private/Admin
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  const { name, arr, healthScore, tools, productUsage } = req.body;

  try {
    let customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }

    // Update fields
    customer.name = name || customer.name;
    customer.arr = arr !== undefined ? arr : customer.arr;
    
    // If health score is being updated, add to history
    if (healthScore !== undefined && healthScore !== customer.healthScore) {
      customer.healthScore = healthScore;
      customer.healthScoreHistory.push({
        date: new Date(),
        score: healthScore
      });
    }
    
    customer.tools = tools || customer.tools;
    customer.productUsage = productUsage || customer.productUsage;

    await customer.save();
    res.json(customer);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/customers/:id
// @desc    Delete customer (admin only)
// @access  Private/Admin
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Customer deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/customers/:id/refresh-health
// @desc    Refresh customer health score with integration data
// @access  Private
router.post('/:id/refresh-health', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }

    // Calculate new health score with integrations
    const result = await calculateHealthScoreWithIntegrations(customer);
    
    // Update customer with new health score and integration data
    const oldHealthScore = customer.healthScore;
    customer.healthScore = result.healthScore;
    customer.integrationData = result.integrationData;
    customer.lastHealthScoreUpdate = result.calculatedAt;

    // Add to health score history if score changed
    if (oldHealthScore !== result.healthScore) {
      customer.healthScoreHistory.push({
        date: result.calculatedAt,
        score: result.healthScore
      });
    }

    await customer.save();
    res.json({
      customer,
      integrationData: result.integrationData,
      previousScore: oldHealthScore,
      newScore: result.healthScore
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/customers/refresh-all-health
// @desc    Refresh health scores for all customers (admin only)
// @access  Private/Admin
router.post('/refresh-all-health', auth, authorize('admin'), async (req, res) => {
  try {
    const customers = await Customer.find();
    const results = [];

    for (const customer of customers) {
      try {
        const result = await calculateHealthScoreWithIntegrations(customer);
        
        const oldHealthScore = customer.healthScore;
        customer.healthScore = result.healthScore;
        customer.integrationData = result.integrationData;
        customer.lastHealthScoreUpdate = result.calculatedAt;

        // Add to health score history if score changed
        if (oldHealthScore !== result.healthScore) {
          customer.healthScoreHistory.push({
            date: result.calculatedAt,
            score: result.healthScore
          });
        }

        await customer.save();
        
        results.push({
          customerId: customer._id,
          customerName: customer.name,
          previousScore: oldHealthScore,
          newScore: result.healthScore,
          hasIntegrationData: Object.keys(result.integrationData).length > 0
        });
      } catch (error) {
        console.error(`Error updating customer ${customer._id}:`, error.message);
        results.push({
          customerId: customer._id,
          customerName: customer.name,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Health score refresh completed',
      results,
      totalCustomers: customers.length,
      successfulUpdates: results.filter(r => !r.error).length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/customers/:id/integration-metrics
// @desc    Get integration metrics for a customer
// @access  Private
router.get('/:id/integration-metrics', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }

    // Return cached integration data if available and recent (less than 1 hour old)
    if (customer.integrationData && customer.lastHealthScoreUpdate) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (customer.lastHealthScoreUpdate > oneHourAgo) {
        return res.json({
          integrationData: customer.integrationData,
          lastUpdated: customer.lastHealthScoreUpdate,
          cached: true
        });
      }
    }

    // Fetch fresh integration data
    const result = await calculateHealthScoreWithIntegrations(customer);
    
    res.json({
      integrationData: result.integrationData,
      lastUpdated: result.calculatedAt,
      cached: false
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/customers/:id/tickets
// @desc    Get customer tickets from Zendesk
// @access  Private
router.get('/:id/tickets', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }

    // Check access permissions
    if (req.user.role !== 'admin') {
      // For client users, check if they are associated with this customer
      if (req.user.role === 'client') {
        // Get the user's customer association
        const user = await User.findById(req.user.id);
        if (!user || user.customerId?.toString() !== id) {
          return res.status(403).json({ error: 'Access denied to this customer data' });
        }
      } else {
        // For other roles, check direct customerId match
        if (req.user.customerId !== id) {
          return res.status(403).json({ error: 'Access denied to this customer data' });
        }
      }
    }

    const zendeskService = require('../services/zendeskService');
    
    // Try to get tickets using customer email or name
    const customerEmail = customer.email || `${customer.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    
    try {
      const tickets = await zendeskService.getCustomerTickets(customerEmail, customer.name);
      const feedbackNotes = await zendeskService.getCustomerFeedbackNotes(customerEmail, customer.name, 30);

      // If no real tickets found, check for sample data
      if (tickets.length === 0 && customer.sampleData?.zendeskTickets) {
        res.json({
          tickets: customer.sampleData.zendeskTickets,
          feedbackNotes: { tickets: [], volume: 0, period: '30 days' },
          customerEmail,
          lastFetched: new Date(),
          message: 'Sample data (real Zendesk integration unavailable)'
        });
      } else {
        res.json({
          tickets: tickets.slice(0, 10), // Limit to 10 most recent
          feedbackNotes,
          customerEmail,
          lastFetched: new Date()
        });
      }
    } catch (error) {
      // Return sample data if real integration fails
      if (customer.sampleData?.zendeskTickets) {
        res.json({
          tickets: customer.sampleData.zendeskTickets,
          feedbackNotes: { tickets: [], volume: 0, period: '30 days' },
          customerEmail,
          lastFetched: new Date(),
          message: 'Sample data (real Zendesk integration unavailable)'
        });
      } else {
        res.json({
          tickets: [],
          feedbackNotes: { tickets: [], volume: 0, period: '30 days' },
          customerEmail,
          lastFetched: new Date(),
          message: 'No Zendesk integration configured for this customer'
        });
      }
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      error: 'Failed to fetch tickets',
      tickets: [],
      feedbackNotes: { tickets: [], volume: 0, period: '30 days' }
    });
  }
});

// @route   GET api/customers/:id/hubspot-status
// @desc    Get customer HubSpot status and deals
// @access  Private
router.get('/:id/hubspot-status', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }

    const hubspotService = require('../services/hubspotService');
    
    // Try to find company by name if no companyId stored
    let companyData = null;
    let products = [];
    
    if (customer.integrationData?.hubspot?.companyId) {
      companyData = await hubspotService.getCompanyById(customer.integrationData.hubspot.companyId);
      products = await hubspotService.getCompanyProducts(customer.integrationData.hubspot.companyId);
    } else {
      // Search for company by name
      const companies = await hubspotService.searchCompanies(customer.name, 1);
      if (companies.length > 0) {
        companyData = companies[0];
        products = await hubspotService.getCompanyProducts(companyData.id);
      }
    }

    res.json({
      company: companyData,
      products,
      lastFetched: new Date()
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      error: 'Failed to fetch HubSpot status',
      company: null,
      products: []
    });
  }
});

// @route   GET api/customers/:id/calculate-renewal
// @desc    Calculate automated renewal likelihood for customer
// @access  Private
router.get('/:id/calculate-renewal', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }

    const calculation = calculateRenewalLikelihood(customer);
    
    res.json({
      customerId: customer._id,
      customerName: customer.name,
      currentRenewalLikelihood: customer.renewalLikelihood,
      calculatedRenewalLikelihood: calculation.likelihood,
      calculatedScore: calculation.score,
      factors: calculation.factors,
      calculationDate: new Date()
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to calculate renewal likelihood' });
  }
});

// Include Jira ticket routes
const jiraRoutes = require('./jiraRoutes');
router.use('/', jiraRoutes);

module.exports = router;
