const express = require('express');
const router = express.Router();
const qbrService = require('../services/qbrService');
const pdfExportService = require('../services/pdfExportService');
const { auth } = require('../middleware/auth');

// Generate QBR for a customer
router.post('/generate', auth, async (req, res) => {
  try {
    const { customerId, quarter, year } = req.body;
    
    if (!customerId || !quarter || !year) {
      return res.status(400).json({ 
        error: 'Customer ID, quarter, and year are required' 
      });
    }

    // Validate quarter format
    if (!/^Q[1-4]$/.test(quarter)) {
      return res.status(400).json({ 
        error: 'Quarter must be in format Q1, Q2, Q3, or Q4' 
      });
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (year < 2020 || year > currentYear + 1) {
      return res.status(400).json({ 
        error: 'Year must be between 2020 and next year' 
      });
    }

    const qbr = await qbrService.generateQBR(customerId, quarter, year, req.user.id);
    
    res.status(201).json({
      message: 'QBR generated successfully',
      qbr
    });
  } catch (error) {
    console.error('Error generating QBR:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to generate QBR' });
  }
});

// Get all QBRs for a customer
router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const qbrs = await qbrService.getCustomerQBRs(customerId);
    
    res.json({
      qbrs,
      count: qbrs.length
    });
  } catch (error) {
    console.error('Error fetching customer QBRs:', error);
    res.status(500).json({ error: 'Failed to fetch QBRs' });
  }
});

// Get specific QBR by ID
router.get('/:qbrId', auth, async (req, res) => {
  try {
    const { qbrId } = req.params;
    const qbr = await qbrService.getQBR(qbrId);
    
    if (!qbr) {
      return res.status(404).json({ error: 'QBR not found' });
    }
    
    res.json({ qbr });
  } catch (error) {
    console.error('Error fetching QBR:', error);
    res.status(500).json({ error: 'Failed to fetch QBR' });
  }
});

// Delete QBR (admin only)
router.delete('/:qbrId', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { qbrId } = req.params;
    const deletedQBR = await qbrService.deleteQBR(qbrId);
    
    if (!deletedQBR) {
      return res.status(404).json({ error: 'QBR not found' });
    }
    
    res.json({ 
      message: 'QBR deleted successfully',
      deletedQBR: { id: deletedQBR._id, quarter: deletedQBR.quarter }
    });
  } catch (error) {
    console.error('Error deleting QBR:', error);
    res.status(500).json({ error: 'Failed to delete QBR' });
  }
});

// Get QBR summary for dashboard
router.get('/summary/:customerId', auth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const qbrs = await qbrService.getCustomerQBRs(customerId);
    
    // Get latest QBR for summary
    const latestQBR = qbrs[0];
    
    if (!latestQBR) {
      return res.json({
        hasQBRs: false,
        message: 'No QBRs generated for this customer'
      });
    }
    
    const summary = {
      hasQBRs: true,
      latestQBR: {
        id: latestQBR._id,
        quarter: latestQBR.quarter,
        overallHealth: latestQBR.executiveSummary.overallHealth,
        healthScore: latestQBR.healthAnalysis.currentScore,
        renewalRisk: latestQBR.riskAssessment.renewalRisk,
        generatedAt: latestQBR.generatedAt
      },
      totalQBRs: qbrs.length,
      quarters: qbrs.map(qbr => ({
        id: qbr._id,
        quarter: qbr.quarter,
        healthScore: qbr.healthAnalysis.currentScore,
        generatedAt: qbr.generatedAt
      }))
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching QBR summary:', error);
    res.status(500).json({ error: 'Failed to fetch QBR summary' });
  }
});

// Export QBR as PDF
router.get('/:qbrId/export', auth, async (req, res) => {
  try {
    const { qbrId } = req.params;
    const qbr = await qbrService.getQBR(qbrId);
    
    if (!qbr) {
      return res.status(404).json({ error: 'QBR not found' });
    }
    
    // Generate PDF
    const pdfResult = await pdfExportService.generateQBRPDF(qbr);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', pdfResult.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.fileName}"`);
    res.setHeader('Content-Length', pdfResult.buffer.length);
    
    // Send PDF buffer
    res.send(pdfResult.buffer);
  } catch (error) {
    console.error('Error exporting QBR:', error);
    res.status(500).json({ error: 'Failed to export QBR as PDF' });
  }
});

// Export business analysis as PDF
router.get('/customer/:customerId/analysis/export', auth, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Get customer data
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Generate analysis data (this could be enhanced with more sophisticated analysis)
    const analysisData = {
      insights: [
        `Current health score of ${customer.healthScore}/100 indicates ${customer.healthScore >= 80 ? 'excellent' : customer.healthScore >= 60 ? 'good' : 'concerning'} customer health`,
        `ARR of $${customer.arr?.toLocaleString() || 0} represents significant business value`,
        'Regular monitoring and proactive engagement recommended',
        'Consider implementing additional success metrics tracking'
      ]
    };
    
    // Generate PDF
    const pdfResult = await pdfExportService.generateBusinessAnalysisPDF(customer, analysisData);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', pdfResult.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.fileName}"`);
    res.setHeader('Content-Length', pdfResult.buffer.length);
    
    // Send PDF buffer
    res.send(pdfResult.buffer);
  } catch (error) {
    console.error('Error exporting business analysis:', error);
    res.status(500).json({ error: 'Failed to export business analysis as PDF' });
  }
});

// Get QBR templates/suggestions for upcoming quarters
router.get('/templates/:customerId', auth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
    
    // Suggest next quarter and current quarter if not generated
    const suggestions = [];
    
    // Check if current quarter QBR exists
    const existingQBRs = await qbrService.getCustomerQBRs(customerId);
    const currentQBRExists = existingQBRs.some(qbr => 
      qbr.year === currentYear && qbr.quarterNumber === currentQuarter
    );
    
    if (!currentQBRExists && currentDate.getDate() > 15) { // Allow generation after mid-quarter
      suggestions.push({
        quarter: `Q${currentQuarter}`,
        year: currentYear,
        type: 'current',
        description: `Current quarter (Q${currentQuarter} ${currentYear}) QBR`
      });
    }
    
    // Suggest next quarter
    const nextQuarter = currentQuarter === 4 ? 1 : currentQuarter + 1;
    const nextYear = currentQuarter === 4 ? currentYear + 1 : currentYear;
    
    const nextQBRExists = existingQBRs.some(qbr => 
      qbr.year === nextYear && qbr.quarterNumber === nextQuarter
    );
    
    if (!nextQBRExists) {
      suggestions.push({
        quarter: `Q${nextQuarter}`,
        year: nextYear,
        type: 'upcoming',
        description: `Upcoming quarter (Q${nextQuarter} ${nextYear}) QBR`
      });
    }
    
    res.json({
      suggestions,
      existingQBRs: existingQBRs.length,
      currentQuarter: `Q${currentQuarter} ${currentYear}`
    });
  } catch (error) {
    console.error('Error fetching QBR templates:', error);
    res.status(500).json({ error: 'Failed to fetch QBR templates' });
  }
});

module.exports = router;