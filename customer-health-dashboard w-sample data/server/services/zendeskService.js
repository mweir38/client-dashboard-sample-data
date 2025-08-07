const axios = require('axios');

class ZendeskService {
  constructor() {
    this.subdomain = process.env.ZENDESK_SUBDOMAIN;
    this.email = process.env.ZENDESK_EMAIL;
    this.apiToken = process.env.ZENDESK_API_TOKEN;
    
    if (!this.subdomain || !this.email || !this.apiToken) {
      console.warn('Zendesk credentials not configured. Set ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, and ZENDESK_API_TOKEN in .env');
    }
  }

  getAuthHeaders() {
    const auth = Buffer.from(`${this.email}/token:${this.apiToken}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  async getTickets(organizationId) {
    try {
      if (!this.subdomain) {
        throw new Error('Zendesk not configured');
      }

      const response = await axios.get(
        `https://${this.subdomain}.zendesk.com/api/v2/organizations/${organizationId}/tickets.json`,
        {
          headers: this.getAuthHeaders(),
          params: {
            per_page: 100,
            sort_by: 'created_at',
            sort_order: 'desc'
          }
        }
      );

      return response.data.tickets;
    } catch (error) {
      console.error('Error fetching Zendesk tickets:', error.message);
      throw error;
    }
  }

  // Search tickets using Zendesk search API
  async searchTickets(query, sortBy = 'created_at', sortOrder = 'desc') {
    try {
      if (!this.subdomain) {
        throw new Error('Zendesk not configured');
      }

      const response = await axios.get(
        `https://${this.subdomain}.zendesk.com/api/v2/search.json`,
        {
          headers: this.getAuthHeaders(),
          params: {
            query: `type:ticket ${query}`,
            sort_by: sortBy,
            sort_order: sortOrder,
            per_page: 100
          }
        }
      );

      return response.data.results;
    } catch (error) {
      console.error('Error searching Zendesk tickets:', error.message);
      throw error;
    }
  }

  // Get detailed ticket information by ID
  async getTicketById(ticketId) {
    try {
      if (!this.subdomain) {
        throw new Error('Zendesk not configured');
      }

      const response = await axios.get(
        `https://${this.subdomain}.zendesk.com/api/v2/tickets/${ticketId}.json`,
        {
          headers: this.getAuthHeaders(),
          params: {
            include: 'users,groups,organizations'
          }
        }
      );

      return response.data.ticket;
    } catch (error) {
      console.error(`Error fetching ticket ${ticketId}:`, error.message);
      throw error;
    }
  }

  // Get user information by ID for mapping tickets to customers
  async getUserById(userId) {
    try {
      if (!this.subdomain) {
        throw new Error('Zendesk not configured');
      }

      const response = await axios.get(
        `https://${this.subdomain}.zendesk.com/api/v2/users/${userId}.json`,
        {
          headers: this.getAuthHeaders()
        }
      );

      return response.data.user;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error.message);
      throw error;
    }
  }

  // Search tickets by customer email or organization
  async getCustomerTickets(customerEmail, organizationName = null) {
    try {
      let query = `requester:${customerEmail}`;
      
      if (organizationName) {
        query += ` organization:"${organizationName}"`;
      }

      const tickets = await this.searchTickets(query);
      return tickets;
    } catch (error) {
      console.error(`Error fetching tickets for customer ${customerEmail}:`, error.message);
      return [];
    }
  }

  // Get ticket volume and feedback notes for a customer
  async getCustomerFeedbackNotes(customerEmail, organizationName = null, days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      let query = `requester:${customerEmail} created>=${startDate.toISOString().split('T')[0]}`;
      
      if (organizationName) {
        query += ` organization:"${organizationName}"`;
      }

      const tickets = await this.searchTickets(query);
      
      // Get detailed ticket information including comments
      const detailedTickets = await Promise.all(
        tickets.slice(0, 20).map(async (ticket) => {
          try {
            const detailed = await this.getTicketById(ticket.id);
            return detailed;
          } catch (error) {
            console.error(`Error fetching detailed ticket ${ticket.id}:`, error.message);
            return ticket;
          }
        })
      );

      return {
        tickets: detailedTickets,
        volume: tickets.length,
        period: `${days} days`
      };
    } catch (error) {
      console.error(`Error fetching feedback notes for customer ${customerEmail}:`, error.message);
      return { tickets: [], volume: 0, period: `${days} days` };
    }
  }

  async getCustomerSatisfactionRatings(organizationId) {
    try {
      if (!this.subdomain) {
        throw new Error('Zendesk not configured');
      }

      const response = await axios.get(
        `https://${this.subdomain}.zendesk.com/api/v2/satisfaction_ratings.json`,
        {
          headers: this.getAuthHeaders(),
          params: {
            'filter[organization_id]': organizationId,
            per_page: 100
          }
        }
      );

      return response.data.satisfaction_ratings;
    } catch (error) {
      console.error('Error fetching satisfaction ratings:', error.message);
      return [];
    }
  }

  async getCustomerMetrics(organizationId) {
    try {
      const tickets = await this.getTickets(organizationId);
      const satisfactionRatings = await this.getCustomerSatisfactionRatings(organizationId);
      
      const openTickets = tickets.filter(ticket => 
        ticket.status !== 'solved' && ticket.status !== 'closed'
      ).length;

      const solvedTickets = tickets.filter(ticket => 
        ticket.status === 'solved' || ticket.status === 'closed'
      ).length;

      const urgentTickets = tickets.filter(ticket => 
        ticket.priority === 'urgent' || ticket.priority === 'high'
      ).length;

      // Calculate average first response time
      const ticketsWithResponse = tickets.filter(ticket => 
        ticket.created_at && ticket.updated_at && ticket.created_at !== ticket.updated_at
      );

      let avgFirstResponseTime = 0;
      if (ticketsWithResponse.length > 0) {
        const totalTime = ticketsWithResponse.reduce((sum, ticket) => {
          const created = new Date(ticket.created_at);
          const updated = new Date(ticket.updated_at);
          return sum + (updated - created);
        }, 0);
        avgFirstResponseTime = Math.round(totalTime / ticketsWithResponse.length / (1000 * 60 * 60)); // Convert to hours
      }

      // Calculate customer satisfaction score
      let satisfactionScore = 0;
      if (satisfactionRatings.length > 0) {
        const scores = satisfactionRatings.map(rating => {
          switch (rating.score) {
            case 'good': return 100;
            case 'bad': return 0;
            default: return 50;
          }
        });
        satisfactionScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      }

      return {
        organizationId,
        openTickets,
        solvedTickets,
        urgentTickets,
        avgFirstResponseTime,
        satisfactionScore,
        totalRatings: satisfactionRatings.length,
        lastSync: new Date()
      };
    } catch (error) {
      console.error(`Error getting Zendesk metrics for organization ${organizationId}:`, error.message);
      // Return default values if API fails
      return {
        organizationId,
        openTickets: 0,
        solvedTickets: 0,
        urgentTickets: 0,
        avgFirstResponseTime: 0,
        satisfactionScore: 75, // Default neutral score
        totalRatings: 0,
        lastSync: new Date()
      };
    }
  }

  calculateSupportHealth(zendeskData) {
    let score = 100;

    // Penalize for urgent tickets (each urgent ticket reduces score by 10)
    score -= zendeskData.urgentTickets * 10;

    // Penalize for high number of open tickets relative to solved
    const totalTickets = zendeskData.openTickets + zendeskData.solvedTickets;
    if (totalTickets > 0) {
      const openRatio = zendeskData.openTickets / totalTickets;
      if (openRatio > 0.2) { // More than 20% open tickets
        score -= (openRatio - 0.2) * 125;
      }
    }

    // Penalize for slow first response times (over 24 hours)
    if (zendeskData.avgFirstResponseTime > 24) {
      const penalty = Math.min(25, (zendeskData.avgFirstResponseTime - 24) / 12 * 5);
      score -= penalty;
    }

    // Factor in customer satisfaction (weight it heavily)
    if (zendeskData.totalRatings > 0) {
      const satisfactionWeight = 0.3;
      score = score * (1 - satisfactionWeight) + zendeskData.satisfactionScore * satisfactionWeight;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

module.exports = new ZendeskService();
