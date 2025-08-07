import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  AppBar,
  Toolbar,
  Container,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  TextField,
  Select,
  FormControl,
  InputLabel,
  TablePagination,
  Stack
} from '@mui/material';
import {
  BugReport as JiraIcon,
  Support as ZendeskIcon,
  Assessment as KPIIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  ExitToApp,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  SwapHoriz as ImpersonateIcon,
  Assessment as ReportsIcon,
  Close as CloseIcon,
  Stop as StopIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserAvatar from './UserAvatar';

const ClientDashboard = () => {
  const [clientData, setClientData] = useState(null);
  const [jiraTickets, setJiraTickets] = useState([]);
  const [zendeskTickets, setZendeskTickets] = useState([]);
  const [kpis, setKpis] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // User state
  const [currentUser, setCurrentUser] = useState(null);
  
  // Impersonation state
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationData, setImpersonationData] = useState(null);
  
  // Filtering and pagination state
  const [jiraFilters, setJiraFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all'
  });
  const [zendeskFilters, setZendeskFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all'
  });
  const [jiraPage, setJiraPage] = useState(0);
  const [jiraRowsPerPage, setJiraRowsPerPage] = useState(10);
  const [zendeskPage, setZendeskPage] = useState(0);
  const [zendeskRowsPerPage, setZendeskRowsPerPage] = useState(10);
  
  const navigate = useNavigate();

  // Check if user is impersonating
  useEffect(() => {
    // Only show impersonation banner if user is actually impersonating
    const impersonationData = localStorage.getItem('impersonationData');
    const impersonationToken = localStorage.getItem('impersonationToken');
    
    if (impersonationData && impersonationToken) {
      setIsImpersonating(true);
      setImpersonationData(JSON.parse(impersonationData));
    }
  }, []);

  const fetchClientData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // Get user's associated customer data
      const userResponse = await axios.get('http://localhost:5000/api/auth/me', config);
      setCurrentUser(userResponse.data); // Store current user data
      
      let customerId = userResponse.data.customerId; // This might be an object due to populate

      // Handle case where customerId is populated (object) vs just ID (string)
      if (customerId && typeof customerId === 'object') {
        customerId = customerId._id || customerId.id;
      }

      if (!customerId) {
        setError('No customer associated with this account');
        setLoading(false);
        return;
      }

      // Fetch customer details
      const customerResponse = await axios.get(`http://localhost:5000/api/customers/${customerId}`, config);
      setClientData(customerResponse.data);

      // Fetch Jira tickets for this customer
      const jiraResponse = await axios.get(`http://localhost:5000/api/customers/${customerId}/jira-tickets`, config);
      setJiraTickets(jiraResponse.data.tickets || []);

      // Fetch Zendesk tickets for this customer
      const zendeskResponse = await axios.get(`http://localhost:5000/api/customers/${customerId}/tickets`, config);
      setZendeskTickets(zendeskResponse.data.tickets || []);

      // Calculate KPIs
      calculateKPIs(customerResponse.data, jiraResponse.data.tickets || [], zendeskResponse.data.tickets || []);

    } catch (err) {
      console.error('Error fetching client data:', err);
      setError('Failed to fetch dashboard data');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchClientData();
  }, [fetchClientData, navigate]);

  const calculateKPIs = (customer, jiraTickets, zendeskTickets) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Jira KPIs
    const openJiraTickets = jiraTickets.filter(ticket => ticket.status !== 'Done' && ticket.status !== 'Closed').length;
    const criticalJiraTickets = jiraTickets.filter(ticket => ticket.priority === 'Critical' || ticket.priority === 'Highest').length;
    const recentJiraTickets = jiraTickets.filter(ticket => new Date(ticket.created) >= thirtyDaysAgo).length;

    // Zendesk KPIs
    const openZendeskTickets = zendeskTickets.filter(ticket => ticket.status === 'open' || ticket.status === 'pending').length;
    const urgentZendeskTickets = zendeskTickets.filter(ticket => ticket.priority === 'urgent' || ticket.priority === 'high').length;
    const recentZendeskTickets = zendeskTickets.filter(ticket => new Date(ticket.created_at) >= thirtyDaysAgo).length;

    // Response time calculations
    const avgResponseTime = zendeskTickets.length > 0 
      ? zendeskTickets.reduce((sum, ticket) => sum + (ticket.first_response_time || 0), 0) / zendeskTickets.length 
      : 0;

    // Resolution time calculations
    const resolvedJiraTickets = jiraTickets.filter(ticket => ticket.status === 'Done' || ticket.status === 'Closed');
    const avgResolutionTime = resolvedJiraTickets.length > 0
      ? resolvedJiraTickets.reduce((sum, ticket) => sum + (ticket.resolution_time || 0), 0) / resolvedJiraTickets.length
      : 0;

    setKpis({
      totalJiraTickets: jiraTickets.length,
      openJiraTickets,
      criticalJiraTickets,
      recentJiraTickets,
      totalZendeskTickets: zendeskTickets.length,
      openZendeskTickets,
      urgentZendeskTickets,
      recentZendeskTickets,
      avgResponseTime: Math.round(avgResponseTime / 3600), // Convert to hours
      avgResolutionTime: Math.round(avgResolutionTime / 3600), // Convert to hours
      healthScore: customer.healthScore || 0,
      satisfactionScore: customer.integrationData?.zendesk?.satisfactionScore || 0
    });
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchClientData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleStopImpersonation = async () => {
    try {
      const impersonationToken = localStorage.getItem('impersonationToken');
      
      const response = await axios.post('http://localhost:5000/api/impersonation/stop', {}, {
        headers: { Authorization: `Bearer ${impersonationToken}` }
      });

      // Store the original user token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Clear impersonation data
      localStorage.removeItem('impersonationToken');
      localStorage.removeItem('impersonationData');

      // Reset impersonation state
      setIsImpersonating(false);
      setImpersonationData(null);

      // Redirect to original user's dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to stop impersonation:', err);
      // Fallback: clear everything and redirect to login
      localStorage.clear();
      navigate('/login');
    }
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setTicketDialogOpen(true);
  };

  const handleCloseTicketDialog = () => {
    setTicketDialogOpen(false);
    setSelectedTicket(null);
  };

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleImpersonate = () => {
    handleMenuClose();
    // TODO: Implement impersonation functionality
    console.log('Impersonate client clicked');
  };

  const handleReports = () => {
    handleMenuClose();
    // TODO: Navigate to reports page
    console.log('Reports clicked');
  };

  // Filter functions
  const getFilteredJiraTickets = () => {
    return jiraTickets.filter(ticket => {
      const matchesSearch = !jiraFilters.search || 
        ticket.summary?.toLowerCase().includes(jiraFilters.search.toLowerCase()) ||
        ticket.key?.toLowerCase().includes(jiraFilters.search.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(jiraFilters.search.toLowerCase());
      
      const matchesStatus = jiraFilters.status === 'all' || 
        ticket.status?.toLowerCase() === jiraFilters.status.toLowerCase();
      
      const matchesPriority = jiraFilters.priority === 'all' || 
        ticket.priority?.toLowerCase() === jiraFilters.priority.toLowerCase();
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  };

  const getFilteredZendeskTickets = () => {
    return zendeskTickets.filter(ticket => {
      const matchesSearch = !zendeskFilters.search || 
        ticket.subject?.toLowerCase().includes(zendeskFilters.search.toLowerCase()) ||
        ticket.id?.toLowerCase().includes(zendeskFilters.search.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(zendeskFilters.search.toLowerCase());
      
      const matchesStatus = zendeskFilters.status === 'all' || 
        ticket.status?.toLowerCase() === zendeskFilters.status.toLowerCase();
      
      const matchesPriority = zendeskFilters.priority === 'all' || 
        ticket.priority?.toLowerCase() === zendeskFilters.priority.toLowerCase();
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  };

  // Get paginated tickets
  const getPaginatedJiraTickets = () => {
    const filtered = getFilteredJiraTickets();
    const startIndex = jiraPage * jiraRowsPerPage;
    return filtered.slice(startIndex, startIndex + jiraRowsPerPage);
  };

  const getPaginatedZendeskTickets = () => {
    const filtered = getFilteredZendeskTickets();
    const startIndex = zendeskPage * zendeskRowsPerPage;
    return filtered.slice(startIndex, startIndex + zendeskRowsPerPage);
  };

  // Filter handlers
  const handleJiraFilterChange = (field, value) => {
    setJiraFilters(prev => ({ ...prev, [field]: value }));
    setJiraPage(0); // Reset to first page when filtering
  };

  const handleZendeskFilterChange = (field, value) => {
    setZendeskFilters(prev => ({ ...prev, [field]: value }));
    setZendeskPage(0); // Reset to first page when filtering
  };

  const clearJiraFilters = () => {
    setJiraFilters({ search: '', status: 'all', priority: 'all' });
    setJiraPage(0);
  };

  const clearZendeskFilters = () => {
    setZendeskFilters({ search: '', status: 'all', priority: 'all' });
    setZendeskPage(0);
  };

  const getTicketPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'highest':
      case 'urgent':
        return 'error';
      case 'high':
      case 'major':
        return 'warning';
      case 'medium':
      case 'normal':
        return 'info';
      case 'low':
      case 'minor':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTicketStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'in progress':
      case 'pending':
        return 'warning';
      case 'done':
      case 'closed':
      case 'resolved':
        return 'success';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Client Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress size={60} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error || !clientData) {
    return (
      <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Client Dashboard
            </Typography>
            <Button color="inherit" onClick={handleLogout} startIcon={<ExitToApp />}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Unable to load client data'}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {clientData.name} - Client Dashboard
          </Typography>
          
          {/* Impersonation indicator */}
          {isImpersonating && (
            <Alert 
              severity="warning" 
              sx={{ 
                mr: 2, 
                py: 0, 
                px: 1,
                '& .MuiAlert-message': { py: 0.5 }
              }}
            >
              <Box display="flex" alignItems="center">
                <ImpersonateIcon sx={{ mr: 1, fontSize: 16 }} />
                <Typography variant="caption">
                  Impersonating: {impersonationData?.targetCustomer?.name}
                </Typography>
                <Button
                  size="small"
                  color="inherit"
                  onClick={handleStopImpersonation}
                  startIcon={<StopIcon />}
                  sx={{ ml: 1, minWidth: 'auto', p: 0.5 }}
                >
                  Stop
                </Button>
              </Box>
            </Alert>
          )}
          <Tooltip title="Refresh Data">
            <IconButton
              color="inherit"
              onClick={refreshData}
              disabled={refreshing}
              sx={{ mr: 2 }}
            >
              {refreshing ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="User Menu">
            <IconButton
              color="inherit"
              onClick={handleAvatarClick}
              sx={{ mr: 1, p: 0.5 }}
            >
              <UserAvatar
                user={currentUser}
                size={32}
                showBadge={true}
                showStatus={false}
                isImpersonating={isImpersonating}
                impersonationData={impersonationData}
                onClick={handleAvatarClick}
              />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            {/* Only show impersonation and reports for non-client users */}
            {currentUser && currentUser.role !== 'client' && (
              <>
                {!isImpersonating && (
                  <MenuItem onClick={handleImpersonate}>
                    <ListItemIcon>
                      <ImpersonateIcon fontSize="small" />
                    </ListItemIcon>
                    Impersonate a Client
                  </MenuItem>
                )}
                {isImpersonating && (
                  <MenuItem onClick={handleStopImpersonation}>
                    <ListItemIcon>
                      <StopIcon fontSize="small" />
                    </ListItemIcon>
                    Stop Impersonation
                  </MenuItem>
                )}
                <MenuItem onClick={handleReports}>
                  <ListItemIcon>
                    <ReportsIcon fontSize="small" />
                  </ListItemIcon>
                  Reports
                </MenuItem>
                <Divider />
              </>
            )}
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* KPI Overview */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <KPIIcon sx={{ mr: 1 }} />
                Key Performance Indicators
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{kpis.healthScore}/100</Typography>
                      <Typography variant="body2">Health Score</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{kpis.satisfactionScore}%</Typography>
                      <Typography variant="body2">Satisfaction Score</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{kpis.avgResponseTime}h</Typography>
                      <Typography variant="body2">Avg Response Time</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{kpis.avgResolutionTime}h</Typography>
                      <Typography variant="body2">Avg Resolution Time</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Ticket Summary */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <JiraIcon sx={{ mr: 1, color: '#0052CC' }} />
                Jira Tickets Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="primary">{kpis.totalJiraTickets}</Typography>
                    <Typography variant="caption">Total Tickets</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="warning.main">{kpis.openJiraTickets}</Typography>
                    <Typography variant="caption">Open Tickets</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="error.main">{kpis.criticalJiraTickets}</Typography>
                    <Typography variant="caption">Critical Issues</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="info.main">{kpis.recentJiraTickets}</Typography>
                    <Typography variant="caption">Last 30 Days</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ZendeskIcon sx={{ mr: 1, color: '#03363D' }} />
                Support Tickets Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="primary">{kpis.totalZendeskTickets}</Typography>
                    <Typography variant="caption">Total Tickets</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="warning.main">{kpis.openZendeskTickets}</Typography>
                    <Typography variant="caption">Open Tickets</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="error.main">{kpis.urgentZendeskTickets}</Typography>
                    <Typography variant="caption">Urgent Tickets</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="info.main">{kpis.recentZendeskTickets}</Typography>
                    <Typography variant="caption">Last 30 Days</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Jira Tickets Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <JiraIcon sx={{ mr: 1, color: '#0052CC' }} />
                  Jira Issues ({getFilteredJiraTickets().length})
                </Typography>
                <Button
                  startIcon={<ClearIcon />}
                  onClick={clearJiraFilters}
                  disabled={jiraFilters.search === '' && jiraFilters.status === 'all' && jiraFilters.priority === 'all'}
                >
                  Clear Filters
                </Button>
              </Box>
              
              {/* Jira Filters */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
                <TextField
                  label="Search"
                  variant="outlined"
                  size="small"
                  value={jiraFilters.search}
                  onChange={(e) => handleJiraFilterChange('search', e.target.value)}
                  placeholder="Search by key, summary, or description..."
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={jiraFilters.status}
                    label="Status"
                    onChange={(e) => handleJiraFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="in progress">In Progress</MenuItem>
                    <MenuItem value="done">Done</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={jiraFilters.priority}
                    label="Priority"
                    onChange={(e) => handleJiraFilterChange('priority', e.target.value)}
                  >
                    <MenuItem value="all">All Priority</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Issue Key</TableCell>
                      <TableCell>Summary</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getPaginatedJiraTickets().map((ticket) => (
                      <TableRow key={ticket.key}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {ticket.key}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {ticket.summary}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ticket.status}
                            color={getTicketStatusColor(ticket.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ticket.priority}
                            color={getTicketPriorityColor(ticket.priority)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(ticket.created)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleTicketClick(ticket)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Jira Pagination */}
              <TablePagination
                component="div"
                count={getFilteredJiraTickets().length}
                page={jiraPage}
                onPageChange={(event, newPage) => setJiraPage(newPage)}
                rowsPerPage={jiraRowsPerPage}
                onRowsPerPageChange={(event) => {
                  setJiraRowsPerPage(parseInt(event.target.value, 10));
                  setJiraPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
              
              {getFilteredJiraTickets().length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  {jiraTickets.length === 0 ? 'No Jira tickets found for your account' : 'No tickets match the current filters'}
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Zendesk Tickets Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <ZendeskIcon sx={{ mr: 1, color: '#03363D' }} />
                  Support Tickets ({getFilteredZendeskTickets().length})
                </Typography>
                <Button
                  startIcon={<ClearIcon />}
                  onClick={clearZendeskFilters}
                  disabled={zendeskFilters.search === '' && zendeskFilters.status === 'all' && zendeskFilters.priority === 'all'}
                >
                  Clear Filters
                </Button>
              </Box>
              
              {/* Zendesk Filters */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
                <TextField
                  label="Search"
                  variant="outlined"
                  size="small"
                  value={zendeskFilters.search}
                  onChange={(e) => handleZendeskFilterChange('search', e.target.value)}
                  placeholder="Search by ID, subject, or description..."
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={zendeskFilters.status}
                    label="Status"
                    onChange={(e) => handleZendeskFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="solved">Solved</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={zendeskFilters.priority}
                    label="Priority"
                    onChange={(e) => handleZendeskFilterChange('priority', e.target.value)}
                  >
                    <MenuItem value="all">All Priority</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ticket ID</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getPaginatedZendeskTickets().map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            #{ticket.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {ticket.subject}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ticket.status}
                            color={getTicketStatusColor(ticket.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ticket.priority}
                            color={getTicketPriorityColor(ticket.priority)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(ticket.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleTicketClick(ticket)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Zendesk Pagination */}
              <TablePagination
                component="div"
                count={getFilteredZendeskTickets().length}
                page={zendeskPage}
                onPageChange={(event, newPage) => setZendeskPage(newPage)}
                rowsPerPage={zendeskRowsPerPage}
                onRowsPerPageChange={(event) => {
                  setZendeskRowsPerPage(parseInt(event.target.value, 10));
                  setZendeskPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
              
              {getFilteredZendeskTickets().length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  {zendeskTickets.length === 0 ? 'No support tickets found for your account' : 'No tickets match the current filters'}
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Ticket Description Dialog */}
      <Dialog
        open={ticketDialogOpen}
        onClose={handleCloseTicketDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Description
          </Typography>
          <IconButton onClick={handleCloseTicketDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedTicket.key || `#${selectedTicket.id}`}: {selectedTicket.summary || selectedTicket.subject}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={selectedTicket.status}
                  color={getTicketStatusColor(selectedTicket.status)}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={selectedTicket.priority}
                  color={getTicketPriorityColor(selectedTicket.priority)}
                  size="small"
                />
              </Box>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 2 }}>
                {selectedTicket.description || 'No description available for this ticket.'}
              </Typography>
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  Created: {formatDate(selectedTicket.created || selectedTicket.created_at)}
                </Typography>
                {selectedTicket.assignee && (
                  <Typography variant="body2" color="text.secondary">
                    Assignee: {selectedTicket.assignee}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTicketDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientDashboard;
