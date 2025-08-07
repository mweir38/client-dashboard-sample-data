const Customer = require('../models/Customer');
const User = require('../models/User');
const Report = require('../models/Report');
const QBR = require('../models/QBR');
const OnboardingProject = require('../models/OnboardingProject');
const Alert = require('../models/Alert');
const { calculateHealthScoreWithIntegrations } = require('../utils/healthScore');
const pdfExportService = require('./pdfExportService');

class ReportingService {
  /**
   * Generate customer health report
   */
  async generateCustomerHealthReport(filters = {}, config = {}) {
    try {
      // Build query based on filters
      const query = this.buildCustomerQuery(filters);
      
      // Get customers with health scores
      const customers = await Customer.find(query)
        .populate('integrations')
        .sort({ healthScore: -1 });

      // Calculate summary metrics
      const summary = this.calculateHealthSummary(customers);
      
      // Calculate distributions
      const healthScoreDistribution = this.calculateHealthScoreDistribution(customers);
      const arrDistribution = this.calculateARRDistribution(customers);
      
      // Get trends (last 30 days)
      const trends = await this.calculateHealthTrends(customers, 30);
      
      // Get top customers
      const topCustomers = customers.slice(0, 10).map(customer => ({
        customer: customer._id,
        healthScore: customer.healthScore,
        arr: customer.arr,
        status: this.getHealthStatus(customer.healthScore)
      }));

      // Integration status
      const integrationStatus = this.calculateIntegrationStatus(customers);

      const reportData = {
        summary,
        metrics: {
          healthScoreDistribution,
          arrDistribution,
          integrationStatus
        },
        trends,
        topCustomers
      };

      return reportData;
    } catch (error) {
      console.error('Error generating customer health report:', error);
      throw error;
    }
  }

