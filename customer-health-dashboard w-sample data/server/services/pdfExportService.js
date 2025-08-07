const htmlPdf = require('html-pdf-node');
const path = require('path');
const fs = require('fs').promises;

class PDFExportService {
  constructor() {
    this.options = {
      format: 'A4',
      border: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
          <span>Customer Health Dashboard - Quarterly Business Review</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on ${new Date().toLocaleDateString()}</span>
        </div>
      `,
      margin: {
        top: '1in',
        bottom: '1in'
      }
    };
  }

  // Generate QBR PDF
  async generateQBRPDF(qbr) {
    try {
      const html = this.generateQBRHTML(qbr);
      const file = { content: html };
      
      const pdfBuffer = await htmlPdf.generatePdf(file, this.options);
      
      // Create filename
      const customerName = qbr.customerId?.name || 'Unknown';
      const sanitizedName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `QBR_${sanitizedName}_${qbr.quarter.replace(' ', '_')}.pdf`;
      
      return {
        buffer: pdfBuffer,
        fileName,
        mimeType: 'application/pdf'
      };
    } catch (error) {
      console.error('Error generating QBR PDF:', error);
      throw new Error('Failed to generate PDF export');
    }
  }

  // Generate PDF for any report type
  async generateReportPDF(reportData, reportType, title) {
    try {
      const html = this.generateReportHTML(reportData, reportType, title);
      const file = { content: html };
      
      const pdfBuffer = await htmlPdf.generatePdf(file, this.options);
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating report PDF:', error);
      throw new Error('Failed to generate PDF export');
    }
  }

  // Generate HTML template for any report type
  generateReportHTML(reportData, reportType, title) {
    switch (reportType) {
      case 'qbr':
        return this.generateQBRHTML(reportData);
      case 'customer-health':
        return this.generateCustomerHealthHTML(reportData, title);
      case 'customer-360':
        return this.generateCustomer360HTML(reportData, title);
      case 'portfolio':
        return this.generatePortfolioHTML(reportData, title);
      default:
        return this.generateGenericReportHTML(reportData, title, reportType);
    }
  }

  // Generate HTML for Customer Health Report
  generateCustomerHealthHTML(reportData, title) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .metrics { display: flex; justify-content: space-around; margin: 20px 0; }
            .metric { text-align: center; padding: 10px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #1e40af; }
            .metric-label { font-size: 12px; color: #666; }
            .section { margin: 20px 0; }
            .section h3 { color: #1e40af; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="metrics">
            <div class="metric">
              <div class="metric-value">${reportData.summary?.totalCustomers || 0}</div>
              <div class="metric-label">Total Customers</div>
            </div>
            <div class="metric">
              <div class="metric-value">${reportData.summary?.averageHealthScore || 0}</div>
              <div class="metric-label">Average Health Score</div>
            </div>
            <div class="metric">
              <div class="metric-value">$${(reportData.summary?.totalARR || 0).toLocaleString()}</div>
              <div class="metric-label">Total ARR</div>
            </div>
          </div>

          <div class="section">
            <h3>Health Score Distribution</h3>
            <table>
              <tr><th>Health Score Range</th><th>Count</th><th>Percentage</th></tr>
              ${Object.entries(reportData.metrics?.healthScoreDistribution || {}).map(([range, data]) => `
                <tr>
                  <td>${range}</td>
                  <td>${data.count}</td>
                  <td>${data.percentage}%</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <h3>Top Customers</h3>
            <table>
              <tr><th>Customer</th><th>Health Score</th><th>ARR</th><th>Status</th></tr>
              ${(reportData.topCustomers || []).map(customer => `
                <tr>
                  <td>${customer.customer?.name || customer.customer}</td>
                  <td>${customer.healthScore}</td>
                  <td>$${customer.arr?.toLocaleString() || 0}</td>
                  <td>${customer.status}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        </body>
      </html>
    `;
  }

  // Generate HTML for Customer 360 Report  
  generateCustomer360HTML(reportData, title) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin: 20px 0; }
            .section h3 { color: #1e40af; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
            .grid { display: flex; gap: 20px; flex-wrap: wrap; }
            .card { flex: 1; min-width: 200px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Customer 360° View</p>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <h3>Customer Overview</h3>
            <div class="grid">
              <div class="card">
                <strong>Health Score:</strong> ${reportData.customer?.healthScore || 'N/A'}
              </div>
              <div class="card">
                <strong>ARR:</strong> $${(reportData.customer?.arr || 0).toLocaleString()}
              </div>
              <div class="card">
                <strong>Status:</strong> ${reportData.customer?.status || 'Active'}
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Usage Metrics</h3>
            <pre>${JSON.stringify(reportData.usage || {}, null, 2)}</pre>
          </div>

          <div class="section">
            <h3>Support History</h3>
            <pre>${JSON.stringify(reportData.support || {}, null, 2)}</pre>
          </div>
        </body>
      </html>
    `;
  }

  // Generate HTML for Portfolio Report
  generatePortfolioHTML(reportData, title) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .metrics { display: flex; justify-content: space-around; margin: 20px 0; }
            .metric { text-align: center; padding: 10px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #1e40af; }
            .metric-label { font-size: 12px; color: #666; }
            .section { margin: 20px 0; }
            .section h3 { color: #1e40af; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Portfolio Overview</p>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="metrics">
            <div class="metric">
              <div class="metric-value">${reportData.overview?.totalCustomers || 0}</div>
              <div class="metric-label">Total Customers</div>
            </div>
            <div class="metric">
              <div class="metric-value">$${(reportData.overview?.totalARR || 0).toLocaleString()}</div>
              <div class="metric-label">Total ARR</div>
            </div>
            <div class="metric">
              <div class="metric-value">${reportData.overview?.averageHealthScore || 0}</div>
              <div class="metric-label">Average Health Score</div>
            </div>
          </div>

          <div class="section">
            <h3>Portfolio Analysis</h3>
            <pre>${JSON.stringify(reportData, null, 2)}</pre>
          </div>
        </body>
      </html>
    `;
  }

  // Generate HTML for generic reports
  generateGenericReportHTML(reportData, title, reportType) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { margin: 20px 0; }
            pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Report Type: ${reportType}</p>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="content">
            <h3>Report Data</h3>
            <pre>${JSON.stringify(reportData, null, 2)}</pre>
          </div>
        </body>
      </html>
    `;
  }

  // Generate HTML template for QBR
  generateQBRHTML(qbr) {
    const customerName = qbr.customerId?.name || 'Unknown Customer';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>QBR - ${customerName} - ${qbr.quarter}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #1976d2;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .header h1 {
          color: #1976d2;
          margin: 0;
          font-size: 28px;
        }
        
        .header h2 {
          color: #666;
          margin: 5px 0;
          font-weight: normal;
        }
        
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .section h3 {
          color: #1976d2;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .metric-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
          background: #f9f9f9;
        }
        
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 5px;
        }
        
        .metric-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
        }
        
        .status-chip {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .status-success { background: #e8f5e8; color: #2e7d32; }
        .status-warning { background: #fff3e0; color: #f57c00; }
        .status-error { background: #ffebee; color: #d32f2f; }
        
        .list-item {
          margin-bottom: 8px;
          padding-left: 20px;
          position: relative;
        }
        
        .list-item:before {
          content: "•";
          color: #1976d2;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        
        .risk-factors {
          background: #ffebee;
          border-left: 4px solid #d32f2f;
          padding: 15px;
          margin: 10px 0;
        }
        
        .achievements {
          background: #e8f5e8;
          border-left: 4px solid #2e7d32;
          padding: 15px;
          margin: 10px 0;
        }
        
        .recommendations {
          background: #e3f2fd;
          border-left: 4px solid #1976d2;
          padding: 15px;
          margin: 10px 0;
        }
        
        .action-item {
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 10px;
          margin: 5px 0;
          background: white;
        }
        
        .action-priority-high { border-left: 4px solid #d32f2f; }
        .action-priority-medium { border-left: 4px solid #f57c00; }
        .action-priority-low { border-left: 4px solid #2e7d32; }
        
        .page-break {
          page-break-before: always;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        
        th, td {
          border: 1px solid #e0e0e0;
          padding: 8px 12px;
          text-align: left;
        }
        
        th {
          background: #f5f5f5;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Quarterly Business Review</h1>
        <h2>${customerName}</h2>
        <h2>${qbr.quarter}</h2>
        <p>Generated on ${new Date(qbr.generatedAt).toLocaleDateString()}</p>
      </div>

      <!-- Executive Summary -->
      <div class="section">
        <h3>Executive Summary</h3>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${qbr.executiveSummary.overallHealth}</div>
            <div class="metric-label">Overall Health</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${qbr.healthAnalysis.currentScore}/100</div>
            <div class="metric-label">Health Score</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">
              <span class="status-chip status-${this.getRiskClass(qbr.riskAssessment.renewalRisk)}">
                ${qbr.riskAssessment.renewalRisk.toUpperCase()}
              </span>
            </div>
            <div class="metric-label">Renewal Risk</div>
          </div>
        </div>

        ${qbr.executiveSummary.keyAchievements.length > 0 ? `
        <div class="achievements">
          <h4>Key Achievements</h4>
          ${qbr.executiveSummary.keyAchievements.map(achievement => 
            `<div class="list-item">${achievement}</div>`
          ).join('')}
        </div>
        ` : ''}

        ${qbr.executiveSummary.majorChallenges.length > 0 ? `
        <div class="risk-factors">
          <h4>Major Challenges</h4>
          ${qbr.executiveSummary.majorChallenges.map(challenge => 
            `<div class="list-item">${challenge}</div>`
          ).join('')}
        </div>
        ` : ''}

        ${qbr.executiveSummary.recommendations.length > 0 ? `
        <div class="recommendations">
          <h4>Recommendations</h4>
          ${qbr.executiveSummary.recommendations.map(recommendation => 
            `<div class="list-item">${recommendation}</div>`
          ).join('')}
        </div>
        ` : ''}
      </div>

      <!-- Business Metrics -->
      <div class="section">
        <h3>Business Metrics</h3>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">$${qbr.businessMetrics.arr?.toLocaleString() || 0}</div>
            <div class="metric-label">Annual Recurring Revenue</div>
            ${qbr.businessMetrics.arrGrowth !== 0 ? `
              <div style="color: ${qbr.businessMetrics.arrGrowth > 0 ? '#2e7d32' : '#d32f2f'}; font-size: 14px;">
                ${qbr.businessMetrics.arrGrowth > 0 ? '+' : ''}${qbr.businessMetrics.arrGrowth}%
              </div>
            ` : ''}
          </div>
          <div class="metric-card">
            <div class="metric-value">${qbr.businessMetrics.featureAdoption}%</div>
            <div class="metric-label">Feature Adoption</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${qbr.businessMetrics.supportTickets}</div>
            <div class="metric-label">Support Tickets</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" style="color: ${qbr.businessMetrics.criticalIssues > 0 ? '#d32f2f' : '#2e7d32'}">
              ${qbr.businessMetrics.criticalIssues}
            </div>
            <div class="metric-label">Critical Issues</div>
          </div>
        </div>
      </div>

      <!-- Integration Metrics -->
      <div class="section">
        <h3>Integration Performance</h3>
        <table>
          <thead>
            <tr>
              <th>Platform</th>
              <th>Key Metrics</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Jira</strong></td>
              <td>
                Total Tickets: ${qbr.integrationMetrics.jira.totalTickets}<br>
                Resolved: ${qbr.integrationMetrics.jira.resolvedTickets}<br>
                Avg Resolution: ${qbr.integrationMetrics.jira.avgResolutionTime}h
              </td>
              <td>
                <span class="status-chip status-${qbr.integrationMetrics.jira.criticalIssues === 0 ? 'success' : 'warning'}">
                  ${qbr.integrationMetrics.jira.criticalIssues} Critical
                </span>
              </td>
            </tr>
            <tr>
              <td><strong>Zendesk</strong></td>
              <td>
                Support Tickets: ${qbr.integrationMetrics.zendesk.totalTickets}<br>
                Satisfaction: ${qbr.integrationMetrics.zendesk.satisfactionScore}/5<br>
                Avg Response: ${qbr.integrationMetrics.zendesk.avgResponseTime}h
              </td>
              <td>
                <span class="status-chip status-${qbr.integrationMetrics.zendesk.escalations === 0 ? 'success' : 'warning'}">
                  ${qbr.integrationMetrics.zendesk.escalations} Escalations
                </span>
              </td>
            </tr>
            <tr>
              <td><strong>HubSpot</strong></td>
              <td>
                Engagement Score: ${qbr.integrationMetrics.hubspot.engagementScore}/100<br>
                Meetings: ${qbr.integrationMetrics.hubspot.meetingsHeld}<br>
                Email Opens: ${qbr.integrationMetrics.hubspot.emailOpens}
              </td>
              <td>
                <span class="status-chip status-success">
                  ${qbr.integrationMetrics.hubspot.lifecycleStage}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Risk Assessment -->
      <div class="section page-break">
        <h3>Risk Assessment</h3>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">
              <span class="status-chip status-${this.getRiskClass(qbr.riskAssessment.renewalRisk)}">
                ${qbr.riskAssessment.renewalRisk.toUpperCase()}
              </span>
            </div>
            <div class="metric-label">Renewal Risk</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" style="color: ${qbr.riskAssessment.churnProbability > 50 ? '#d32f2f' : '#2e7d32'}">
              ${qbr.riskAssessment.churnProbability}%
            </div>
            <div class="metric-label">Churn Probability</div>
          </div>
        </div>

        ${qbr.riskAssessment.riskFactors.length > 0 ? `
        <div class="risk-factors">
          <h4>Risk Factors</h4>
          ${qbr.riskAssessment.riskFactors.map(factor => 
            `<div class="list-item">${factor}</div>`
          ).join('')}
        </div>
        ` : ''}

        ${qbr.riskAssessment.mitigationStrategies.length > 0 ? `
        <div class="recommendations">
          <h4>Mitigation Strategies</h4>
          ${qbr.riskAssessment.mitigationStrategies.map(strategy => 
            `<div class="list-item">${strategy}</div>`
          ).join('')}
        </div>
        ` : ''}
      </div>

      <!-- Action Plan -->
      <div class="section">
        <h3>Action Plan</h3>
        
        ${qbr.actionPlan.immediateActions.length > 0 ? `
        <h4>Immediate Actions</h4>
        ${qbr.actionPlan.immediateActions.map(action => `
          <div class="action-item action-priority-${action.priority}">
            <strong>${action.action}</strong><br>
            <small>Owner: ${action.owner} | Due: ${new Date(action.dueDate).toLocaleDateString()} | Priority: ${action.priority.toUpperCase()}</small>
          </div>
        `).join('')}
        ` : ''}

        ${qbr.actionPlan.longTermInitiatives.length > 0 ? `
        <h4>Long-term Initiatives</h4>
        ${qbr.actionPlan.longTermInitiatives.map(initiative => `
          <div class="action-item">
            <strong>${initiative.initiative}</strong><br>
            <small>Timeline: ${initiative.timeline} | Expected Outcome: ${initiative.expectedOutcome}</small>
          </div>
        `).join('')}
        ` : ''}
      </div>

      <!-- Feedback Analysis -->
      ${qbr.feedbackAnalysis.totalFeedback > 0 ? `
      <div class="section">
        <h3>Customer Feedback Analysis</h3>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${qbr.feedbackAnalysis.totalFeedback}</div>
            <div class="metric-label">Total Feedback</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" style="color: #2e7d32">${qbr.feedbackAnalysis.positiveCount}</div>
            <div class="metric-label">Positive</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" style="color: #d32f2f">${qbr.feedbackAnalysis.negativeCount}</div>
            <div class="metric-label">Negative</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${qbr.feedbackAnalysis.neutralCount}</div>
            <div class="metric-label">Neutral</div>
          </div>
        </div>

        ${qbr.feedbackAnalysis.keyThemes.length > 0 ? `
        <h4>Key Themes</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          ${qbr.feedbackAnalysis.keyThemes.map(theme => 
            `<span class="status-chip status-success">${theme}</span>`
          ).join('')}
        </div>
        ` : ''}
      </div>
      ` : ''}
    </body>
    </html>
    `;
  }

  getRiskClass(risk) {
    switch (risk) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'success';
    }
  }

  // Generate business analysis PDF
  async generateBusinessAnalysisPDF(customer, analysisData) {
    try {
      const html = this.generateBusinessAnalysisHTML(customer, analysisData);
      const file = { content: html };
      
      const pdfBuffer = await htmlPdf.generatePdf(file, this.options);
      
      const sanitizedName = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Business_Analysis_${sanitizedName}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      return {
        buffer: pdfBuffer,
        fileName,
        mimeType: 'application/pdf'
      };
    } catch (error) {
      console.error('Error generating business analysis PDF:', error);
      throw new Error('Failed to generate business analysis PDF');
    }
  }

  generateBusinessAnalysisHTML(customer, analysisData) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Business Analysis - ${customer.name}</title>
      <style>
        /* Same styles as QBR */
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #1976d2; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #1976d2; margin: 0; font-size: 28px; }
        .section { margin-bottom: 30px; page-break-inside: avoid; }
        .section h3 { color: #1976d2; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px; margin-bottom: 15px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; text-align: center; background: #f9f9f9; }
        .metric-value { font-size: 24px; font-weight: bold; color: #1976d2; margin-bottom: 5px; }
        .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .insights { background: #e3f2fd; border-left: 4px solid #1976d2; padding: 15px; margin: 10px 0; }
        .list-item { margin-bottom: 8px; padding-left: 20px; position: relative; }
        .list-item:before { content: "•"; color: #1976d2; font-weight: bold; position: absolute; left: 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Business Analysis Report</h1>
        <h2>${customer.name}</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="section">
        <h3>Customer Overview</h3>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">$${customer.arr?.toLocaleString() || 0}</div>
            <div class="metric-label">Annual Recurring Revenue</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${customer.healthScore || 0}/100</div>
            <div class="metric-label">Health Score</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>Key Insights</h3>
        <div class="insights">
          <h4>Actionable Insights</h4>
          ${analysisData.insights?.map(insight => 
            `<div class="list-item">${insight}</div>`
          ).join('') || '<div class="list-item">No specific insights available at this time.</div>'}
        </div>
      </div>
    </body>
    </html>
    `;
  }
}

module.exports = new PDFExportService();