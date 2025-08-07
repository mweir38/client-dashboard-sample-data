const axios = require('axios');

class JiraService {
  constructor() {
    this.baseURL = process.env.JIRA_BASE_URL;
    this.email = process.env.JIRA_EMAIL;
    this.apiToken = process.env.JIRA_API_TOKEN;
    
    if (!this.baseURL || !this.email || !this.apiToken) {
      console.warn('Jira credentials not configured. Set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN in .env');
    }
  }

  getAuthHeaders() {
    const auth = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  async getProjectIssues(projectKey) {
    try {
      if (!this.baseURL) {
        throw new Error('Jira not configured');
      }

      const response = await axios.get(
        `${this.baseURL}/rest/api/3/search`,
        {
          headers: this.getAuthHeaders(),
          params: {
            jql: `project = "${projectKey}" ORDER BY created DESC`,
            maxResults: 1000,
            fields: 'status,priority,created,resolutiondate,resolution'
          }
        }
      );

      return response.data.issues;
    } catch (error) {
      console.error('Error fetching Jira issues:', error.message);
      throw error;
    }
  }

  // Get specific issue by ID or key with comments
  async getIssue(idOrKey) {
    try {
      if (!this.baseURL) {
        throw new Error('Jira not configured');
      }

      const response = await axios.get(
        `${this.baseURL}/rest/api/3/issue/${idOrKey}`,
        {
          headers: this.getAuthHeaders(),
          params: {
            expand: 'comments,changelog,transitions',
            fields: 'status,priority,created,resolutiondate,resolution,summary,description,assignee,reporter,labels,components'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching Jira issue ${idOrKey}:`, error.message);
      throw error;
    }
  }

  // Get issue comments for timeline display
  async getIssueComments(issueId) {
    try {
      if (!this.baseURL) {
        throw new Error('Jira not configured');
      }

      const response = await axios.get(
        `${this.baseURL}/rest/api/3/issue/${issueId}/comment`,
        {
          headers: this.getAuthHeaders(),
          params: {
            orderBy: 'created',
            expand: 'body'
          }
        }
      );

      return response.data.comments;
    } catch (error) {
      console.error(`Error fetching comments for issue ${issueId}:`, error.message);
      throw error;
    }
  }

  // Search issues using JQL for QBR tasks per customer
  async searchIssues(jql, maxResults = 100) {
    try {
      if (!this.baseURL) {
        throw new Error('Jira not configured');
      }

      const response = await axios.get(
        `${this.baseURL}/rest/api/3/search`,
        {
          headers: this.getAuthHeaders(),
          params: {
            jql,
            maxResults,
            fields: 'status,priority,created,resolutiondate,resolution,summary,description,assignee,reporter,labels,components,customfield_*'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error searching Jira issues:', error.message);
      throw error;
    }
  }

  // Get QBR tasks for a specific customer
  async getQBRTasks(customerName, projectKey = null) {
    try {
      let jql = `summary ~ "${customerName}" AND (labels = "QBR" OR summary ~ "QBR" OR description ~ "QBR")`;
      
      if (projectKey) {
        jql += ` AND project = "${projectKey}"`;
      }
      
      jql += ' ORDER BY created DESC';

      const result = await this.searchIssues(jql, 50);
      return result.issues;
    } catch (error) {
      console.error(`Error fetching QBR tasks for customer ${customerName}:`, error.message);
      return [];
    }
  }

  // Get customer-specific issues by project or labels
  async getCustomerIssues(customerIdentifier, projectKey = null) {
    try {
      let jql = `(summary ~ "${customerIdentifier}" OR description ~ "${customerIdentifier}" OR labels = "${customerIdentifier}")`;
      
      if (projectKey) {
        jql += ` AND project = "${projectKey}"`;
      }
      
      jql += ' ORDER BY created DESC';

      const result = await this.searchIssues(jql, 100);
      return result.issues;
    } catch (error) {
      console.error(`Error fetching issues for customer ${customerIdentifier}:`, error.message);
      return [];
    }
  }

  async getCustomerMetrics(projectKey) {
    try {
      const issues = await this.getProjectIssues(projectKey);
      
      const openIssues = issues.filter(issue => 
        !issue.fields.resolution
      ).length;

      const resolvedIssues = issues.filter(issue => 
        issue.fields.resolution
      ).length;

      const criticalIssues = issues.filter(issue => 
        !issue.fields.resolution && 
        (issue.fields.priority?.name === 'Critical' || issue.fields.priority?.name === 'Highest')
      ).length;

      // Calculate average resolution time for resolved issues
      const resolvedWithTime = issues.filter(issue => 
        issue.fields.resolution && issue.fields.resolutiondate
      );

      let avgResolutionTime = 0;
      if (resolvedWithTime.length > 0) {
        const totalTime = resolvedWithTime.reduce((sum, issue) => {
          const created = new Date(issue.fields.created);
          const resolved = new Date(issue.fields.resolutiondate);
          return sum + (resolved - created);
        }, 0);
        avgResolutionTime = Math.round(totalTime / resolvedWithTime.length / (1000 * 60 * 60)); // Convert to hours
      }

      return {
        projectKey,
        openIssues,
        resolvedIssues,
        avgResolutionTime,
        criticalIssues,
        lastSync: new Date()
      };
    } catch (error) {
      console.error(`Error getting Jira metrics for project ${projectKey}:`, error.message);
      // Return default values if API fails
      return {
        projectKey,
        openIssues: 0,
        resolvedIssues: 0,
        avgResolutionTime: 0,
        criticalIssues: 0,
        lastSync: new Date()
      };
    }
  }

  calculateDevelopmentHealth(jiraData) {
    let score = 100;

    // Penalize for open critical issues (each critical issue reduces score by 15)
    score -= jiraData.criticalIssues * 15;

    // Penalize for high number of open issues relative to resolved
    const totalIssues = jiraData.openIssues + jiraData.resolvedIssues;
    if (totalIssues > 0) {
      const openRatio = jiraData.openIssues / totalIssues;
      if (openRatio > 0.3) { // More than 30% open issues
        score -= (openRatio - 0.3) * 100;
      }
    }

    // Penalize for slow resolution times (over 72 hours)
    if (jiraData.avgResolutionTime > 72) {
      const penalty = Math.min(30, (jiraData.avgResolutionTime - 72) / 24 * 5);
      score -= penalty;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

module.exports = new JiraService();