  /**
   * Generate QBR report
   */
  async generateQBRReport(customerId, quarter) {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Get QBR data
      const qbrs = await QBR.find({ customerId })
        .sort({ createdAt: -1 })
        .limit(4);

      // Calculate QBR metrics
      const qbrMetrics = {
        totalQBRs: qbrs.length,
        averageScore: qbrs.length > 0 ? 
          qbrs.reduce((sum, qbr) => sum + (qbr.score || 0), 0) / qbrs.length : 0,
        lastQBRDate: qbrs.length > 0 ? qbrs[0].createdAt : null,
        nextQBRDue: this.calculateNextQBRDue(qbrs.length > 0 ? qbrs[0].createdAt : null)
      };

      // Get health score trends
      const healthTrends = customer.healthScoreHistory || [];

      return {
        customer: {
          id: customer._id,
          name: customer.name,
          arr: customer.arr,
          healthScore: customer.healthScore
        },
        qbrMetrics,
        qbrs: qbrs.map(qbr => ({
          id: qbr._id,
          quarter: qbr.quarter,
          score: qbr.score,
          createdAt: qbr.createdAt,
          status: qbr.status
        })),
        healthTrends
      };
    } catch (error) {
      console.error('Error generating QBR report:', error);
      throw error;
    }
  }

  /**
   * Generate onboarding report
   */
  async generateOnboardingReport(filters = {}) {
    try {
      const query = {};
      if (filters.status) query.status = filters.status;
      if (filters.customerId) query.customerId = filters.customerId;

      const projects = await OnboardingProject.find(query)
        .populate('customerId', 'name arr')
        .populate('teamMembers', 'name email')
        .sort({ createdAt: -1 });

      const summary = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        delayedProjects: projects.filter(p => p.status === 'delayed').length,
        averageDuration: this.calculateAverageProjectDuration(projects)
      };

      const projectMetrics = projects.map(project => ({
        id: project._id,
        customer: project.customerId,
        status: project.status,
        progress: this.calculateProjectProgress(project),
        duration: this.calculateProjectDuration(project),
        teamSize: project.teamMembers.length,
        milestones: project.milestones.length,
        completedMilestones: project.milestones.filter(m => m.status === 'completed').length
      }));

      return {
        summary,
        projects: projectMetrics
      };
    } catch (error) {
      console.error('Error generating onboarding report:', error);
      throw error;
    }
  }

  /**
   * Generate alerts report
   */
  async generateAlertsReport(filters = {}) {
    try {
      const query = {};
      if (filters.severity) query.severity = filters.severity;
      if (filters.customerId) query.customerId = filters.customerId;
      if (filters.dateRange) {
        query.createdAt = {
          $gte: new Date(filters.dateRange.start),
          $lte: new Date(filters.dateRange.end)
        };
      }

      const alerts = await Alert.find(query)
        .populate('customerId', 'name arr healthScore')
        .sort({ createdAt: -1 });

      const summary = {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        warningAlerts: alerts.filter(a => a.severity === 'warning').length,
        infoAlerts: alerts.filter(a => a.severity === 'info').length,
        resolvedAlerts: alerts.filter(a => a.status === 'resolved').length,
        openAlerts: alerts.filter(a => a.status === 'open').length
      };

      const alertsByType = this.groupAlertsByType(alerts);
      const alertsByCustomer = this.groupAlertsByCustomer(alerts);

      return {
        summary,
        alertsByType,
        alertsByCustomer,
        recentAlerts: alerts.slice(0, 20)
      };
    } catch (error) {
      console.error('Error generating alerts report:', error);
      throw error;
    }
  }

  /**
   * Generate financial report
   */
  async generateFinancialReport(filters = {}) {
    try {
      const query = this.buildCustomerQuery(filters);
      const customers = await Customer.find(query);

      const summary = {
        totalARR: customers.reduce((sum, c) => sum + (c.arr || 0), 0),
        averageARR: customers.length > 0 ? 
          customers.reduce((sum, c) => sum + (c.arr || 0), 0) / customers.length : 0,
        highValueCustomers: customers.filter(c => c.arr >= 100000).length,
        mediumValueCustomers: customers.filter(c => c.arr >= 50000 && c.arr < 100000).length,
        lowValueCustomers: customers.filter(c => c.arr < 50000).length
      };

      const arrDistribution = this.calculateARRDistribution(customers);
      const healthScoreByARR = this.calculateHealthScoreByARR(customers);

      return {
        summary,
        arrDistribution,
        healthScoreByARR,
        topCustomersByARR: customers
          .sort((a, b) => (b.arr || 0) - (a.arr || 0))
          .slice(0, 10)
          .map(c => ({
            id: c._id,
            name: c.name,
            arr: c.arr,
            healthScore: c.healthScore
          }))
      };
    } catch (error) {
      console.error('Error generating financial report:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive dashboard report
   */
  async generateDashboardReport() {
    try {
      const customers = await Customer.find();
      const users = await User.find();
      const alerts = await Alert.find({ status: 'open' });
      const projects = await OnboardingProject.find({ status: 'active' });

      const summary = {
        totalCustomers: customers.length,
        totalUsers: users.length,
        openAlerts: alerts.length,
        activeProjects: projects.length,
        totalARR: customers.reduce((sum, c) => sum + (c.arr || 0), 0),
        averageHealthScore: customers.length > 0 ? 
          customers.reduce((sum, c) => sum + (c.healthScore || 0), 0) / customers.length : 0
      };

      const healthDistribution = this.calculateHealthScoreDistribution(customers);
      const recentAlerts = alerts.slice(0, 5);
      const recentProjects = projects.slice(0, 5);

      return {
        summary,
        healthDistribution,
        recentAlerts,
        recentProjects,
        topCustomers: customers
          .sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0))
          .slice(0, 5)
      };
    } catch (error) {
      console.error('Error generating dashboard report:', error);
      throw error;
    }
  }

  /**
   * Save report to database
   */
  async saveReport(reportData, generatedBy, type, title, description = '') {
    try {
      const report = new Report({
        title,
        type,
        description,
        generatedBy,
        data: reportData,
        status: 'completed',
        createdAt: new Date()
      });

      await report.save();
      return report;
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  }

  /**
   * Export report to PDF
   */
  async exportReportToPDF(reportData, reportType, title) {
    try {
      const pdfBuffer = await pdfExportService.generateReportPDF(reportData, reportType, title);
      return pdfBuffer;
    } catch (error) {
      console.error('Error exporting report to PDF:', error);
      throw error;
    }
  }

  /**
   * Generate customer 360° view report
   */
  async generateCustomer360Report(customerId, filters = {}) {
    try {
      const customer = await Customer.findById(customerId)
        .populate('integrations')
        .populate('onboardingProjects');

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Get all customer data
      const alerts = await Alert.find({ customerId });
      const qbrs = await QBR.find({ customerId }).sort({ createdAt: -1 });
      const projects = await OnboardingProject.find({ customerId });

      // Calculate comprehensive metrics
      const metrics = {
        healthScore: customer.healthScore,
        arr: customer.arr,
        totalAlerts: alerts.length,
        openAlerts: alerts.filter(a => a.status === 'open').length,
        totalQBRs: qbrs.length,
        averageQBRScore: qbrs.length > 0 ? 
          qbrs.reduce((sum, qbr) => sum + (qbr.score || 0), 0) / qbrs.length : 0,
        activeProjects: projects.filter(p => p.status === 'active').length,
        completedProjects: projects.filter(p => p.status === 'completed').length
      };

      // Get trends
      const healthTrends = customer.healthScoreHistory || [];
      const arrTrends = customer.arrHistory || [];

      // Calculate risk factors
      const riskFactors = this.calculateCustomerRiskFactors(customer, alerts, qbrs);

      return {
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          status: customer.status
        },
        metrics,
        trends: {
          health: healthTrends,
          arr: arrTrends
        },
        riskFactors,
        alerts: alerts.slice(0, 10),
        qbrs: qbrs.slice(0, 5),
        projects: projects.slice(0, 5),
        integrations: customer.integrations
      };
    } catch (error) {
      console.error('Error generating customer 360 report:', error);
      throw error;
    }
  }

  /**
   * Generate customer usage analysis report
   */
  async generateCustomerUsageReport(customerId, filters = {}) {
    try {
      const customer = await Customer.findById(customerId)
        .populate('integrations');

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Simulate usage data (in real implementation, this would come from usage tracking)
      const usageData = {
        totalLogins: Math.floor(Math.random() * 1000) + 100,
        activeUsers: Math.floor(Math.random() * 50) + 10,
        featuresUsed: Math.floor(Math.random() * 20) + 5,
        lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        adoptionScore: Math.floor(Math.random() * 100) + 50
      };

      // Calculate adoption metrics
      const adoptionMetrics = {
        overallAdoption: usageData.adoptionScore,
        userEngagement: Math.floor(Math.random() * 100) + 60,
        featureAdoption: Math.floor(Math.random() * 100) + 40,
        timeToValue: Math.floor(Math.random() * 30) + 7 // days
      };

      return {
        customer: {
          id: customer._id,
          name: customer.name
        },
        usageData,
        adoptionMetrics,
        recommendations: this.generateUsageRecommendations(adoptionMetrics)
      };
    } catch (error) {
      console.error('Error generating customer usage report:', error);
      throw error;
    }
  }

  /**
   * Generate customer support summary report
   */
  async generateCustomerSupportReport(customerId, filters = {}) {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Get support tickets (simulated data)
      const supportTickets = [
        { id: 1, type: 'Technical', status: 'Resolved', priority: 'Medium', resolutionTime: 24 },
        { id: 2, type: 'Billing', status: 'Open', priority: 'Low', resolutionTime: null },
        { id: 3, type: 'Feature Request', status: 'Resolved', priority: 'High', resolutionTime: 48 }
      ];

      // Calculate support metrics
      const metrics = {
        totalTickets: supportTickets.length,
        openTickets: supportTickets.filter(t => t.status === 'Open').length,
        averageResolutionTime: supportTickets
          .filter(t => t.resolutionTime)
          .reduce((sum, t) => sum + t.resolutionTime, 0) / 
          supportTickets.filter(t => t.resolutionTime).length || 0,
        satisfactionScore: Math.floor(Math.random() * 30) + 70 // 70-100
      };

      return {
        customer: {
          id: customer._id,
          name: customer.name
        },
        metrics,
        tickets: supportTickets,
        trends: {
          ticketVolume: [10, 15, 12, 8, 5, 3],
          satisfaction: [75, 80, 85, 90, 88, 92]
        }
      };
    } catch (error) {
      console.error('Error generating customer support report:', error);
      throw error;
    }
  }

  /**
   * Generate customer churn risk analysis
   */
  async generateCustomerChurnReport(customerId, filters = {}) {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Calculate churn risk factors
      const riskFactors = {
        healthScore: customer.healthScore < 5 ? 'High' : customer.healthScore < 7 ? 'Medium' : 'Low',
        recentActivity: Math.random() > 0.7 ? 'Low' : 'High',
        supportIssues: Math.random() > 0.8 ? 'High' : 'Low',
        contractRenewal: Math.random() > 0.6 ? 'Near' : 'Far',
        expansionOpportunity: Math.random() > 0.5 ? 'Yes' : 'No'
      };

      // Calculate overall risk score
      const riskScore = this.calculateChurnRiskScore(riskFactors);

      // Generate mitigation strategies
      const mitigationStrategies = this.generateChurnMitigationStrategies(riskFactors);

      return {
        customer: {
          id: customer._id,
          name: customer.name,
          healthScore: customer.healthScore
        },
        riskFactors,
        riskScore,
        mitigationStrategies,
        recommendations: this.generateChurnRecommendations(riskScore)
      };
    } catch (error) {
      console.error('Error generating customer churn report:', error);
      throw error;
    }
  }

  /**
   * Generate customer portfolio summary
   */
  async generatePortfolioReport(filters = {}) {
    try {
      const customers = await Customer.find(this.buildCustomerQuery(filters));
      
      // Calculate portfolio metrics
      const portfolioMetrics = {
        totalCustomers: customers.length,
        totalARR: customers.reduce((sum, c) => sum + (c.arr || 0), 0),
        averageHealthScore: customers.reduce((sum, c) => sum + (c.healthScore || 0), 0) / customers.length,
        healthDistribution: {
          excellent: customers.filter(c => c.healthScore >= 8).length,
          good: customers.filter(c => c.healthScore >= 6 && c.healthScore < 8).length,
          fair: customers.filter(c => c.healthScore >= 4 && c.healthScore < 6).length,
          poor: customers.filter(c => c.healthScore < 4).length
        }
      };

      // Get top customers
      const topCustomers = customers
        .sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0))
        .slice(0, 10)
        .map(c => ({
          id: c._id,
          name: c.name,
          healthScore: c.healthScore,
          arr: c.arr
        }));

      return {
        portfolioMetrics,
        topCustomers,
        trends: await this.calculatePortfolioTrends(customers)
      };
    } catch (error) {
      console.error('Error generating portfolio report:', error);
      throw error;
    }
  }

  // Helper methods
  buildCustomerQuery(filters) {
    const query = {};
    
    if (filters.healthScoreRange) {
      query.healthScore = {
        $gte: filters.healthScoreRange.min || 0,
        $lte: filters.healthScoreRange.max || 10
      };
    }
    
    if (filters.arrRange) {
      query.arr = {
        $gte: filters.arrRange.min || 0,
        $lte: filters.arrRange.max || Number.MAX_SAFE_INTEGER
      };
    }
    
    if (filters.status && filters.status.length > 0) {
      query.status = { $in: filters.status };
    }
    
    if (filters.customers && filters.customers.length > 0) {
      query._id = { $in: filters.customers };
    }

    return query;
  }

  calculateHealthSummary(customers) {
    const total = customers.length;
    const healthy = customers.filter(c => c.healthScore >= 7).length;
    const atRisk = customers.filter(c => c.healthScore >= 4 && c.healthScore < 7).length;
    const critical = customers.filter(c => c.healthScore < 4).length;
    const totalARR = customers.reduce((sum, c) => sum + (c.arr || 0), 0);
    const averageHealthScore = total > 0 ? 
      customers.reduce((sum, c) => sum + (c.healthScore || 0), 0) / total : 0;

    return {
      totalCustomers: total,
      healthyCustomers: healthy,
      atRiskCustomers: atRisk,
      criticalCustomers: critical,
      totalARR,
      averageHealthScore: Math.round(averageHealthScore * 10) / 10
    };
  }

  calculateHealthScoreDistribution(customers) {
    const distribution = [
      { range: '9-10 (Excellent)', count: 0, percentage: 0 },
      { range: '7-8 (Good)', count: 0, percentage: 0 },
      { range: '5-6 (Fair)', count: 0, percentage: 0 },
      { range: '3-4 (Poor)', count: 0, percentage: 0 },
      { range: '1-2 (Critical)', count: 0, percentage: 0 }
    ];

    customers.forEach(customer => {
      const score = customer.healthScore || 0;
      if (score >= 9) distribution[0].count++;
      else if (score >= 7) distribution[1].count++;
      else if (score >= 5) distribution[2].count++;
      else if (score >= 3) distribution[3].count++;
      else distribution[4].count++;
    });

    const total = customers.length;
    distribution.forEach(d => {
      d.percentage = total > 0 ? Math.round((d.count / total) * 100) : 0;
    });

    return distribution;
  }

  calculateARRDistribution(customers) {
    const distribution = [
      { range: '$100K+', count: 0, percentage: 0 },
      { range: '$50K-$100K', count: 0, percentage: 0 },
      { range: '$25K-$50K', count: 0, percentage: 0 },
      { range: '$10K-$25K', count: 0, percentage: 0 },
      { range: '<$10K', count: 0, percentage: 0 }
    ];

    customers.forEach(customer => {
      const arr = customer.arr || 0;
      if (arr >= 100000) distribution[0].count++;
      else if (arr >= 50000) distribution[1].count++;
      else if (arr >= 25000) distribution[2].count++;
      else if (arr >= 10000) distribution[3].count++;
      else distribution[4].count++;
    });

    const total = customers.length;
    distribution.forEach(d => {
      d.percentage = total > 0 ? Math.round((d.count / total) * 100) : 0;
    });

    return distribution;
  }

  calculateIntegrationStatus(customers) {
    let jira = 0, zendesk = 0, hubspot = 0;
    
    customers.forEach(customer => {
      if (customer.integrations?.jira) jira++;
      if (customer.integrations?.zendesk) zendesk++;
      if (customer.integrations?.hubspot) hubspot++;
    });

    return { jira, zendesk, hubspot };
  }

  async calculateHealthTrends(customers, days = 30) {
    // This would typically query historical data
    // For now, return mock data
    const trends = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      trends.push({
        date,
        healthScore: Math.random() * 2 + 7, // Mock data
        customerCount: customers.length
      });
    }

    return trends;
  }

  getHealthStatus(score) {
    if (score >= 7) return 'Healthy';
    if (score >= 4) return 'At Risk';
    return 'Critical';
  }

  calculateNextQBRDue(lastQBRDate) {
    if (!lastQBRDate) return new Date();
    const next = new Date(lastQBRDate);
    next.setMonth(next.getMonth() + 3);
    return next;
  }

  calculateAverageProjectDuration(projects) {
    const completedProjects = projects.filter(p => p.status === 'completed');
    if (completedProjects.length === 0) return 0;
    
    const totalDuration = completedProjects.reduce((sum, project) => {
      return sum + this.calculateProjectDuration(project);
    }, 0);
    
    return Math.round(totalDuration / completedProjects.length);
  }

  calculateProjectProgress(project) {
    const totalMilestones = project.milestones.length;
    if (totalMilestones === 0) return 0;
    
    const completedMilestones = project.milestones.filter(m => m.status === 'completed').length;
    return Math.round((completedMilestones / totalMilestones) * 100);
  }

  calculateProjectDuration(project) {
    if (!project.startDate) return 0;
    const endDate = project.endDate || new Date();
    return Math.ceil((endDate - new Date(project.startDate)) / (1000 * 60 * 60 * 24));
  }

  groupAlertsByType(alerts) {
    const grouped = {};
    alerts.forEach(alert => {
      const type = alert.type || 'unknown';
      if (!grouped[type]) grouped[type] = 0;
      grouped[type]++;
    });
    
    return Object.entries(grouped).map(([type, count]) => ({ type, count }));
  }

  groupAlertsByCustomer(alerts) {
    const grouped = {};
    alerts.forEach(alert => {
      const customerName = alert.customerId?.name || 'Unknown';
      if (!grouped[customerName]) grouped[customerName] = 0;
      grouped[customerName]++;
    });
    
    return Object.entries(grouped).map(([customer, count]) => ({ customer, count }));
  }

  calculateHealthScoreByARR(customers) {
    const highValue = customers.filter(c => c.arr >= 100000);
    const mediumValue = customers.filter(c => c.arr >= 50000 && c.arr < 100000);
    const lowValue = customers.filter(c => c.arr < 50000);

    return {
      highValue: {
        count: highValue.length,
        averageHealthScore: highValue.length > 0 ? 
          highValue.reduce((sum, c) => sum + (c.healthScore || 0), 0) / highValue.length : 0
      },
      mediumValue: {
        count: mediumValue.length,
        averageHealthScore: mediumValue.length > 0 ? 
          mediumValue.reduce((sum, c) => sum + (c.healthScore || 0), 0) / mediumValue.length : 0
      },
      lowValue: {
        count: lowValue.length,
        averageHealthScore: lowValue.length > 0 ? 
          lowValue.reduce((sum, c) => sum + (c.healthScore || 0), 0) / lowValue.length : 0
      }
    };
  }

  /**
   * Calculate customer risk factors
   */
  calculateCustomerRiskFactors(customer, alerts, qbrs) {
    const riskFactors = [];
    
    if (customer.healthScore < 5) {
      riskFactors.push('Low health score');
    }
    
    if (alerts.filter(a => a.status === 'open').length > 3) {
      riskFactors.push('Multiple open alerts');
    }
    
    if (qbrs.length > 0 && qbrs[0].score < 6) {
      riskFactors.push('Recent poor QBR score');
    }
    
    if (customer.arr < 10000) {
      riskFactors.push('Low ARR');
    }
    
    return riskFactors;
  }

  /**
   * Calculate churn risk score
   */
  calculateChurnRiskScore(riskFactors) {
    let score = 0;
    
    if (riskFactors.healthScore === 'High') score += 30;
    if (riskFactors.recentActivity === 'Low') score += 25;
    if (riskFactors.supportIssues === 'High') score += 20;
    if (riskFactors.contractRenewal === 'Near') score += 15;
    if (riskFactors.expansionOpportunity === 'No') score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Generate churn mitigation strategies
   */
  generateChurnMitigationStrategies(riskFactors) {
    const strategies = [];
    
    if (riskFactors.healthScore === 'High') {
      strategies.push('Schedule health check call');
      strategies.push('Assign dedicated success manager');
    }
    
    if (riskFactors.recentActivity === 'Low') {
      strategies.push('Re-engagement campaign');
      strategies.push('Feature adoption training');
    }
    
    if (riskFactors.supportIssues === 'High') {
      strategies.push('Priority support escalation');
      strategies.push('Proactive issue resolution');
    }
    
    return strategies;
  }

  /**
   * Generate churn recommendations
   */
  generateChurnRecommendations(riskScore) {
    if (riskScore >= 70) {
      return ['Immediate intervention required', 'Executive escalation', 'Custom retention plan'];
    } else if (riskScore >= 40) {
      return ['Increased touch frequency', 'Success plan review', 'Feature adoption focus'];
    } else {
      return ['Regular check-ins', 'Monitor for changes', 'Maintain engagement'];
    }
  }

  /**
   * Generate usage recommendations
   */
  generateUsageRecommendations(adoptionMetrics) {
    const recommendations = [];
    
    if (adoptionMetrics.overallAdoption < 70) {
      recommendations.push('Implement onboarding optimization');
      recommendations.push('Create feature adoption campaigns');
    }
    
    if (adoptionMetrics.userEngagement < 80) {
      recommendations.push('Increase user training sessions');
      recommendations.push('Implement gamification features');
    }
    
    if (adoptionMetrics.timeToValue > 14) {
      recommendations.push('Streamline onboarding process');
      recommendations.push('Provide quick-start guides');
    }
    
    return recommendations;
  }

  /**
   * Calculate portfolio trends
   */
  async calculatePortfolioTrends(customers) {
    // Simulate trend data
    return {
      healthScoreTrend: [7.2, 7.4, 7.1, 7.6, 7.8, 8.0],
      arrGrowthTrend: [100000, 105000, 110000, 115000, 120000, 125000],
      customerGrowthTrend: [50, 52, 55, 58, 60, 62]
    };
  }
}

module.exports = new ReportingService(); 