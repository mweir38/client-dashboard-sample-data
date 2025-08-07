import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Collapse,
  Avatar,
  Menu,
  ListItemIcon,
  Divider,
  Badge
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  BugReport as JiraIcon,
  Support as ZendeskIcon,
  Business as HubSpotIcon,
  Star as StarIcon,
  AccountBalance as CompanyIcon,
  AdminPanelSettings,
  ExitToApp,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  SwapHoriz as ImpersonateIcon,
  Assessment as ReportsIcon,
  Stop as StopIcon,
  Psychology as AIIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import InsightsBox from './InsightsBox';
import ImpersonationModal from './ImpersonationModal';
import UserAvatar from './UserAvatar';
import { useNotification } from '../contexts/NotificationContext';

const Dashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [refreshingHealth, setRefreshingHealth] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Filtering and sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [healthFilter, setHealthFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Impersonation state
  const [impersonationModalOpen, setImpersonationModalOpen] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationData, setImpersonationData] = useState(null);
  
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);
  const { showSuccess, showError } = useNotification();

  // Helper function to get product display name
  const getProductDisplayName = (product) => {
    if (!product) return 'Unknown Product';
    if (product.type === 'Other' && product.customName) {
      return product.customName;
    }
    return product.type || product.name || 'Unknown Product';
  };

  // Check if user is impersonating
  useEffect(() => {
    const impersonationData = localStorage.getItem('impersonationData');
    if (impersonationData) {
      setIsImpersonating(true);
      setImpersonationData(JSON.parse(impersonationData));
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortControllerRef.current.signal
      };
      
      const res = await axios.get('http://localhost:5000/api/customers', config);
      setCustomers(res.data);
      setError('');
    } catch (err) {
      if (err.name === 'AbortError') {
        return; // Request was cancelled
      }
      setError('Failed to fetch customers');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) {
      navigate('/login');
      return;
    }
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchCustomers();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCustomers, navigate]);

  // Memoized filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesHealth = healthFilter === 'all' || 
        (healthFilter === 'healthy' && customer.healthScore >= 7) ||
        (healthFilter === 'at-risk' && customer.healthScore >= 4 && customer.healthScore < 7) ||
        (healthFilter === 'critical' && customer.healthScore < 4);
      
      return matchesSearch && matchesHealth;
    });
  }, [customers, searchTerm, healthFilter]);

  // Memoized statistics
  const dashboardStats = useMemo(() => {
    const total = customers.length;
    const healthy = customers.filter(c => c.healthScore >= 7).length;
    const atRisk = customers.filter(c => c.healthScore >= 4 && c.healthScore < 7).length;
    const critical = customers.filter(c => c.healthScore < 4).length;
    const highPriority = customers.filter(c => c.arr >= 100000).length;
    
    return { total, healthy, atRisk, critical, highPriority };
  }, [customers]);

  const refreshAllHealthScores = useCallback(async () => {
    setRefreshingHealth(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      await axios.post('http://localhost:5000/api/customers/refresh-all-health', {}, config);
      await fetchCustomers(); // Refresh the data
    } catch (err) {
      setError('Failed to refresh health scores');
    } finally {
      setRefreshingHealth(false);
    }
  }, [fetchCustomers]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate]);

  const handleAvatarClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleImpersonate = useCallback(() => {
    handleMenuClose();
    setImpersonationModalOpen(true);
  }, [handleMenuClose]);

  const handleStopImpersonation = useCallback(async () => {
    try {
      const impersonationToken = localStorage.getItem('impersonationToken');
      
      const response = await axios.post('http://localhost:5000/api/impersonation/stop', {}, {
        headers: { Authorization: `Bearer ${impersonationToken}` }
      });

      // Restore original token
      localStorage.removeItem('impersonationToken');
      localStorage.removeItem('impersonationData');
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      setIsImpersonating(false);
      setImpersonationData(null);
      showSuccess(`Impersonation stopped. Duration: ${response.data.impersonationDuration} minutes`);
      window.location.reload(); // Refresh to update user context
    } catch (err) {
      showError('Failed to stop impersonation');
    }
  }, [showSuccess, showError]);

  const handleReports = useCallback(() => {
    handleMenuClose();
    navigate('/reports');
  }, [handleMenuClose, navigate]);

  const handleImpersonationStart = useCallback((data) => {
    setIsImpersonating(true);
    setImpersonationData(data);
    showSuccess('Impersonation started successfully');
    
    // If impersonating a customer or a user with customerId, redirect to client dashboard
    if (data.targetCustomer || (data.targetUser && data.targetUser.customerId)) {
      navigate('/client-dashboard');
    }
  }, [showSuccess, navigate]);

  const getHealthScoreColor = useCallback((score) => {
    if (score >= 7) return 'success';
    if (score >= 4) return 'warning';
    return 'error';
  }, []);

  const getHealthScoreLabel = useCallback((score) => {
    if (score >= 7) return 'Healthy';
    if (score >= 4) return 'At Risk';
    return 'Critical';
  }, []);

  const isHighPriorityClient = useCallback((arr) => {
    return arr >= 100000;
  }, []);

  const getPriorityIcon = useCallback((arr) => {
    if (isHighPriorityClient(arr)) {
      const tooltipText = user?.role === 'admin' 
        ? `High Priority Client - ARR: $${arr.toLocaleString()}`
        : 'High Priority Client';
      
      return (
        <Tooltip title={tooltipText}>
          <StarIcon sx={{ color: 'gold', fontSize: 20 }} />
        </Tooltip>
      );
    }
    return null;
  }, [isHighPriorityClient, user?.role]);

  const renderIntegrationStatus = useCallback((customer) => {
    const integrations = [];
    
    if (customer.integrations?.jira) {
      integrations.push(
        <Tooltip key="jira" title="Jira Integration Active">
          <JiraIcon sx={{ color: 'primary.main', fontSize: 16 }} />
        </Tooltip>
      );
    }
    
    if (customer.integrations?.zendesk) {
      integrations.push(
        <Tooltip key="zendesk" title="Zendesk Integration Active">
          <ZendeskIcon sx={{ color: 'primary.main', fontSize: 16 }} />
        </Tooltip>
      );
    }
    
    if (customer.integrations?.hubspot) {
      integrations.push(
        <Tooltip key="hubspot" title="HubSpot Integration Active">
          <HubSpotIcon sx={{ color: 'primary.main', fontSize: 16 }} />
        </Tooltip>
      );
    }
    
    return integrations;
  }, []);

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
                          <CompanyIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Customer Health Dashboard
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
                  Impersonating: {impersonationData?.targetUser?.name || impersonationData?.targetCustomer?.name}
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
          
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              color="inherit"
              startIcon={<ReportsIcon />}
              onClick={() => navigate('/reports')}
            >
              Reports
            </Button>
            {/* AI Insights - only for admin users */}
            {user?.role === 'admin' && (
              <Button
                color="inherit"
                startIcon={<AIIcon />}
                onClick={() => navigate('/ai-insights')}
              >
                AI Insights
              </Button>
            )}
            
            <Tooltip title="User Menu">
              <IconButton
                color="inherit"
                onClick={handleAvatarClick}
                sx={{ ml: 1, p: 0.5 }}
              >
                <UserAvatar
                  user={user}
                  size={32}
                  showBadge={true}
                  showStatus={true}
                  isImpersonating={isImpersonating}
                  impersonationData={impersonationData}
                  onClick={handleAvatarClick}
                />
              </IconButton>
            </Tooltip>
          </Box>
          
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
            <ListItem>
              <ListItemText
                primary={user?.name || 'User'}
                secondary={user?.email || 'user@example.com'}
              />
            </ListItem>
            <Divider />
            {user?.role === 'admin' && (
              <ListItem button onClick={() => navigate('/admin')}>
                <ListItemIcon>
                  <AdminPanelSettings />
                </ListItemIcon>
                <ListItemText primary="Admin Panel" />
              </ListItem>
            )}
            {(user?.canImpersonate || user?.role === 'admin') && (
              <ListItem button onClick={handleImpersonate}>
                <ListItemIcon>
                  <ImpersonateIcon />
                </ListItemIcon>
                <ListItemText primary="Impersonate User" />
              </ListItem>
            )}
            <ListItem button onClick={handleReports}>
              <ListItemIcon>
                <ReportsIcon />
              </ListItemIcon>
              <ListItemText primary="Reports" />
            </ListItem>
            <Divider />
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Dashboard Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Customers
                </Typography>
                <Typography variant="h4" color="primary">
                  {dashboardStats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Healthy
                </Typography>
                <Typography variant="h4" color="success.main">
                  {dashboardStats.healthy}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  At Risk
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {dashboardStats.atRisk}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Critical
                </Typography>
                <Typography variant="h4" color="error.main">
                  {dashboardStats.critical}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <TextField
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="outlined"
              startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={refreshAllHealthScores}
              disabled={refreshingHealth || user?.role !== 'admin'}
            >
              {refreshingHealth ? <CircularProgress size={20} /> : 'Refresh Health'}
            </Button>
          </Box>

          <Collapse in={showFilters}>
            <Box display="flex" gap={2} alignItems="center">
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Health Filter</InputLabel>
                <Select
                  value={healthFilter}
                  onChange={(e) => setHealthFilter(e.target.value)}
                  label="Health Filter"
                >
                  <MenuItem value="all">All Customers</MenuItem>
                  <MenuItem value="healthy">Healthy (7-10)</MenuItem>
                  <MenuItem value="at-risk">At Risk (4-6)</MenuItem>
                  <MenuItem value="critical">Critical (1-3)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Collapse>
        </Paper>

        {/* Customer List */}
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredCustomers.map((customer) => (
              <Grid item xs={12} sm={6} md={4} key={customer._id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 }
                  }}
                  onClick={() => navigate(`/customers/${customer._id}`)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="div">
                        {customer.name}
                      </Typography>
                      {getPriorityIcon(customer.arr)}
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip
                        label={`${customer.healthScore}/10`}
                        color={getHealthScoreColor(customer.healthScore)}
                        size="small"
                      />
                      <Typography variant="body2" color="textSecondary">
                        {getHealthScoreLabel(customer.healthScore)}
                      </Typography>
                    </Box>
                    
                    {/* ARR - only for admin users */}
                    {user?.role === 'admin' && (
                      <Typography variant="body2" color="textSecondary" mb={1}>
                        ARR: ${customer.arr?.toLocaleString() || '0'}
                      </Typography>
                    )}
                    
                    {/* Product Chips */}
                    {customer.productUsage && Array.isArray(customer.productUsage) && customer.productUsage.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                          Products:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {customer.productUsage.map((product, index) => (
                            <Chip
                              key={index}
                              label={getProductDisplayName(product)}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: '20px' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      {renderIntegrationStatus(customer)}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Insights Box */}
        <Box sx={{ mt: 4 }}>
          <InsightsBox customers={customers} />
        </Box>
      </Container>

      {/* Impersonation Modal */}
      <ImpersonationModal
        open={impersonationModalOpen}
        onClose={() => setImpersonationModalOpen(false)}
        onImpersonationStart={handleImpersonationStart}
      />
    </Box>
  );
};

export default Dashboard;