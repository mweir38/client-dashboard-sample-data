import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,

  IconButton,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  SwapHoriz as ImpersonateIcon,
  Close as CloseIcon,

} from '@mui/icons-material';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';

const ImpersonationModal = ({ open, onClose, onImpersonationStart }) => {
  const [step, setStep] = useState('select'); // 'select', 'reason', 'confirm'
  const [targetType, setTargetType] = useState('user'); // 'user' or 'customer'
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [availableTargets, setAvailableTargets] = useState({ users: [], customers: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [impersonationHistory, setImpersonationHistory] = useState([]);
  const [user, setUser] = useState(null);
  
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const fetchAvailableTargets = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Debug logging
      console.log('🔍 Debug: Fetching available targets...');
      console.log('🔍 Debug: Token exists:', !!token);
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        showError('No authentication token found. Please log in again.');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/impersonation/available-targets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('🔍 Debug: Response received:', response.data);
      setAvailableTargets(response.data);
    } catch (err) {
      console.error('🔍 Debug: Error details:', err);
      console.error('🔍 Debug: Error response:', err.response?.data);
      console.error('🔍 Debug: Error status:', err.response?.status);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        showError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to impersonate users.');
        showError('You do not have permission to impersonate users.');
      } else {
        setError('Failed to fetch available targets');
        showError('Failed to fetch available targets');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchImpersonationHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/impersonation/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImpersonationHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch impersonation history:', err);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchAvailableTargets();
      fetchImpersonationHistory();
    }
  }, [open, fetchAvailableTargets, fetchImpersonationHistory]);

  const handleStartImpersonation = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const payload = {
        reason: reason || 'Support request'
      };

      if (targetType === 'user') {
        payload.targetUserId = targetId;
      } else {
        payload.targetCustomerId = targetId;
      }

      const response = await axios.post('http://localhost:5000/api/impersonation/start', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Store impersonation token
      localStorage.setItem('impersonationToken', response.data.impersonationToken);
      localStorage.setItem('originalToken', token);
      localStorage.setItem('impersonationData', JSON.stringify(response.data.impersonationData));

      showSuccess('Impersonation started successfully');
      onImpersonationStart(response.data.impersonationData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to start impersonation');
      showError(err.response?.data?.msg || 'Failed to start impersonation');
    } finally {
      setLoading(false);
    }
  };



  const getSelectedTarget = () => {
    if (targetType === 'user') {
      return availableTargets.users.find(user => user.id === targetId);
    } else {
      return availableTargets.customers.find(customer => customer.id === targetId);
    }
  };

  const renderTargetSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Target for Impersonation
      </Typography>
      
      <FormControl fullWidth margin="normal">
        <InputLabel>Target Type</InputLabel>
        <Select
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
          label="Target Type"
        >
          <MenuItem value="user">
            <Box display="flex" alignItems="center">
              <PersonIcon sx={{ mr: 1 }} />
              User
            </Box>
          </MenuItem>
          <MenuItem value="customer">
            <Box display="flex" alignItems="center">
              <BusinessIcon sx={{ mr: 1 }} />
              Customer
            </Box>
          </MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel>Select Target</InputLabel>
        <Select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          label="Select Target"
        >
          {targetType === 'user' ? (
            availableTargets.users.map(user => (
              <MenuItem key={user.id} value={user.id}>
                <Box display="flex" justifyContent="space-between" width="100%">
                  <Box>
                    <Typography variant="body1">{user.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {user.email} • {user.role}
                    </Typography>
                  </Box>
                  {user.customer && (
                    <Chip 
                      label={user.customer.name} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  )}
                </Box>
              </MenuItem>
            ))
          ) : (
            availableTargets.customers.map(customer => (
              <MenuItem key={customer.id} value={customer.id}>
                <Box display="flex" justifyContent="space-between" width="100%">
                  <Box>
                    <Typography variant="body1">{customer.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {user?.role === 'admin' ? 
                        `ARR: ${customer.arr?.toLocaleString()} • Health: ${customer.healthScore}/10` :
                        `Health: ${customer.healthScore}/10`
                      }
                    </Typography>
                  </Box>
                  <Chip 
                    label={customer.status} 
                    size="small" 
                    color={customer.healthScore >= 7 ? 'success' : customer.healthScore >= 4 ? 'warning' : 'error'}
                  />
                </Box>
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
    </Box>
  );

  const renderReasonInput = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Reason for Impersonation
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={3}
        label="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Please provide a reason for impersonating this user/customer..."
        margin="normal"
      />
    </Box>
  );

  const renderConfirmation = () => {
    const target = getSelectedTarget();
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Confirm Impersonation
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 2 }}>
          You are about to impersonate {targetType === 'user' ? 'a user' : 'a customer'}. 
          This action will be logged and monitored.
        </Alert>

        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Target Details:
          </Typography>
          {targetType === 'user' ? (
            <Box>
              <Typography><strong>Name:</strong> {target?.name}</Typography>
              <Typography><strong>Email:</strong> {target?.email}</Typography>
              <Typography><strong>Role:</strong> {target?.role}</Typography>
              {target?.customer && (
                <Typography><strong>Customer:</strong> {target.customer.name}</Typography>
              )}
            </Box>
          ) : (
            <Box>
              <Typography><strong>Name:</strong> {target?.name}</Typography>
              {/* ARR - only for admin users */}
              {user?.role === 'admin' && (
                <Typography><strong>ARR:</strong> ${target?.arr?.toLocaleString()}</Typography>
              )}
              <Typography><strong>Health Score:</strong> {target?.healthScore}/10</Typography>
              <Typography><strong>Status:</strong> {target?.status}</Typography>
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Reason:
          </Typography>
          <Typography>{reason || 'Support request'}</Typography>
        </Box>
      </Box>
    );
  };

  const renderHistory = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Recent Impersonation History
      </Typography>
      
      {impersonationHistory.length === 0 ? (
        <Typography color="textSecondary">No recent impersonation history</Typography>
      ) : (
        <List>
          {impersonationHistory.slice(0, 5).map((record, index) => (
            <ListItem key={index} divider>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center">
                    <ImpersonateIcon sx={{ mr: 1, fontSize: 20 }} />
                    {record.impersonatedUser ? 
                      `Impersonated ${record.impersonatedUser.name}` :
                      `Impersonated ${record.impersonatedCustomer?.name}`
                    }
                  </Box>
                }
                secondary={
                  <React.Fragment>
                    <Typography variant="caption" display="block">
                      {new Date(record.impersonatedAt).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Reason: {record.reason}
                    </Typography>
                    {record.duration && (
                      <Typography variant="caption" display="block">
                        Duration: {record.duration} minutes
                      </Typography>
                    )}
                  </React.Fragment>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <ImpersonateIcon sx={{ mr: 1 }} />
            User Impersonation
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {step === 'select' && renderTargetSelection()}
            {step === 'reason' && renderReasonInput()}
            {step === 'confirm' && renderConfirmation()}
            
            <Divider sx={{ my: 3 }} />
            {renderHistory()}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        
        {step === 'select' && (
          <Button
            variant="contained"
            onClick={() => setStep('reason')}
            disabled={!targetId || loading}
            startIcon={<ImpersonateIcon />}
          >
            Next
          </Button>
        )}
        
        {step === 'reason' && (
          <>
            <Button onClick={() => setStep('select')} disabled={loading}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={() => setStep('confirm')}
              disabled={loading}
            >
              Next
            </Button>
          </>
        )}
        
        {step === 'confirm' && (
          <>
            <Button onClick={() => setStep('reason')} disabled={loading}>
              Back
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleStartImpersonation}
              disabled={loading}
              startIcon={<ImpersonateIcon />}
            >
              Start Impersonation
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImpersonationModal; 