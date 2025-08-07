const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const reportingService = require('../services/reportingService');
const Report = require('../models/Report');
const User = require('../models/User');

// @route   POST api/reports/generate
// @desc    Generate a new report
// @access  Private
router.post('/generate', auth, async (req, res) => {
  try {
    const { type, title, description, filters, config } = req.body;
    const user = await User.findById(req.user.id);

    // Check reporting permissions
    if (!user.reportingPermissions.canGenerateReports && user.role !== 'admin') {
      return res.status(403).json({ 
        msg: 'You do not have permission to generate reports' 
      });
    }

    // Check if user can generate this type of report
    if (user.reportingPermissions.allowedReportTypes && 
        !user.reportingPermissions.allowedReportTypes.includes(type) && 
        user.role !== 'admin') {
      return res.status(403).json({ 
        msg: `You do not have permission to generate ${type} reports` 
      });
    }

    let reportData;

    // Generate report based on type
    switch (type) {
      case 'customer-health':
        reportData = await reportingService.generateCustomerHealthReport(filters, config);
        break;
      case 'qbr':
        if (!filters.customerId) {
          return res.status(400).json({ msg: 'Customer ID is required for QBR reports' });
        }
        reportData = await reportingService.generateQBRReport(filters.customerId, filters.quarter);
        break;
      case 'customer-360':
        if (!filters.customerId) {
          return res.status(400).json({ msg: 'Customer ID is required for Customer 360 reports' });
        }
        reportData = await reportingService.generateCustomer360Report(filters.customerId, filters);
        break;
      case 'customer-usage':
        if (!filters.customerId) {
          return res.status(400).json({ msg: 'Customer ID is required for Customer Usage reports' });
        }
        reportData = await reportingService.generateCustomerUsageReport(filters.customerId, filters);
        break;
      case 'customer-support':
        if (!filters.customerId) {
          return res.status(400).json({ msg: 'Customer ID is required for Customer Support reports' });
        }
        reportData = await reportingService.generateCustomerSupportReport(filters.customerId, filters);
        break;
      case 'customer-churn':
        if (!filters.customerId) {
          return res.status(400).json({ msg: 'Customer ID is required for Customer Churn reports' });
        }
        reportData = await reportingService.generateCustomerChurnReport(filters.customerId, filters);
        break;
      case 'onboarding':
        reportData = await reportingService.generateOnboardingReport(filters);
        break;
      case 'alerts':
        reportData = await reportingService.generateAlertsReport(filters);
        break;
      case 'financial':
        reportData = await reportingService.generateFinancialReport(filters);
        break;
      case 'dashboard':
        reportData = await reportingService.generateDashboardReport();
        break;
      case 'portfolio':
        reportData = await reportingService.generatePortfolioReport(filters);
        break;
      default:
        return res.status(400).json({ msg: 'Invalid report type' });
    }

    // Save report to database
    const report = await reportingService.saveReport(
      reportData,
      user._id,
      type,
      title,
      description
    );

    res.json({
      msg: 'Report generated successfully',
      report: {
        id: report._id,
        title: report.title,
        type: report.type,
        status: report.status,
        createdAt: report.createdAt
      },
      data: reportData
    });

  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports
// @desc    Get all reports for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let query = {};

    // If user can't view all reports, only show their own
    if (!user.reportingPermissions.canViewAllReports && user.role !== 'admin') {
      query.generatedBy = user._id;
    }

    const reports = await Report.find(query)
      .populate('generatedBy', 'name email')
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });

    res.json(reports);

  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/templates
// @desc    Get report templates
// @access  Private
router.get('/templates', auth, async (req, res) => {
  try {
    const templates = [
      // Customer Health Reports
      {
        id: 'customer-health-summary',
        name: 'Customer Health Summary',
        type: 'customer-health',
        description: 'Comprehensive overview of customer health scores and metrics',
        category: 'Customer Health',
        defaultFilters: {
          healthScoreRange: { min: 0, max: 10 }
        }
      },
      {
        id: 'customer-health-detailed',
        name: 'Detailed Customer Health Analysis',
        type: 'customer-health',
        description: 'In-depth analysis of customer health factors and trends',
        category: 'Customer Health',
        requiresCustomer: true,
        defaultFilters: {
          includeHistory: true,
          includeMetrics: true
        }
      },
      {
        id: 'customer-health-comparison',
        name: 'Customer Health Comparison',
        type: 'customer-health',
        description: 'Compare health scores across multiple customers',
        category: 'Customer Health',
        requiresCustomer: true,
        defaultFilters: {
          comparisonMode: true
        }
      },

      // QBR Reports
      {
        id: 'qbr-quarterly',
        name: 'Quarterly Business Review',
        type: 'qbr',
        description: 'Standard quarterly business review for specific customers',
        category: 'QBR',
        requiresCustomer: true,
        defaultFilters: {
          quarter: 'current',
          includeMetrics: true,
          includeRecommendations: true
        }
      },
      {
        id: 'qbr-executive-summary',
        name: 'QBR Executive Summary',
        type: 'qbr',
        description: 'Executive-level QBR summary with key insights and action items',
        category: 'QBR',
        requiresCustomer: true,
        defaultFilters: {
          executiveView: true,
          includeROI: true,
          includeNextSteps: true
        }
      },
      {
        id: 'qbr-detailed-analysis',
        name: 'QBR Detailed Analysis',
        type: 'qbr',
        description: 'Comprehensive QBR with detailed metrics, trends, and recommendations',
        category: 'QBR',
        requiresCustomer: true,
        defaultFilters: {
          includeAllMetrics: true,
          includeTrends: true,
          includeCompetitiveAnalysis: true,
          includeRiskAssessment: true
        }
      },
      {
        id: 'qbr-portfolio-review',
        name: 'QBR Portfolio Review',
        type: 'qbr',
        description: 'Portfolio-wide QBR analysis across multiple customers',
        category: 'QBR',
        defaultFilters: {
          portfolioView: true,
          includeBenchmarks: true
        }
      },

      // Customer-Specific Reports
      {
        id: 'customer-360-view',
        name: 'Customer 360° View',
        type: 'customer-360',
        description: 'Complete customer overview including health, usage, support, and financial data',
        category: 'Customer Analysis',
        requiresCustomer: true,
        defaultFilters: {
          includeAllData: true,
          includePredictions: true
        }
      },
      {
        id: 'customer-usage-analysis',
        name: 'Customer Usage Analysis',
        type: 'customer-usage',
        description: 'Detailed analysis of customer product usage and adoption',
        category: 'Customer Analysis',
        requiresCustomer: true,
        defaultFilters: {
          includeAdoptionMetrics: true,
          includeFeatureUsage: true
        }
      },
      {
        id: 'customer-support-summary',
        name: 'Customer Support Summary',
        type: 'customer-support',
        description: 'Support tickets, resolution times, and satisfaction metrics',
        category: 'Customer Analysis',
        requiresCustomer: true,
        defaultFilters: {
          includeTicketHistory: true,
          includeMetrics: true
        }
      },

      // Onboarding Reports
      {
        id: 'onboarding-status',
        name: 'Onboarding Status Report',
        type: 'onboarding',
        description: 'Current onboarding progress and milestone tracking',
        category: 'Onboarding',
        defaultFilters: {
          status: 'active'
        }
      },
      {
        id: 'onboarding-customer-specific',
        name: 'Customer Onboarding Progress',
        type: 'onboarding',
        description: 'Detailed onboarding progress for specific customers',
        category: 'Onboarding',
        requiresCustomer: true,
        defaultFilters: {
          includeMilestones: true,
          includeTimeline: true
        }
      },

      // Alert Reports
      {
        id: 'alerts-summary',
        name: 'Alerts Summary',
        type: 'alerts',
        description: 'Overview of all alerts and their current status',
        category: 'Monitoring',
        defaultFilters: {
          status: 'open'
        }
      },
      {
        id: 'alerts-customer-specific',
        name: 'Customer-Specific Alerts',
        type: 'alerts',
        description: 'Alerts and monitoring data for specific customers',
        category: 'Monitoring',
        requiresCustomer: true,
        defaultFilters: {
          includeHistory: true,
          includeTrends: true
        }
      },

      // Financial Reports
      {
        id: 'financial-overview',
        name: 'Financial Overview',
        type: 'financial',
        description: 'Financial metrics and ARR analysis',
        category: 'Financial',
        defaultFilters: {
          arrRange: { min: 0, max: 1000000 }
        }
      },
      {
        id: 'customer-financial-analysis',
        name: 'Customer Financial Analysis',
        type: 'financial',
        description: 'Detailed financial analysis for specific customers',
        category: 'Financial',
        requiresCustomer: true,
        defaultFilters: {
          includeARR: true,
          includeExpansion: true,
          includeContraction: true
        }
      },

      // Dashboard & Summary Reports
      {
        id: 'dashboard-summary',
        name: 'Dashboard Summary',
        type: 'dashboard',
        description: 'High-level dashboard metrics and KPIs',
        category: 'Summary'
      },
      {
        id: 'customer-portfolio-summary',
        name: 'Customer Portfolio Summary',
        type: 'portfolio',
        description: 'Portfolio-wide customer summary and insights',
        category: 'Summary',
        defaultFilters: {
          includeBenchmarks: true,
          includeTrends: true
        }
      }
    ];

    res.json(templates);

  } catch (err) {
    console.error('Error fetching report templates:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/:id
// @desc    Get specific report by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('generatedBy', 'name email')
      .populate('customerId', 'name arr healthScore');

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    const user = await User.findById(req.user.id);

    // Check if user can view this report
    if (report.generatedBy.toString() !== user._id.toString() && 
        !user.reportingPermissions.canViewAllReports && 
        user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(report);

  } catch (err) {
    console.error('Error fetching report:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Report not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/reports/:id/export
// @desc    Export report to PDF/Excel/CSV
// @access  Private
router.post('/:id/export', auth, async (req, res) => {
  try {
    const { format = 'pdf' } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    const user = await User.findById(req.user.id);

    // Check if user can export this report
    if (report.generatedBy.toString() !== user._id.toString() && 
        !user.reportingPermissions.canExportReports && 
        user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    let fileBuffer;
    let fileName;
    let contentType;

    switch (format.toLowerCase()) {
      case 'pdf':
        fileBuffer = await reportingService.exportReportToPDF(report.data, report.type, report.title);
        fileName = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        contentType = 'application/pdf';
        break;
      case 'excel':
        // TODO: Implement Excel export
        return res.status(501).json({ msg: 'Excel export not yet implemented' });
      case 'csv':
        // TODO: Implement CSV export
        return res.status(501).json({ msg: 'CSV export not yet implemented' });
      default:
        return res.status(400).json({ msg: 'Invalid export format' });
    }

    // Update download count
    report.downloadCount += 1;
    report.lastDownloaded = new Date();
    await report.save();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(fileBuffer);

  } catch (err) {
    console.error('Error exporting report:', err);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/reports/:id
// @desc    Delete a report
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    const user = await User.findById(req.user.id);

    // Check if user can delete this report
    if (report.generatedBy.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    await Report.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Report deleted successfully' });

  } catch (err) {
    console.error('Error deleting report:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Report not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/reports/schedule
// @desc    Schedule a recurring report
// @access  Private
router.post('/schedule', auth, async (req, res) => {
  try {
    const { type, title, description, filters, schedule } = req.body;
    const user = await User.findById(req.user.id);

    // Check permissions
    if (!user.reportingPermissions.canGenerateReports && user.role !== 'admin') {
      return res.status(403).json({ 
        msg: 'You do not have permission to schedule reports' 
      });
    }

    // Validate schedule
    if (!schedule.isRecurring || !schedule.frequency || !schedule.recipients) {
      return res.status(400).json({ msg: 'Invalid schedule configuration' });
    }

    // Create scheduled report
    const report = new Report({
      title,
      type,
      description,
      generatedBy: user._id,
      filters,
      schedule,
      status: 'generating'
    });

    await report.save();

    // TODO: Set up cron job for recurring reports

    res.json({
      msg: 'Report scheduled successfully',
      report: {
        id: report._id,
        title: report.title,
        schedule: report.schedule
      }
    });

  } catch (err) {
    console.error('Error scheduling report:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/templates
// @desc    Get report templates
// @access  Private
router.get('/templates', auth, async (req, res) => {
  try {
    const templates = [
      // Customer Health Reports
      {
        id: 'customer-health-summary',
        name: 'Customer Health Summary',
        type: 'customer-health',
        description: 'Comprehensive overview of customer health scores and metrics',
        category: 'Customer Health',
        defaultFilters: {
          healthScoreRange: { min: 0, max: 10 }
        }
      },
      {
        id: 'customer-health-detailed',
        name: 'Detailed Customer Health Analysis',
        type: 'customer-health',
        description: 'In-depth analysis of customer health factors and trends',
        category: 'Customer Health',
        requiresCustomer: true,
        defaultFilters: {
          includeHistory: true,
          includeMetrics: true
        }
      },
      {
        id: 'customer-health-comparison',
        name: 'Customer Health Comparison',
        type: 'customer-health',
        description: 'Compare health scores across multiple customers',
        category: 'Customer Health',
        requiresCustomer: true,
        defaultFilters: {
          comparisonMode: true
        }
      },

      // QBR Reports
      {
        id: 'qbr-quarterly',
        name: 'Quarterly Business Review',
        type: 'qbr',
        description: 'Standard quarterly business review for specific customers',
        category: 'QBR',
        requiresCustomer: true,
        defaultFilters: {
          quarter: 'current',
          includeMetrics: true,
          includeRecommendations: true
        }
      },
      {
        id: 'qbr-executive-summary',
        name: 'QBR Executive Summary',
        type: 'qbr',
        description: 'Executive-level QBR summary with key insights and action items',
        category: 'QBR',
        requiresCustomer: true,
        defaultFilters: {
          executiveView: true,
          includeROI: true,
          includeNextSteps: true
        }
      },
      {
        id: 'qbr-detailed-analysis',
        name: 'QBR Detailed Analysis',
        type: 'qbr',
        description: 'Comprehensive QBR with detailed metrics, trends, and recommendations',
        category: 'QBR',
        requiresCustomer: true,
        defaultFilters: {
          includeAllMetrics: true,
          includeTrends: true,
          includeCompetitiveAnalysis: true,
          includeRiskAssessment: true
        }
      },
      {
        id: 'qbr-portfolio-review',
        name: 'QBR Portfolio Review',
        type: 'qbr',
        description: 'Portfolio-wide QBR analysis across multiple customers',
        category: 'QBR',
        defaultFilters: {
          portfolioView: true,
          includeBenchmarks: true
        }
      },

      // Customer-Specific Reports
      {
        id: 'customer-360-view',
        name: 'Customer 360° View',
        type: 'customer-360',
        description: 'Complete customer overview including health, usage, support, and financial data',
        category: 'Customer Analysis',
        requiresCustomer: true,
        defaultFilters: {
          includeAllData: true,
          includePredictions: true
        }
      },
      {
        id: 'customer-usage-analysis',
        name: 'Customer Usage Analysis',
        type: 'customer-usage',
        description: 'Detailed analysis of customer product usage and adoption',
        category: 'Customer Analysis',
        requiresCustomer: true,
        defaultFilters: {
          includeAdoptionMetrics: true,
          includeFeatureUsage: true
        }
      },
      {
        id: 'customer-support-summary',
        name: 'Customer Support Summary',
        type: 'customer-support',
        description: 'Support ticket analysis and customer satisfaction metrics',
        category: 'Customer Analysis',
        requiresCustomer: true,
        defaultFilters: {
          includeSatisfaction: true,
          includeResolutionTimes: true
        }
      },
      {
        id: 'customer-churn-risk',
        name: 'Customer Churn Risk Analysis',
        type: 'customer-churn',
        description: 'Identify customers at risk of churning with mitigation strategies',
        category: 'Customer Analysis',
        requiresCustomer: true,
        defaultFilters: {
          includeRiskFactors: true,
          includeMitigationStrategies: true
        }
      },

      // Onboarding Reports
      {
        id: 'onboarding-progress',
        name: 'Onboarding Progress Report',
        type: 'onboarding',
        description: 'Track onboarding project progress and milestones',
        category: 'Onboarding',
        defaultFilters: {
          status: ['active', 'delayed']
        }
      },
      {
        id: 'onboarding-detailed',
        name: 'Detailed Onboarding Analysis',
        type: 'onboarding',
        description: 'Comprehensive onboarding analysis with timeline and blockers',
        category: 'Onboarding',
        requiresCustomer: true,
        defaultFilters: {
          includeTimeline: true,
          includeBlockers: true,
          includeSuccessMetrics: true
        }
      },

      // Alerts & Monitoring Reports
      {
        id: 'alerts-summary',
        name: 'Alerts Summary',
        type: 'alerts',
        description: 'Summary of all active alerts and their status',
        category: 'Monitoring',
        defaultFilters: {
          status: 'open'
        }
      },
      {
        id: 'alerts-customer-specific',
        name: 'Customer-Specific Alerts',
        type: 'alerts',
        description: 'Alerts and monitoring data for specific customers',
        category: 'Monitoring',
        requiresCustomer: true,
        defaultFilters: {
          includeHistory: true,
          includeTrends: true
        }
      },

      // Financial Reports
      {
        id: 'financial-overview',
        name: 'Financial Overview',
        type: 'financial',
        description: 'Financial metrics and ARR analysis',
        category: 'Financial',
        defaultFilters: {
          arrRange: { min: 0, max: 1000000 }
        }
      },
      {
        id: 'customer-financial-analysis',
        name: 'Customer Financial Analysis',
        type: 'financial',
        description: 'Detailed financial analysis for specific customers',
        category: 'Financial',
        requiresCustomer: true,
        defaultFilters: {
          includeARR: true,
          includeExpansion: true,
          includeContraction: true
        }
      },

      // Dashboard & Summary Reports
      {
        id: 'dashboard-summary',
        name: 'Dashboard Summary',
        type: 'dashboard',
        description: 'High-level dashboard metrics and KPIs',
        category: 'Summary'
      },
      {
        id: 'customer-portfolio-summary',
        name: 'Customer Portfolio Summary',
        type: 'portfolio',
        description: 'Portfolio-wide customer summary and insights',
        category: 'Summary',
        defaultFilters: {
          includeBenchmarks: true,
          includeTrends: true
        }
      }
    ];

    res.json(templates);

  } catch (err) {
    console.error('Error fetching report templates:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/analytics
// @desc    Get reporting analytics
// @access  Private (Admin only)
router.get('/analytics', auth, authorize('admin'), async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const reportsByType = await Report.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const reportsByStatus = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const topReportGenerators = await Report.aggregate([
      {
        $group: {
          _id: '$generatedBy',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      totalReports,
      reportsByType,
      reportsByStatus,
      topReportGenerators
    });

  } catch (err) {
    console.error('Error fetching reporting analytics:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 