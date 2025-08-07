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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  ExitToApp,
  SwapHoriz as ImpersonateIcon,
  Assessment as ReportsIcon,
  Security as PermissionsIcon,
  ExpandMore
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Avatar, Menu, ListItemIcon, Divider, Tooltip } from '@mui/material';

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Dialog states
  const [userDialog, setUserDialog] = useState({ open: false, user: null, isEdit: false });
  const [customerDialog, setCustomerDialog] = useState({ open: false, customer: null, isEdit: false });
  const [permissionsDialog, setPermissionsDialog] = useState({ open: false, user: null });
  
  // Form states
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'user', customerId: '' });
  const [customerForm, setCustomerForm] = useState({ 
    name: '', 
    arr: '', 
    healthScore: '', 
    tools: '',
    productUsage: []
  });
  const [permissionsForm, setPermissionsForm] = useState({
    canViewAllReports: false,
    canGenerateReports: false,
    canExportReports: false,
    canScheduleReports: false,
    canViewOwnReports: true,
    allowedReportTypes: [],
    allowedCategories: [],
    restrictedCustomers: []
  });
  
  const navigate = useNavigate();

  // Product options for chips
  const productOptions = [
    'OC',
    'OC2', 
    'EFB',
    'Flight Planner',
    'PCS',
    'VMO Manager',
    'Other'
  ];

  // Helper function to get product display name
  const getProductDisplayName = (product) => {
    if (!product) return 'Unknown Product';
    if (product.type === 'Other' && product.customName) {
      return product.customName;
    }
    return product.type || product.name || 'Unknown Product';
  };

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const [usersRes, customersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/users', config),
        axios.get('http://localhost:5000/api/customers', config)
      ]);
      
      setUsers(usersRes.data);
      setCustomers(customersRes.data);
    } catch (err) {
      setError('Failed to fetch data');
      if (err.response?.status === 401 || err.response?.status === 403) {
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
    fetchData();
  }, [fetchData, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // User Management Functions
  const handleUserSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if (userDialog.isEdit) {
        await axios.put(`http://localhost:5000/api/users/${userDialog.user._id}`, userForm, config);
        setSuccess('User updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/users', userForm, config);
        setSuccess('User created successfully');
      }

      setUserDialog({ open: false, user: null, isEdit: false });
      setUserForm({ name: '', email: '', password: '', role: 'user', customerId: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to save user');
    }
  };

  const handleUserDelete = async (userId) => {
    const userToDelete = users.find(u => u._id === userId);
    if (!userToDelete) {
      setError('User not found');
      return;
    }

    // Enhanced confirmation with user details
    const confirmMessage = `Are you sure you want to delete the following user?\n\nName: ${userToDelete.name}\nEmail: ${userToDelete.email}\nRole: ${userToDelete.role}\n\nThis action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      await axios.delete(`http://localhost:5000/api/users/${userId}`, config);
      setSuccess(`User "${userToDelete.name}" deleted successfully`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete user');
    }
  };

  const openUserDialog = (user = null) => {
    if (user) {
      setUserForm({ 
        name: user.name, 
        email: user.email, 
        password: '', 
        role: user.role,
        customerId: user.customerId || ''
      });
      setUserDialog({ open: true, user, isEdit: true });
    } else {
      setUserForm({ name: '', email: '', password: '', role: 'user', customerId: '' });
      setUserDialog({ open: true, user: null, isEdit: false });
    }
  };

  // Permissions Management Functions
  const openPermissionsDialog = (user) => {
    const permissions = user.reportingPermissions || {};
    setPermissionsForm({
      canViewAllReports: permissions.canViewAllReports || false,
      canGenerateReports: permissions.canGenerateReports || false,
      canExportReports: permissions.canExportReports || false,
      canScheduleReports: permissions.canScheduleReports || false,
      canViewOwnReports: permissions.canViewOwnReports !== false,
      allowedReportTypes: permissions.allowedReportTypes || [],
      allowedCategories: permissions.allowedCategories || [],
      restrictedCustomers: permissions.restrictedCustomers || []
    });
    setPermissionsDialog({ open: true, user });
  };

  const handlePermissionsSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      await axios.put(
        `http://localhost:5000/api/users/${permissionsDialog.user._id}/permissions`, 
        { reportingPermissions: permissionsForm }, 
        config
      );
      
      setSuccess('Permissions updated successfully');
      setPermissionsDialog({ open: false, user: null });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update permissions');
    }
  };

  // Customer Management Functions
  const handleCustomerSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const customerData = {
        ...customerForm,
        arr: parseFloat(customerForm.arr) || 0,
        healthScore: parseInt(customerForm.healthScore) || 0,
        tools: customerForm.tools.split(',').map(tool => tool.trim()).filter(tool => tool),
        productUsage: (customerForm.productUsage || []).map(product => ({
          name: product.type === 'Other' ? product.customName : product.type,
          type: product.type,
          customName: product.type === 'Other' ? product.customName : undefined
        }))
      };

      if (customerDialog.isEdit) {
        await axios.put(`http://localhost:5000/api/customers/${customerDialog.customer._id}`, customerData, config);
        setSuccess('Customer updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/customers', customerData, config);
        setSuccess('Customer created successfully');
      }

      setCustomerDialog({ open: false, customer: null, isEdit: false });
      setCustomerForm({ name: '', arr: '', healthScore: '', tools: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to save customer');
    }
  };

  const handleCustomerDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      await axios.delete(`http://localhost:5000/api/customers/${customerId}`, config);
      setSuccess('Customer deleted successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete customer');
    }
  };

  const openCustomerDialog = (customer = null) => {
    if (customer) {
      // Handle old productUsage structure (array of strings) and convert to new structure
      let productUsage = [];
      if (customer.productUsage && Array.isArray(customer.productUsage)) {
        productUsage = customer.productUsage.map(item => {
          if (typeof item === 'string') {
            return { name: item, type: item };
          }
          return item;
        });
      }
      
      setCustomerForm({ 
        name: customer.name, 
        arr: customer.arr.toString(), 
        healthScore: customer.healthScore.toString(),
        tools: customer.tools.join(', '),
        productUsage: productUsage
      });
      setCustomerDialog({ open: true, customer, isEdit: true });
    } else {
      setCustomerForm({ name: '', arr: '', healthScore: '', tools: '', productUsage: [] });
      setCustomerDialog({ open: true, customer: null, isEdit: false });
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  // Product management functions
  const handleAddProduct = (productType) => {
    if (productType === 'Other') {
      const customName = prompt('Enter custom product name:');
      if (customName && customName.trim()) {
        setCustomerForm({
          ...customerForm,
          productUsage: [...(customerForm.productUsage || []), { type: 'Other', customName: customName.trim() }]
        });
      }
    } else {
      setCustomerForm({
        ...customerForm,
        productUsage: [...(customerForm.productUsage || []), { type: productType }]
      });
    }
  };

  const handleRemoveProduct = (index) => {
    setCustomerForm({
      ...customerForm,
      productUsage: (customerForm.productUsage || []).filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Admin Dashboard
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Typography>Loading...</Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Button color="inherit" onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            User Dashboard
          </Button>
          <Tooltip title="User Menu">
            <IconButton
              color="inherit"
              onClick={handleAvatarClick}
              sx={{ mr: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                <PersonIcon />
              </Avatar>
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
            <MenuItem onClick={handleImpersonate}>
              <ListItemIcon>
                <ImpersonateIcon fontSize="small" />
              </ListItemIcon>
              Impersonate a Client
            </MenuItem>
            <MenuItem onClick={handleReports}>
              <ListItemIcon>
                <ReportsIcon fontSize="small" />
              </ListItemIcon>
              Reports
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {users.length}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Customers
                  </Typography>
                  <Typography variant="h4">
                    {customers.length}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Admin Users
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {users.filter(u => u.role === 'admin').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total ARR
                </Typography>
                <Typography variant="h4" color="success.main">
                  ${customers.reduce((sum, c) => sum + (c.arr || 0), 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="User Management" />
            <Tab label="Customer Management" />
          </Tabs>

          {/* User Management Tab */}
          {tabValue === 0 && (
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Users</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => openUserDialog()}
                >
                  Add User
                </Button>
              </Box>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role} 
                            color={user.role === 'admin' ? 'primary' : user.role === 'client' ? 'secondary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {user.role === 'client' && user.customerId ? (
                            customers.find(c => c._id === user.customerId)?.name || 'Unknown Customer'
                          ) : (
                            user.role === 'client' ? (
                              <Chip label="Unassigned" color="warning" size="small" />
                            ) : (
                              '-'
                            )
                          )}
                        </TableCell>
                        <TableCell>{new Date(user.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Tooltip title="Edit user">
                            <IconButton onClick={() => openUserDialog(user)} size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Manage permissions">
                            <IconButton onClick={() => openPermissionsDialog(user)} size="small" color="primary">
                              <PermissionsIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete user">
                            <IconButton onClick={() => handleUserDelete(user._id)} size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          )}

          {/* Customer Management Tab */}
          {tabValue === 1 && (
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Customers</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => openCustomerDialog()}
                >
                  Add Customer
                </Button>
              </Box>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>ARR</TableCell>
                      <TableCell>Health Score</TableCell>
                      <TableCell>Tools</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer._id}>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>${customer.arr?.toLocaleString() || 0}</TableCell>
                        <TableCell>
                          <Chip 
                            label={customer.healthScore || 0}
                            color={getHealthScoreColor(customer.healthScore || 0)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {customer.tools?.slice(0, 2).map((tool, index) => (
                            <Chip key={index} label={tool} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                          {customer.tools?.length > 2 && (
                            <Chip label={`+${customer.tools.length - 2}`} size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => openCustomerDialog(customer)} size="small">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleCustomerDelete(customer._id)} size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          )}
        </Card>
      </Container>

      {/* User Dialog */}
      <Dialog open={userDialog.open} onClose={() => setUserDialog({ open: false, user: null, isEdit: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{userDialog.isEdit ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          {!userDialog.isEdit && (
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              sx={{ mb: 2 }}
            />
          )}
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value, customerId: e.target.value !== 'client' ? '' : userForm.customerId })}
              label="Role"
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="client">Client</MenuItem>
            </Select>
          </FormControl>
          
          {/* Customer Assignment - only show for client role */}
          {userForm.role === 'client' && (
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>Assign to Customer</InputLabel>
              <Select
                value={userForm.customerId}
                onChange={(e) => setUserForm({ ...userForm, customerId: e.target.value })}
                label="Assign to Customer"
              >
                <MenuItem value="">
                  <em>Select a customer</em>
                </MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog({ open: false, user: null, isEdit: false })}>
            Cancel
          </Button>
          <Button onClick={handleUserSubmit} variant="contained">
            {userDialog.isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Dialog */}
      <Dialog open={customerDialog.open} onClose={() => setCustomerDialog({ open: false, customer: null, isEdit: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{customerDialog.isEdit ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Company Name"
            fullWidth
            variant="outlined"
            value={customerForm.name}
            onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Annual Recurring Revenue (ARR)"
            type="number"
            fullWidth
            variant="outlined"
            value={customerForm.arr}
            onChange={(e) => setCustomerForm({ ...customerForm, arr: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Health Score (0-100)"
            type="number"
            fullWidth
            variant="outlined"
            value={customerForm.healthScore}
            onChange={(e) => setCustomerForm({ ...customerForm, healthScore: e.target.value })}
            inputProps={{ min: 0, max: 100 }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Tools (comma-separated)"
            fullWidth
            variant="outlined"
            value={customerForm.tools}
            onChange={(e) => setCustomerForm({ ...customerForm, tools: e.target.value })}
            placeholder="e.g., Salesforce, HubSpot, Slack"
            sx={{ mb: 2 }}
          />
          
          {/* Products Section */}
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
            Products
          </Typography>
          
          {/* Product Chips */}
          <Box sx={{ mb: 2 }}>
            {customerForm.productUsage && customerForm.productUsage.map((product, index) => (
              <Chip
                key={index}
                label={getProductDisplayName(product)}
                onDelete={() => handleRemoveProduct(index)}
                sx={{ mr: 1, mb: 1 }}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
          
          {/* Add Product Dropdown */}
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Add Product</InputLabel>
            <Select
              value=""
              onChange={(e) => {
                handleAddProduct(e.target.value);
                e.target.value = '';
              }}
              label="Add Product"
            >
              {productOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomerDialog({ open: false, customer: null, isEdit: false })}>
            Cancel
          </Button>
          <Button onClick={handleCustomerSubmit} variant="contained">
            {customerDialog.isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialog.open} onClose={() => setPermissionsDialog({ open: false, user: null })} maxWidth="md" fullWidth>
        <DialogTitle>
          Manage Reporting Permissions
          {permissionsDialog.user && (
            <Typography variant="body2" color="textSecondary">
              User: {permissionsDialog.user.name} ({permissionsDialog.user.email})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* General Permissions */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">General Permissions</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={permissionsForm.canViewAllReports}
                          onChange={(e) => setPermissionsForm({...permissionsForm, canViewAllReports: e.target.checked})}
                        />
                      }
                      label="Can View All Reports"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={permissionsForm.canGenerateReports}
                          onChange={(e) => setPermissionsForm({...permissionsForm, canGenerateReports: e.target.checked})}
                        />
                      }
                      label="Can Generate Reports"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={permissionsForm.canExportReports}
                          onChange={(e) => setPermissionsForm({...permissionsForm, canExportReports: e.target.checked})}
                        />
                      }
                      label="Can Export Reports"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={permissionsForm.canScheduleReports}
                          onChange={(e) => setPermissionsForm({...permissionsForm, canScheduleReports: e.target.checked})}
                        />
                      }
                      label="Can Schedule Reports"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={permissionsForm.canViewOwnReports}
                          onChange={(e) => setPermissionsForm({...permissionsForm, canViewOwnReports: e.target.checked})}
                        />
                      }
                      label="Can View Own Reports"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Report Types */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Allowed Report Types</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth>
                  <InputLabel>Report Types</InputLabel>
                  <Select
                    multiple
                    value={permissionsForm.allowedReportTypes}
                    onChange={(e) => setPermissionsForm({...permissionsForm, allowedReportTypes: e.target.value})}
                    label="Report Types"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value.replace('-', ' ')} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {[
                      'customer-health',
                      'qbr', 
                      'onboarding',
                      'alerts',
                      'financial',
                      'customer-360',
                      'customer-usage',
                      'customer-support',
                      'dashboard',
                      'portfolio'
                    ].map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </AccordionDetails>
            </Accordion>

            {/* Report Categories */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Allowed Report Categories</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth>
                  <InputLabel>Report Categories</InputLabel>
                  <Select
                    multiple
                    value={permissionsForm.allowedCategories}
                    onChange={(e) => setPermissionsForm({...permissionsForm, allowedCategories: e.target.value})}
                    label="Report Categories"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {[
                      'Customer Health',
                      'QBR', 
                      'Customer Analysis',
                      'Onboarding',
                      'Monitoring',
                      'Financial',
                      'Summary'
                    ].map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </AccordionDetails>
            </Accordion>

            {/* Customer Restrictions */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Customer Access Restrictions</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth>
                  <InputLabel>Restricted Customers (if empty, can access all)</InputLabel>
                  <Select
                    multiple
                    value={permissionsForm.restrictedCustomers}
                    onChange={(e) => setPermissionsForm({...permissionsForm, restrictedCustomers: e.target.value})}
                    label="Restricted Customers"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((customerId) => {
                          const customer = customers.find(c => c._id === customerId);
                          return (
                            <Chip key={customerId} label={customer?.name || 'Unknown'} size="small" />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer._id} value={customer._id}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialog({ open: false, user: null })}>
            Cancel
          </Button>
          <Button onClick={handlePermissionsSubmit} variant="contained">
            Update Permissions
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;
