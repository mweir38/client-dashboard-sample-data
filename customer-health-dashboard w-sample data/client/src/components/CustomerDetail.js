import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  AppBar,
  Toolbar,
  Container,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CardActionArea,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Switch,
  FormControlLabel,
  Collapse
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  Assessment as QBRIcon,
  BugReport as JiraIcon,
  Support as ZendeskIcon,
  Business as HubSpotIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenIcon,
  Schedule as ClockIcon,
  DeveloperMode as DevIcon,
  Warning as WarningIcon,
  FilterList as FilterIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Book as PlaybookIcon,
  PriorityHigh as CriticalIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Info as InfoIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import QBRViewer from './QBRViewer';

const CustomerDetail = () => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qbrOpen, setQbrOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [jiraTickets, setJiraTickets] = useState([]);
  const [zendeskTickets, setZendeskTickets] = useState([]);
  const [jiraMetrics, setJiraMetrics] = useState(null);
  const [ticketDetailOpen, setTicketDetailOpen] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [selectedTicketType, setSelectedTicketType] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [currentFilters, setCurrentFilters] = useState({
    dateRange: 'all',
    priority: 'all',
    status: 'all',
    assignee: 'all',
    searchText: ''
  });
  const [playbookOpen, setPlaybookOpen] = useState(false);
  const [playbookEditMode, setPlaybookEditMode] = useState(false);
  const [playbookContent, setPlaybookContent] = useState({
    criticalResponse: {
      subject: 'Urgent: [Ticket ID] - [Brief Description]',
      greeting: 'Hi [Customer Name],',
      body: `I understand this is a critical issue affecting your business operations. I've escalated this to our senior technical team and assigned our most experienced engineer to resolve this immediately.

You can expect:
• Initial response within 2 hours
• Regular updates every 4 hours
• Resolution timeline by end of day

I'll personally monitor this ticket and ensure it receives the attention it deserves.`,
      closing: `Best regards,
[Your Name]
Customer Success Manager`
    },
    agingFollowup: {
      subject: 'Update on [Ticket ID] - [Brief Description]',
      greeting: 'Hi [Customer Name],',
      body: `I wanted to personally check in on ticket [Ticket ID] which has been open for [X] days. I understand the importance of this issue and want to ensure you're getting the support you need.

Current Status: [Status]
Assigned Engineer: [Name]
Expected Resolution: [Date]

Is there anything additional I can do to help expedite this resolution? I'm available for a quick call if you'd like to discuss this further.`,
      closing: `Best regards,
[Your Name]`
    },
    satisfactionFollowup: {
      subject: 'How did we do? Feedback on [Ticket ID]',
      greeting: 'Hi [Customer Name],',
      body: `I hope the resolution to [Ticket ID] met your expectations. Your feedback is incredibly valuable to us and helps us improve our service.

Could you take a moment to rate your experience? It only takes a minute and helps us ensure we're delivering the best possible support.

[Survey Link]`,
      closing: `Thank you for your business!
[Your Name]`
    },
    escalationGuidelines: [
      {
        title: 'Critical Priority Tickets',
        description: 'Escalate immediately to senior engineer + notify customer within 1 hour'
      },
      {
        title: 'Tickets > 7 days old',
        description: 'Personal follow-up call with customer + internal escalation'
      },
      {
        title: 'Satisfaction Score < 3',
        description: 'Immediate manager review + customer apology call'
      },
      {
        title: 'Multiple tickets from same customer',
        description: 'Schedule health check call to identify root cause'
      }
    ]
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [customerSatisfaction, setCustomerSatisfaction] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  const fetchCustomer = useCallback(async (forceRefresh = false) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const url = forceRefresh 
        ? `http://localhost:5000/api/customers/${id}?refresh=true`
        : `http://localhost:5000/api/customers/${id}`;
      
      const res = await axios.get(url, config);
      setCustomer(res.data);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching customer:', err);
      const errorMessage = err.response?.data?.msg || err.response?.data?.error || 'Failed to fetch customer details';
      setError(errorMessage);
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else if (err.response?.status === 404) {
        setError('Customer not found');
      }
    }
    setLoading(false);
  }, [id, navigate]);

  const fetchTicketData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // Fetch Jira tickets and metrics
      const [jiraResponse, jiraMetricsResponse, zendeskResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/customers/${id}/jira-tickets`, config),
        axios.get(`http://localhost:5000/api/customers/${id}/jira-metrics`, config),
        axios.get(`http://localhost:5000/api/customers/${id}/tickets`, config)
      ]);

      setJiraTickets(jiraResponse.data.tickets || []);
      setJiraMetrics(jiraMetricsResponse.data.metrics || {});
      setZendeskTickets(zendeskResponse.data.tickets || []);
    } catch (err) {
      console.error('Error fetching ticket data:', err);
      // Set empty data on error
      setJiraTickets([]);
      setJiraMetrics({});
      setZendeskTickets([]);
    }
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/login');
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }

    fetchCustomer();
    fetchTicketData();
    
    // Load saved searches from localStorage
    const savedSearchesData = localStorage.getItem(`savedSearches_${id}`);
    if (savedSearchesData) {
      try {
        setSavedSearches(JSON.parse(savedSearchesData));
      } catch (error) {
        console.error('Error loading saved searches:', error);
      }
    }
  }, [id, navigate, fetchCustomer, fetchTicketData]);

  // Update recent activity and satisfaction when ticket data changes
  useEffect(() => {
    if (jiraTickets.length > 0 || zendeskTickets.length > 0) {
      setRecentActivity(generateRecentActivity());
      setCustomerSatisfaction(calculateSatisfactionScore());
    }
  }, [jiraTickets, zendeskTickets]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomer(true);
    await fetchTicketData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getHealthScoreColor = (score) => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'error';
  };

  const getHealthScoreLabel = (score) => {
    if (score >= 8) return 'Healthy';
    if (score >= 6) return 'At Risk';
    return 'Critical';
  };

  // Calculate ticket metrics for cards
  const getTicketMetrics = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Jira metrics
    const jiraLast30Days = jiraTickets.filter(ticket => 
      new Date(ticket.created) >= thirtyDaysAgo
    );
    const jiraOpen30Days = jiraLast30Days.filter(ticket => 
      !['Done', 'Closed', 'Resolved'].includes(ticket.status)
    );
    const jiraClosed30Days = jiraLast30Days.filter(ticket => 
      ['Done', 'Closed', 'Resolved'].includes(ticket.status)
    );
    const jiraOlderThan90Days = jiraTickets.filter(ticket => 
      new Date(ticket.created) < ninetyDaysAgo && 
      !['Done', 'Closed', 'Resolved'].includes(ticket.status)
    );
    const jiraInDev = jiraTickets.filter(ticket => 
      ['In Development', 'Development', 'In Progress', 'Dev'].some(status =>
        ticket.status.toLowerCase().includes(status.toLowerCase())
      )
    );

    // Critical tickets (high priority + old OR critical priority)
    const criticalJiraTickets = jiraTickets.filter(ticket => {
      const isOld = new Date(ticket.created) < sevenDaysAgo;
      const isHighPriority = ['Critical', 'Highest', 'Blocker'].includes(ticket.priority);
      const isOpen = !['Done', 'Closed', 'Resolved'].includes(ticket.status);
      return isOpen && (isHighPriority || isOld);
    });

    // Zendesk metrics
    const zendeskLast30Days = zendeskTickets.filter(ticket => 
      new Date(ticket.created_at) >= thirtyDaysAgo
    );
    const zendeskOpen30Days = zendeskLast30Days.filter(ticket => 
      !['solved', 'closed'].includes(ticket.status)
    );
    const zendeskClosed30Days = zendeskLast30Days.filter(ticket => 
      ['solved', 'closed'].includes(ticket.status)
    );
    const zendeskOlderThan90Days = zendeskTickets.filter(ticket => 
      new Date(ticket.created_at) < ninetyDaysAgo && 
      !['solved', 'closed'].includes(ticket.status)
    );

    // Critical Zendesk tickets
    const criticalZendeskTickets = zendeskTickets.filter(ticket => {
      const isOld = new Date(ticket.created_at) < sevenDaysAgo;
      const isUrgent = ticket.priority === 'urgent' || ticket.priority === 'high';
      const isOpen = !['solved', 'closed'].includes(ticket.status);
      return isOpen && (isUrgent || isOld);
    });

    return {
      jira: {
        open30Days: jiraOpen30Days,
        closed30Days: jiraClosed30Days,
        olderThan90Days: jiraOlderThan90Days,
        inDev: jiraInDev,
        critical: criticalJiraTickets
      },
      zendesk: {
        open30Days: zendeskOpen30Days,
        closed30Days: zendeskClosed30Days,
        olderThan90Days: zendeskOlderThan90Days,
        critical: criticalZendeskTickets
      }
    };
  };

  const handleCardClick = (tickets, title) => {
    setSelectedTickets(tickets);
    setSelectedTicketType(title);
    setTicketDetailOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDuration = (createdDate) => {
    const now = new Date();
    const created = new Date(createdDate);
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  // Filter tickets based on current filters
  const getFilteredTickets = (tickets) => {
    return tickets.filter(ticket => {
      const isJira = ticket.key !== undefined;
      const created = isJira ? ticket.created : ticket.created_at;
      const priority = isJira ? ticket.priority : ticket.priority;
      const status = ticket.status;
      const assignee = isJira ? ticket.assignee : ticket.assignee_id;
      const summary = isJira ? ticket.summary : ticket.subject;

      // Date range filter
      if (currentFilters.dateRange !== 'all') {
        const now = new Date();
        const ticketDate = new Date(created);
        switch (currentFilters.dateRange) {
          case 'today':
            if (ticketDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (ticketDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (ticketDate < monthAgo) return false;
            break;
        }
      }

      // Priority filter
      if (currentFilters.priority !== 'all' && priority !== currentFilters.priority) {
        return false;
      }

      // Status filter
      if (currentFilters.status !== 'all' && status !== currentFilters.status) {
        return false;
      }

      // Assignee filter
      if (currentFilters.assignee !== 'all' && assignee !== currentFilters.assignee) {
        return false;
      }

      // Search text filter
      if (currentFilters.searchText && !summary.toLowerCase().includes(currentFilters.searchText.toLowerCase())) {
        return false;
      }

      return true;
    });
  };

  // Save current search
  const saveCurrentSearch = () => {
    const searchName = prompt('Enter a name for this search:');
    if (searchName && searchName.trim()) {
      const newSearch = {
        id: Date.now(),
        name: searchName.trim(),
        filters: { ...currentFilters }
      };
      setSavedSearches([...savedSearches, newSearch]);
      localStorage.setItem(`savedSearches_${id}`, JSON.stringify([...savedSearches, newSearch]));
    }
  };

  // Load saved search
  const loadSavedSearch = (search) => {
    setCurrentFilters(search.filters);
  };

  // Generate recent activity
  const generateRecentActivity = () => {
    const allTickets = [...jiraTickets, ...zendeskTickets];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentTickets = allTickets
      .filter(ticket => {
        const isJira = ticket.key !== undefined;
        const created = isJira ? ticket.created : ticket.created_at;
        const updated = isJira ? ticket.updated : ticket.updated_at;
        return new Date(updated || created) >= sevenDaysAgo;
      })
      .sort((a, b) => {
        const isJiraA = a.key !== undefined;
        const isJiraB = b.key !== undefined;
        const dateA = isJiraA ? a.updated || a.created : a.updated_at || a.created_at;
        const dateB = isJiraB ? b.updated || b.created : b.updated_at || b.created_at;
        return new Date(dateB) - new Date(dateA);
      })
      .slice(0, 10);

    return recentTickets.map(ticket => {
      const isJira = ticket.key !== undefined;
      const created = isJira ? ticket.created : ticket.created_at;
      const updated = isJira ? ticket.updated : ticket.updated_at;
      const summary = isJira ? ticket.summary : ticket.subject;
      const status = ticket.status;
      const ticketId = isJira ? ticket.key : ticket.id;

      return {
        id: ticketId,
        type: isJira ? 'jira' : 'zendesk',
        action: updated && updated !== created ? 'updated' : 'created',
        summary,
        status,
        date: updated || created,
        url: ticket.url
      };
    });
  };

  // Calculate customer satisfaction score
  const calculateSatisfactionScore = () => {
    if (!zendeskTickets.length) return null;

    const satisfactionTickets = zendeskTickets.filter(ticket => 
      ticket.satisfaction_rating && ticket.satisfaction_rating.score
    );

    if (satisfactionTickets.length === 0) return null;

    const totalScore = satisfactionTickets.reduce((sum, ticket) => 
      sum + ticket.satisfaction_rating.score, 0
    );
    const averageScore = totalScore / satisfactionTickets.length;

    return {
      score: Math.round(averageScore * 20), // Convert to percentage
      totalRatings: satisfactionTickets.length,
      recentRatings: satisfactionTickets.filter(ticket => {
        const ratingDate = new Date(ticket.satisfaction_rating.created_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return ratingDate >= thirtyDaysAgo;
      }).length
    };
  };

  // Helper function to get product display name
  const getProductDisplayName = (product) => {
    if (!product) return 'Unknown Product';
    if (product.type === 'Other' && product.customName) {
      return product.customName;
    }
    return product.type || product.name || 'Unknown Product';
  };





  if (loading) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Customer Health Dashboard
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Typography>Loading customer details...</Typography>
        </Container>
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Customer Health Dashboard
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Customer not found'}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Container>
      </Box>
    );
  }

  const ticketMetrics = getTicketMetrics();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Customer Health Dashboard
          </Typography>
          <Button color="inherit" onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Customer Header */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" component="h1">
                    {customer.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Tooltip title="Refresh customer data">
                      <IconButton 
                        onClick={handleRefresh} 
                        disabled={refreshing}
                        color="primary"
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                    <Button
                      variant="outlined"
                      startIcon={<QBRIcon />}
                      onClick={() => setQbrOpen(true)}
                    >
                      QBR Reports
                    </Button>
                    <Chip
                      label={getHealthScoreLabel(customer.healthScore || 0)}
                      color={getHealthScoreColor(customer.healthScore || 0)}
                      size="large"
                    />
                  </Box>
                </Box>
                <Typography variant="h6" color="textSecondary">
                  Current Health Score: {customer.healthScore || 0}/10
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Key Metrics */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                  Key Metrics
                </Typography>
                <List sx={{ py: 0 }}>
                  {/* Renewal */}
                  <ListItem sx={{ px: 0, py: 1 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 500 }}>
                            Renewal Likelihood
                          </Typography>
                          <Tooltip title="Renewal likelihood indicates the probability of customer renewal. Currently manually set, but can be calculated automatically based on: Health Score (30%), Product Usage (20%), Support Satisfaction (25%), Open Tickets (15%), and Recent Activity (10%). High = Strong renewal probability, Medium = Uncertain, Low = At risk of churn.">
                            <IconButton size="small" sx={{ p: 0, minWidth: 'auto' }}>
                              <InfoIcon fontSize="small" color="action" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Calculate automated renewal likelihood based on current customer data">
                            <IconButton 
                              size="small" 
                              sx={{ p: 0, minWidth: 'auto' }}
                              onClick={async () => {
                                try {
                                  const response = await axios.get(`/api/customers/${customer._id}/calculate-renewal`, {
                                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                  });
                                  alert(`Automated Calculation:\nLikelihood: ${response.data.calculatedRenewalLikelihood}\nScore: ${response.data.calculatedScore}\n\nFactors:\n${response.data.factors.join('\n')}`);
                                } catch (error) {
                                  console.error('Failed to calculate renewal likelihood:', error);
                                  alert('Failed to calculate automated renewal likelihood');
                                }
                              }}
                            >
                              <CalculateIcon fontSize="small" color="action" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                      secondary={
                        <Chip 
                          label={customer.renewalLikelihood || 'Unknown'} 
                          size="small"
                          color={
                            customer.renewalLikelihood === 'high' ? 'success' :
                            customer.renewalLikelihood === 'medium' ? 'warning' :
                            customer.renewalLikelihood === 'low' ? 'error' : 'default'
                          }
                          variant="filled"
                          sx={{ fontWeight: 600 }}
                        />
                      }
                    />
                  </ListItem>
                  
                  {/* Engagement Metrics */}
                  <Divider sx={{ my: 1 }} />
                  <ListItem sx={{ px: 0, py: 1 }}>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 500 }}>
                          Product Adoption
                        </Typography>
                      }
                      secondary={
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                          {customer.productUsage?.length || 0} products
                        </Typography>
                      }
                    />
                  </ListItem>
                  
                  {/* Health Sub-Scores */}
                  {customer.metrics && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 500 }}>
                              Support Health
                            </Typography>
                          }
                          secondary={
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                              {customer.metrics.supportHealth || 0}%
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 500 }}>
                              Development Health
                            </Typography>
                          }
                          secondary={
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                              {customer.metrics.developmentHealth || 0}%
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 500 }}>
                              Sales Health
                            </Typography>
                          }
                          secondary={
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                              {customer.metrics.salesHealth || 0}%
                            </Typography>
                          }
                        />
                      </ListItem>
                    </>
                  )}
                  

                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Status */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                  Status
                </Typography>
                {customer.integrationData && Object.keys(customer.integrationData).length > 0 ? (
                  <List sx={{ py: 0 }}>
                    {customer.integrationData.jira && (
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <JiraIcon sx={{ mr: 2, color: '#0052CC', fontSize: 20 }} />
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 500 }}>
                              Jira Issues
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {customer.integrationData.jira.openIssues || 0} open, {customer.integrationData.jira.criticalIssues || 0} critical
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                    {customer.integrationData.zendesk && (
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ZendeskIcon sx={{ mr: 2, color: '#03363D', fontSize: 20 }} />
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 500 }}>
                              Support Tickets
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {customer.integrationData.zendesk.openTickets || 0} open, {customer.integrationData.zendesk.satisfactionScore || 0}% satisfaction
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                    {customer.integrationData.hubspot && (
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <HubSpotIcon sx={{ mr: 2, color: '#FF7A59', fontSize: 20 }} />
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 500 }}>
                              Sales Pipeline
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {customer.integrationData.hubspot.lifecycleStage || 'Unknown'}, {customer.integrationData.hubspot.openDeals || 0} open deals
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                    {!customer.integrationData.jira && !customer.integrationData.zendesk && !customer.integrationData.hubspot && (
                      <Typography color="textSecondary" sx={{ p: 2, fontStyle: 'italic' }}>
                        Integration data is being processed...
                      </Typography>
                    )}
                  </List>
                ) : (
                  <Typography color="textSecondary" sx={{ p: 2, fontStyle: 'italic' }}>
                    No integration data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Tools & Services */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tools & Services
                </Typography>
                
                {/* Products Section */}
                {customer.productUsage && Array.isArray(customer.productUsage) && customer.productUsage.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                      Products:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {customer.productUsage.map((product, index) => (
                        <Chip 
                          key={index} 
                          label={getProductDisplayName(product)} 
                          variant="outlined" 
                          color="primary"
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {/* Tools Section */}
                {customer.tools && customer.tools.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                      Tools:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {customer.tools.map((tool, index) => (
                        <Chip key={index} label={tool} variant="outlined" size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {/* No content message */}
                {(!customer.productUsage || !Array.isArray(customer.productUsage) || customer.productUsage.length === 0) && 
                 (!customer.tools || customer.tools.length === 0) && (
                  <Typography color="textSecondary">
                    No tools or products configured
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Ticket Information Cards */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                Ticket Overview
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  size="small"
                >
                  Filters
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PlaybookIcon />}
                  onClick={() => setPlaybookOpen(true)}
                  size="small"
                >
                  Playbook
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Advanced Filters */}
          <Grid item xs={12}>
            <Collapse in={filtersOpen}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Advanced Filters
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Search tickets"
                        value={currentFilters.searchText}
                        onChange={(e) => setCurrentFilters({...currentFilters, searchText: e.target.value})}
                        size="small"
                        InputProps={{
                          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Date Range</InputLabel>
                        <Select
                          value={currentFilters.dateRange}
                          onChange={(e) => setCurrentFilters({...currentFilters, dateRange: e.target.value})}
                          label="Date Range"
                        >
                          <MenuItem value="all">All Time</MenuItem>
                          <MenuItem value="today">Today</MenuItem>
                          <MenuItem value="week">Last 7 Days</MenuItem>
                          <MenuItem value="month">Last 30 Days</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={currentFilters.priority}
                          onChange={(e) => setCurrentFilters({...currentFilters, priority: e.target.value})}
                          label="Priority"
                        >
                          <MenuItem value="all">All Priorities</MenuItem>
                          <MenuItem value="Critical">Critical</MenuItem>
                          <MenuItem value="High">High</MenuItem>
                          <MenuItem value="Medium">Medium</MenuItem>
                          <MenuItem value="Low">Low</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={currentFilters.status}
                          onChange={(e) => setCurrentFilters({...currentFilters, status: e.target.value})}
                          label="Status"
                        >
                          <MenuItem value="all">All Statuses</MenuItem>
                          <MenuItem value="Open">Open</MenuItem>
                          <MenuItem value="In Progress">In Progress</MenuItem>
                          <MenuItem value="Resolved">Resolved</MenuItem>
                          <MenuItem value="Closed">Closed</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          startIcon={<SaveIcon />}
                          onClick={saveCurrentSearch}
                          size="small"
                        >
                          Save Search
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<ClearIcon />}
                          onClick={() => setCurrentFilters({
                            dateRange: 'all',
                            priority: 'all',
                            status: 'all',
                            assignee: 'all',
                            searchText: ''
                          })}
                          size="small"
                        >
                          Clear
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {/* Saved Searches */}
                  {savedSearches.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Saved Searches:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {savedSearches.map((search) => (
                          <Chip
                            key={search.id}
                            label={search.name}
                            onClick={() => loadSavedSearch(search)}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Collapse>
          </Grid>

          {/* Critical Tickets */}
          <Grid item xs={12}>
            <Card>
              <CardActionArea onClick={() => handleCardClick([...ticketMetrics.jira.critical, ...ticketMetrics.zendesk.critical], 'Critical Tickets')}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CriticalIcon sx={{ mr: 1, color: 'error.main', fontSize: 28 }} />
                    <Typography variant="h6" color="error.main">
                      Critical Tickets
                    </Typography>
                    <Badge 
                      badgeContent={ticketMetrics.jira.critical.length + ticketMetrics.zendesk.critical.length} 
                      color="error"
                      sx={{ ml: 'auto' }}
                    />
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h2" color="error.main" sx={{ fontWeight: 'bold' }}>
                      {ticketMetrics.jira.critical.length + ticketMetrics.zendesk.critical.length}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      {ticketMetrics.jira.critical.length} Jira • {ticketMetrics.zendesk.critical.length} Zendesk
                    </Typography>
                    <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                      High priority or &gt;7 days old
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          {/* Jira Tickets - Last 30 Days */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardActionArea onClick={() => handleCardClick([...ticketMetrics.jira.open30Days, ...ticketMetrics.jira.closed30Days], 'Jira Tickets - Last 30 Days')}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <JiraIcon sx={{ mr: 1, color: '#0052CC', fontSize: 28 }} />
                    <Typography variant="h6">
                      Jira Tickets - Last 30 Days
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                        <Typography variant="h4" color="error.contrastText">
                          {ticketMetrics.jira.open30Days.length}
                        </Typography>
                        <Typography variant="body2" color="error.contrastText">
                          Open
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="h4" color="success.contrastText">
                          {ticketMetrics.jira.closed30Days.length}
                        </Typography>
                        <Typography variant="body2" color="success.contrastText">
                          Closed
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          {/* Zendesk Tickets - Last 30 Days */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardActionArea onClick={() => handleCardClick([...ticketMetrics.zendesk.open30Days, ...ticketMetrics.zendesk.closed30Days], 'Zendesk Tickets - Last 30 Days')}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ZendeskIcon sx={{ mr: 1, color: '#03363D', fontSize: 28 }} />
                    <Typography variant="h6">
                      Zendesk Tickets - Last 30 Days
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="h4" color="warning.contrastText">
                          {ticketMetrics.zendesk.open30Days.length}
                        </Typography>
                        <Typography variant="body2" color="warning.contrastText">
                          Open
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="h4" color="success.contrastText">
                          {ticketMetrics.zendesk.closed30Days.length}
                        </Typography>
                        <Typography variant="body2" color="success.contrastText">
                          Closed
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          {/* Old Tickets (>90 days) */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardActionArea onClick={() => handleCardClick([...ticketMetrics.jira.olderThan90Days, ...ticketMetrics.zendesk.olderThan90Days], 'Tickets Older Than 90 Days')}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WarningIcon sx={{ mr: 1, color: 'warning.main', fontSize: 28 }} />
                    <Typography variant="h6">
                      Tickets &gt; 90 Days Old
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" color="warning.main">
                      {ticketMetrics.jira.olderThan90Days.length + ticketMetrics.zendesk.olderThan90Days.length}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      {ticketMetrics.jira.olderThan90Days.length} Jira • {ticketMetrics.zendesk.olderThan90Days.length} Zendesk
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          {/* Jira Tickets in Development */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardActionArea onClick={() => handleCardClick(ticketMetrics.jira.inDev, 'Jira Tickets in Development')}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DevIcon sx={{ mr: 1, color: 'info.main', fontSize: 28 }} />
                    <Typography variant="h6">
                      Jira Tickets in Development
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" color="info.main">
                      {ticketMetrics.jira.inDev.length}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      Currently being worked on
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          {/* Customer Satisfaction Score */}
          {customerSatisfaction && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Customer Satisfaction
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h2" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {customerSatisfaction.score}%
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      Based on {customerSatisfaction.totalRatings} ratings
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {customerSatisfaction.recentRatings} ratings in last 30 days
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Recent Activity Timeline */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TimelineIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
                  <Typography variant="h6">
                    Recent Activity
                  </Typography>
                </Box>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {recentActivity.length > 0 ? (
                    <Timeline position="right">
                      {recentActivity.slice(0, 5).map((activity, index) => (
                        <TimelineItem key={activity.id}>
                          <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
                            {formatDuration(activity.date)}
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineDot color={activity.type === 'jira' ? 'primary' : 'secondary'} />
                            {index < recentActivity.length - 1 && <TimelineConnector />}
                          </TimelineSeparator>
                          <TimelineContent sx={{ py: '12px', px: 2 }}>
                            <Typography variant="body2" component="span">
                              {activity.type === 'jira' ? 'Jira' : 'Zendesk'} ticket {activity.action}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {activity.summary}
                            </Typography>
                            <Chip 
                              label={activity.status} 
                              size="small" 
                              sx={{ mt: 0.5 }}
                              color={
                                ['Done', 'Closed', 'Resolved', 'solved', 'closed'].includes(activity.status) 
                                  ? 'success' 
                                  : ['In Progress', 'In Development', 'pending', 'open'].includes(activity.status)
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  ) : (
                    <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                      No recent activity
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* QBR Viewer Dialog */}
      <QBRViewer
        open={qbrOpen}
        onClose={() => setQbrOpen(false)}
        customerId={id}
        customerName={customer?.name}
      />

      {/* Playbook Dialog */}
      <Dialog
        open={playbookOpen}
        onClose={() => setPlaybookOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PlaybookIcon sx={{ mr: 1 }} />
              Customer Success Playbook
            </Box>
            <Button
              variant={playbookEditMode ? "contained" : "outlined"}
              size="small"
              onClick={() => setPlaybookEditMode(!playbookEditMode)}
              startIcon={playbookEditMode ? <SaveIcon /> : <EditIcon />}
            >
              {playbookEditMode ? "Save" : "Edit"}
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Standard Response Templates
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Critical Ticket Response</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {playbookEditMode ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Subject"
                    value={playbookContent.criticalResponse.subject}
                    onChange={(e) => setPlaybookContent({
                      ...playbookContent,
                      criticalResponse: {
                        ...playbookContent.criticalResponse,
                        subject: e.target.value
                      }
                    })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Greeting"
                    value={playbookContent.criticalResponse.greeting}
                    onChange={(e) => setPlaybookContent({
                      ...playbookContent,
                      criticalResponse: {
                        ...playbookContent.criticalResponse,
                        greeting: e.target.value
                      }
                    })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Body"
                    value={playbookContent.criticalResponse.body}
                    onChange={(e) => setPlaybookContent({
                      ...playbookContent,
                      criticalResponse: {
                        ...playbookContent.criticalResponse,
                        body: e.target.value
                      }
                    })}
                    fullWidth
                    multiline
                    rows={8}
                    size="small"
                  />
                  <TextField
                    label="Closing"
                    value={playbookContent.criticalResponse.closing}
                    onChange={(e) => setPlaybookContent({
                      ...playbookContent,
                      criticalResponse: {
                        ...playbookContent.criticalResponse,
                        closing: e.target.value
                      }
                    })}
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                  />
                </Box>
              ) : (
                <>
                  <Typography variant="body2" paragraph>
                    <strong>Subject:</strong> {playbookContent.criticalResponse.subject}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {playbookContent.criticalResponse.greeting}
                  </Typography>
                  <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-line' }}>
                    {playbookContent.criticalResponse.body}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {playbookContent.criticalResponse.closing}
                  </Typography>
                </>
              )}
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Ticket Aging Follow-up</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {playbookEditMode ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Subject"
                    value={playbookContent.agingFollowup.subject}
                    onChange={(e) => setPlaybookContent({
                      ...playbookContent,
                      agingFollowup: {
                        ...playbookContent.agingFollowup,
                        subject: e.target.value
                      }
                    })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Greeting"
                    value={playbookContent.agingFollowup.greeting}
                    onChange={(e) => setPlaybookContent({
                      ...playbookContent,
                      agingFollowup: {
                        ...playbookContent.agingFollowup,
                        greeting: e.target.value
                      }
                    })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Body"
                    value={playbookContent.agingFollowup.body}
                    onChange={(e) => setPlaybookContent({
                      ...playbookContent,
                      agingFollowup: {
                        ...playbookContent.agingFollowup,
                        body: e.target.value
                      }
                    })}
                    fullWidth
                    multiline
                    rows={8}
                    size="small"
                  />
                  <TextField
                    label="Closing"
                    value={playbookContent.agingFollowup.closing}
                    onChange={(e) => setPlaybookContent({
                      ...playbookContent,
                      agingFollowup: {
                        ...playbookContent.agingFollowup,
                        closing: e.target.value
                      }
                    })}
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                  />
                </Box>
              ) : (
                <>
                  <Typography variant="body2" paragraph>
                    <strong>Subject:</strong> {playbookContent.agingFollowup.subject}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {playbookContent.agingFollowup.greeting}
                  </Typography>
                  <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-line' }}>
                    {playbookContent.agingFollowup.body}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {playbookContent.agingFollowup.closing}
                  </Typography>
                </>
              )}
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Satisfaction Survey Follow-up</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {playbookEditMode ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Subject"
                    value={playbookContent.satisfactionFollowup.subject}
                    onChange={(e) => setPlaybookContent({
                      ...playbookContent,
                      satisfactionFollowup: {
                        ...playbookContent.satisfactionFollowup,
                        subject: e.target.value
                      }
                    })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Greeting"
                    value={playbookContent.satisfactionFollowup.greeting}
                    onChange={(e) => setPlaybookContent({
                      ...playbookContent,
                      satisfactionFollowup: {
                        ...playbookContent.satisfactionFollowup,
                        greeting: e.target.value
                      }
                    })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Body"
                    value={playbookContent.satisfactionFollowup.body}
                    onChange={(e) => setPlaybookContent({
                      ...playbookContent,
                      satisfactionFollowup: {
                        ...playbookContent.satisfactionFollowup,
                        body: e.target.value
                      }
                    })}
                    fullWidth
                    multiline
                    rows={8}
                    size="small"
                  />
                  <TextField
                    label="Closing"
                    value={playbookContent.satisfactionFollowup.closing}
                    onChange={(e) => setPlaybookContent({
                      ...playbookContent,
                      satisfactionFollowup: {
                        ...playbookContent.satisfactionFollowup,
                        closing: e.target.value
                      }
                    })}
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                  />
                </Box>
              ) : (
                <>
                  <Typography variant="body2" paragraph>
                    <strong>Subject:</strong> {playbookContent.satisfactionFollowup.subject}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {playbookContent.satisfactionFollowup.greeting}
                  </Typography>
                  <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-line' }}>
                    {playbookContent.satisfactionFollowup.body}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {playbookContent.satisfactionFollowup.closing}
                  </Typography>
                </>
              )}
            </AccordionDetails>
          </Accordion>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Escalation Guidelines
          </Typography>
          {playbookEditMode ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {playbookContent.escalationGuidelines.map((guideline, index) => (
                <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <TextField
                    label="Title"
                    value={guideline.title}
                    onChange={(e) => {
                      const newGuidelines = [...playbookContent.escalationGuidelines];
                      newGuidelines[index].title = e.target.value;
                      setPlaybookContent({
                        ...playbookContent,
                        escalationGuidelines: newGuidelines
                      });
                    }}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Description"
                    value={guideline.description}
                    onChange={(e) => {
                      const newGuidelines = [...playbookContent.escalationGuidelines];
                      newGuidelines[index].description = e.target.value;
                      setPlaybookContent({
                        ...playbookContent,
                        escalationGuidelines: newGuidelines
                      });
                    }}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                </Box>
              ))}
            </Box>
          ) : (
            <List dense>
              {playbookContent.escalationGuidelines.map((guideline, index) => (
                <ListItem key={index}>
                  <ListItemText 
                    primary={guideline.title}
                    secondary={guideline.description}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlaybookOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog
        open={ticketDetailOpen}
        onClose={() => setTicketDetailOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{selectedTicketType}</Typography>
            <Typography variant="body2" color="textSecondary">
              {selectedTickets.length} ticket{selectedTickets.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTickets.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID/Key</TableCell>
                    <TableCell>Summary/Subject</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedTickets.map((ticket, index) => {
                    const isJira = ticket.key !== undefined;
                    const ticketId = isJira ? ticket.key : ticket.id;
                    const summary = isJira ? ticket.summary : ticket.subject;
                    const status = ticket.status;
                    const priority = isJira ? ticket.priority : ticket.priority;
                    const created = isJira ? ticket.created : ticket.created_at;
                    const url = isJira ? ticket.url : ticket.url;

                    return (
                      <TableRow key={`${isJira ? 'jira' : 'zendesk'}-${ticketId}-${index}`}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {isJira ? (
                              <JiraIcon sx={{ mr: 1, color: '#0052CC', fontSize: 16 }} />
                            ) : (
                              <ZendeskIcon sx={{ mr: 1, color: '#03363D', fontSize: 16 }} />
                            )}
                            {ticketId}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>
                          <Typography variant="body2" noWrap title={summary}>
                            {summary}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={status} 
                            size="small" 
                            color={
                              ['Done', 'Closed', 'Resolved', 'solved', 'closed'].includes(status) 
                                ? 'success' 
                                : ['In Progress', 'In Development', 'pending', 'open'].includes(status)
                                ? 'warning'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{priority}</TableCell>
                        <TableCell>{formatDate(created)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {formatDuration(created)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {url && (
                            <IconButton
                              size="small"
                              onClick={() => window.open(url, '_blank')}
                              title="Open in new tab"
                            >
                              <OpenIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
              No tickets found for this category
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTicketDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDetail;
