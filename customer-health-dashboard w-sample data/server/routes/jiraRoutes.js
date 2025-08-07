const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const jiraService = require('../services/jiraService');
const Customer = require('../models/Customer');
const User = require('../models/User');

// @route   GET api/customers/:id/jira-tickets
// @desc    Get Jira tickets for a specific customer
// @access  Private
router.get('/:id/jira-tickets', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify customer exists
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if user has access to this customer's data
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

    // Get Jira configuration for this customer
    const jiraConfig = customer.integrations?.jira;
    if (!jiraConfig || !jiraConfig.projectKey) {
      // Return sample data if available
      if (customer.sampleData?.jiraTickets) {
        return res.json({
          tickets: customer.sampleData.jiraTickets,
          total: customer.sampleData.jiraTickets.length,
          customer: customer.name,
          lastFetched: new Date(),
          message: 'Sample data (no real Jira integration configured)'
        });
      }
      return res.json({
        tickets: [],
        message: 'No Jira integration configured for this customer'
      });
    }

    try {
      // Fetch tickets from Jira service
      const tickets = await jiraService.getCustomerTickets(customer._id, jiraConfig.projectKey);
      
      // Filter and format tickets for client display
      const formattedTickets = tickets.map(ticket => ({
        key: ticket.key,
        id: ticket.id,
        summary: ticket.fields.summary,
        description: ticket.fields.description,
        status: ticket.fields.status.name,
        priority: ticket.fields.priority?.name || 'Medium',
        assignee: ticket.fields.assignee?.displayName || 'Unassigned',
        reporter: ticket.fields.reporter?.displayName || 'Unknown',
        created: ticket.fields.created,
        updated: ticket.fields.updated,
        resolved: ticket.fields.resolutiondate,
        issueType: ticket.fields.issuetype.name,
        url: `${process.env.JIRA_BASE_URL}/browse/${ticket.key}`,
        labels: ticket.fields.labels || [],
        components: ticket.fields.components?.map(c => c.name) || [],
        resolution_time: ticket.fields.resolutiondate 
          ? new Date(ticket.fields.resolutiondate) - new Date(ticket.fields.created)
          : null
      }));

      // Sort by created date (newest first)
      formattedTickets.sort((a, b) => new Date(b.created) - new Date(a.created));

      res.json({
        tickets: formattedTickets,
        total: formattedTickets.length,
        customer: customer.name,
        lastFetched: new Date()
      });

    } catch (jiraError) {
      console.error('Jira API Error:', jiraError.message);
      res.status(500).json({
        error: 'Failed to fetch Jira tickets',
        tickets: [],
        message: 'Unable to connect to Jira. Please check integration settings.'
      });
    }

  } catch (error) {
    console.error('Error fetching Jira tickets:', error);
    res.status(500).json({ 
      error: 'Server error while fetching Jira tickets',
      tickets: []
    });
  }
});

// @route   GET api/customers/:id/jira-metrics
// @desc    Get Jira metrics and KPIs for a specific customer
// @access  Private
router.get('/:id/jira-metrics', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
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

    const jiraConfig = customer.integrations?.jira;
    if (!jiraConfig || !jiraConfig.projectKey) {
      return res.json({
        metrics: {
          totalIssues: 0,
          openIssues: 0,
          closedIssues: 0,
          criticalIssues: 0,
          avgResolutionTime: 0,
          issuesByType: {},
          issuesByPriority: {},
          recentActivity: []
        }
      });
    }

    try {
      const tickets = await jiraService.getCustomerTickets(customer._id, jiraConfig.projectKey);
      
      // Calculate metrics
      const totalIssues = tickets.length;
      const openIssues = tickets.filter(t => 
        !['Done', 'Closed', 'Resolved'].includes(t.fields.status.name)
      ).length;
      const closedIssues = totalIssues - openIssues;
      const criticalIssues = tickets.filter(t => 
        ['Critical', 'Highest'].includes(t.fields.priority?.name)
      ).length;

      // Calculate average resolution time
      const resolvedTickets = tickets.filter(t => t.fields.resolutiondate);
      const avgResolutionTime = resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, ticket) => {
            const created = new Date(ticket.fields.created);
            const resolved = new Date(ticket.fields.resolutiondate);
            return sum + (resolved - created);
          }, 0) / resolvedTickets.length
        : 0;

      // Group by issue type
      const issuesByType = tickets.reduce((acc, ticket) => {
        const type = ticket.fields.issuetype.name;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      // Group by priority
      const issuesByPriority = tickets.reduce((acc, ticket) => {
        const priority = ticket.fields.priority?.name || 'Medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {});

      // Recent activity (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentActivity = tickets
        .filter(t => new Date(t.fields.created) >= thirtyDaysAgo)
        .map(t => ({
          key: t.key,
          summary: t.fields.summary,
          created: t.fields.created,
          status: t.fields.status.name
        }))
        .sort((a, b) => new Date(b.created) - new Date(a.created))
        .slice(0, 10);

      res.json({
        metrics: {
          totalIssues,
          openIssues,
          closedIssues,
          criticalIssues,
          avgResolutionTime: Math.round(avgResolutionTime / (1000 * 60 * 60)), // Convert to hours
          issuesByType,
          issuesByPriority,
          recentActivity
        },
        customer: customer.name,
        lastCalculated: new Date()
      });

    } catch (jiraError) {
      console.error('Jira Metrics Error:', jiraError.message);
      res.status(500).json({
        error: 'Failed to calculate Jira metrics',
        metrics: {
          totalIssues: 0,
          openIssues: 0,
          closedIssues: 0,
          criticalIssues: 0,
          avgResolutionTime: 0,
          issuesByType: {},
          issuesByPriority: {},
          recentActivity: []
        }
      });
    }

  } catch (error) {
    console.error('Error calculating Jira metrics:', error);
    res.status(500).json({ error: 'Server error while calculating metrics' });
  }
});

module.exports = router;
