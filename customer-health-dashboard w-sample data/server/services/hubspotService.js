const axios = require('axios');

class HubSpotService {
  constructor() {
    this.apiKey = process.env.HUBSPOT_API_KEY;
    this.baseURL = 'https://api.hubapi.com';
    
    if (!this.apiKey) {
      console.warn('HubSpot credentials not configured. Set HUBSPOT_API_KEY in .env');
    }
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async getCompanyById(companyId) {
    try {
      if (!this.apiKey) {
        throw new Error('HubSpot not configured');
      }

      const response = await axios.get(
        `${this.baseURL}/crm/v3/objects/companies/${companyId}`,
        {
          headers: this.getAuthHeaders(),
          params: {
            properties: 'name,domain,industry,annualrevenue,num_employees,lifecyclestage,createdate,hs_last_sales_activity_date'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching HubSpot company:', error.message);
      throw error;
    }
  }

  async getCompanyDeals(companyId) {
    try {
      if (!this.apiKey) {
        throw new Error('HubSpot not configured');
      }

      const response = await axios.get(
        `${this.baseURL}/crm/v3/objects/companies/${companyId}/associations/deals`,
        {
          headers: this.getAuthHeaders()
        }
      );

      const dealIds = response.data.results.map(deal => deal.id);
      
      if (dealIds.length === 0) {
        return [];
      }

      // Get deal details
      const dealsResponse = await axios.post(
        `${this.baseURL}/crm/v3/objects/deals/batch/read`,
        {
          inputs: dealIds.map(id => ({ id })),
          properties: ['dealname', 'amount', 'dealstage', 'closedate', 'createdate', 'pipeline']
        },
        {
          headers: this.getAuthHeaders()
        }
      );

      return dealsResponse.data.results;
    } catch (error) {
      console.error('Error fetching HubSpot deals:', error.message);
      return [];
    }
  }

  async getCompanyContacts(companyId) {
    try {
      if (!this.apiKey) {
        throw new Error('HubSpot not configured');
      }

      const response = await axios.get(
        `${this.baseURL}/crm/v3/objects/companies/${companyId}/associations/contacts`,
        {
          headers: this.getAuthHeaders()
        }
      );

      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching HubSpot contacts:', error.message);
      return [];
    }
  }

  // Get products/tools associated with a company
  async getCompanyProducts(companyId) {
    try {
      if (!this.apiKey) {
        throw new Error('HubSpot not configured');
      }

      // Get product associations
      const response = await axios.get(
        `${this.baseURL}/crm/v3/objects/companies/${companyId}/associations/products`,
        {
          headers: this.getAuthHeaders()
        }
      );

      const productIds = response.data.results.map(product => product.id);
      
      if (productIds.length === 0) {
        return [];
      }

      // Get product details
      const productsResponse = await axios.post(
        `${this.baseURL}/crm/v3/objects/products/batch/read`,
        {
          inputs: productIds.map(id => ({ id })),
          properties: ['name', 'description', 'price', 'hs_product_id', 'hs_sku', 'createdate']
        },
        {
          headers: this.getAuthHeaders()
        }
      );

      return productsResponse.data.results;
    } catch (error) {
      console.error('Error fetching HubSpot products:', error.message);
      return [];
    }
  }

  // Get all products (for general product catalog)
  async getAllProducts(limit = 100) {
    try {
      if (!this.apiKey) {
        throw new Error('HubSpot not configured');
      }

      const response = await axios.get(
        `${this.baseURL}/crm/v3/objects/products`,
        {
          headers: this.getAuthHeaders(),
          params: {
            limit,
            properties: 'name,description,price,hs_product_id,hs_sku,createdate'
          }
        }
      );

      return response.data.results;
    } catch (error) {
      console.error('Error fetching all HubSpot products:', error.message);
      return [];
    }
  }

  // Enhanced company fetch with custom fields
  async getCompanyWithCustomFields(companyId, customFields = []) {
    try {
      if (!this.apiKey) {
        throw new Error('HubSpot not configured');
      }

      const defaultProperties = [
        'name', 'domain', 'industry', 'annualrevenue', 'num_employees',
        'lifecyclestage', 'createdate', 'hs_last_sales_activity_date',
        'hs_lead_status', 'hubspot_owner_id', 'country', 'state', 'city'
      ];

      const allProperties = [...defaultProperties, ...customFields].join(',');

      const response = await axios.get(
        `${this.baseURL}/crm/v3/objects/companies/${companyId}`,
        {
          headers: this.getAuthHeaders(),
          params: {
            properties: allProperties
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching HubSpot company with custom fields:', error.message);
      throw error;
    }
  }

  // Search companies by domain or name
  async searchCompanies(searchTerm, limit = 10) {
    try {
      if (!this.apiKey) {
        throw new Error('HubSpot not configured');
      }

      const response = await axios.post(
        `${this.baseURL}/crm/v3/objects/companies/search`,
        {
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'name',
                  operator: 'CONTAINS_TOKEN',
                  value: searchTerm
                }
              ]
            },
            {
              filters: [
                {
                  propertyName: 'domain',
                  operator: 'CONTAINS_TOKEN',
                  value: searchTerm
                }
              ]
            }
          ],
          properties: ['name', 'domain', 'industry', 'lifecyclestage', 'hs_lead_status'],
          limit
        },
        {
          headers: this.getAuthHeaders()
        }
      );

      return response.data.results;
    } catch (error) {
      console.error('Error searching HubSpot companies:', error.message);
      return [];
    }
  }

  // Get company timeline/activities
  async getCompanyActivities(companyId, limit = 50) {
    try {
      if (!this.apiKey) {
        throw new Error('HubSpot not configured');
      }

      const response = await axios.get(
        `${this.baseURL}/crm/v3/objects/companies/${companyId}/associations/activities`,
        {
          headers: this.getAuthHeaders(),
          params: {
            limit
          }
        }
      );

      return response.data.results;
    } catch (error) {
      console.error('Error fetching company activities:', error.message);
      return [];
    }
  }

  async getCustomerMetrics(companyId) {
    try {
      const company = await this.getCompanyById(companyId);
      const deals = await this.getCompanyDeals(companyId);
      const contacts = await this.getCompanyContacts(companyId);

      const totalDeals = deals.length;
      const wonDeals = deals.filter(deal => 
        deal.properties.dealstage && deal.properties.dealstage.includes('won')
      ).length;

      const openDeals = deals.filter(deal => 
        deal.properties.dealstage && 
        !deal.properties.dealstage.includes('won') && 
        !deal.properties.dealstage.includes('lost')
      ).length;

      const totalDealValue = deals.reduce((sum, deal) => {
        return sum + (parseFloat(deal.properties.amount) || 0);
      }, 0);

      const wonDealValue = deals.filter(deal => 
        deal.properties.dealstage && deal.properties.dealstage.includes('won')
      ).reduce((sum, deal) => {
        return sum + (parseFloat(deal.properties.amount) || 0);
      }, 0);

      // Calculate days since last sales activity
      let daysSinceLastActivity = 0;
      if (company.properties.hs_last_sales_activity_date) {
        const lastActivity = new Date(company.properties.hs_last_sales_activity_date);
        const now = new Date();
        daysSinceLastActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
      }

      // Get lifecycle stage
      const lifecycleStage = company.properties.lifecyclestage || 'unknown';

      return {
        companyId,
        totalDeals,
        wonDeals,
        openDeals,
        totalDealValue,
        wonDealValue,
        contactCount: contacts.length,
        lifecycleStage,
        daysSinceLastActivity,
        annualRevenue: parseFloat(company.properties.annualrevenue) || 0,
        lastSync: new Date()
      };
    } catch (error) {
      console.error(`Error getting HubSpot metrics for company ${companyId}:`, error.message);
      // Return default values if API fails
      return {
        companyId,
        totalDeals: 0,
        wonDeals: 0,
        openDeals: 0,
        totalDealValue: 0,
        wonDealValue: 0,
        contactCount: 0,
        lifecycleStage: 'unknown',
        daysSinceLastActivity: 0,
        annualRevenue: 0,
        lastSync: new Date()
      };
    }
  }

  calculateSalesHealth(hubspotData) {
    let score = 100;

    // Factor in lifecycle stage
    const lifecycleScores = {
      'subscriber': 20,
      'lead': 40,
      'marketingqualifiedlead': 60,
      'salesqualifiedlead': 75,
      'opportunity': 85,
      'customer': 100,
      'evangelist': 100,
      'other': 50,
      'unknown': 30
    };
    
    const lifecycleScore = lifecycleScores[hubspotData.lifecycleStage.toLowerCase()] || 30;
    score = score * 0.3 + lifecycleScore * 0.7; // Weight lifecycle stage heavily

    // Penalize for lack of recent sales activity (over 30 days)
    if (hubspotData.daysSinceLastActivity > 30) {
      const penalty = Math.min(20, (hubspotData.daysSinceLastActivity - 30) / 30 * 10);
      score -= penalty;
    }

    // Bonus for having open deals
    if (hubspotData.openDeals > 0) {
      score += Math.min(15, hubspotData.openDeals * 5);
    }

    // Factor in deal win rate
    if (hubspotData.totalDeals > 0) {
      const winRate = hubspotData.wonDeals / hubspotData.totalDeals;
      if (winRate > 0.5) {
        score += (winRate - 0.5) * 20;
      } else if (winRate < 0.3) {
        score -= (0.3 - winRate) * 30;
      }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

module.exports = new HubSpotService();