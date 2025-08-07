import React, { useState, useEffect, useCallback } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Alert,
  Box,
  Tooltip
} from '@mui/material';
import {
  ExitToApp,
  SwapHoriz as ImpersonateIcon,
  Assessment as ReportsIcon,
  Stop as StopIcon,
  Dashboard as DashboardIcon,
  Psychology as AIIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';
import UserAvatar from './UserAvatar';

const NavigationHeader = ({ title = "Customer Health Dashboard", currentPage = "" }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationData, setImpersonationData] = useState(null);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    // Check for impersonation state
    const impersonationDataStr = localStorage.getItem('impersonationData');
    const impersonationToken = localStorage.getItem('impersonationToken');
    if (impersonationDataStr && impersonationToken) {
      setIsImpersonating(true);
      setImpersonationData(JSON.parse(impersonationDataStr));
    }

    // Get current user info
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(response.data);
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = useCallback(() => {
    localStorage.clear();
    navigate('/login');
  }, [navigate]);

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
      
      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (err) {
      showError('Failed to stop impersonation');
      console.error('Failed to stop impersonation:', err);
    }
    handleMenuClose();
  }, [showSuccess, showError, navigate]);

  const handleNavigation = useCallback((path) => {
    handleMenuClose();
    navigate(path);
  }, [navigate]);



  return (
    <>
      <AppBar position="static" elevation={0} sx={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {title}
            {currentPage && (
              <Typography component="span" sx={{ ml: 2, opacity: 0.7, fontSize: '0.9rem' }}>
                / {currentPage}
              </Typography>
            )}
          </Typography>

          <IconButton onClick={handleMenuOpen} sx={{ ml: 2, p: 0.5 }}>
            <UserAvatar
              user={currentUser}
              size={40}
              showBadge={true}
              showStatus={true}
              isImpersonating={isImpersonating}
              impersonationData={impersonationData}
              onClick={handleMenuOpen}
            />
          </IconButton>

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
            {/* Navigation Items */}
            <MenuItem onClick={() => handleNavigation('/dashboard')}>
              <ListItemIcon>
                <DashboardIcon fontSize="small" />
              </ListItemIcon>
              Dashboard
            </MenuItem>

            {/* Admin Dashboard - only for admin users */}
            {currentUser?.role === 'admin' && (
              <MenuItem onClick={() => handleNavigation('/admin')}>
                <ListItemIcon>
                  <AdminIcon fontSize="small" />
                </ListItemIcon>
                Admin Dashboard
              </MenuItem>
            )}

            <MenuItem onClick={() => handleNavigation('/reports')}>
              <ListItemIcon>
                <ReportsIcon fontSize="small" />
              </ListItemIcon>
              Reports
            </MenuItem>

            {/* AI Insights - only for admin users */}
            {currentUser?.role === 'admin' && (
              <MenuItem onClick={() => handleNavigation('/ai-insights')}>
                <ListItemIcon>
                  <AIIcon fontSize="small" />
                </ListItemIcon>
                AI Insights
              </MenuItem>
            )}

            <Divider />

            {/* Impersonation Controls - only for admin/authorized users */}
            {currentUser?.role === 'admin' || currentUser?.canImpersonate ? (
              <>
                {isImpersonating ? (
                  <MenuItem onClick={handleStopImpersonation}>
                    <ListItemIcon>
                      <StopIcon fontSize="small" />
                    </ListItemIcon>
                    Stop Impersonation
                  </MenuItem>
                ) : (
                  <MenuItem onClick={() => handleNavigation('/dashboard')}>
                    <ListItemIcon>
                      <ImpersonateIcon fontSize="small" />
                    </ListItemIcon>
                    Start Impersonation
                  </MenuItem>
                )}
                <Divider />
              </>
            ) : null}

            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Impersonation Banner */}
      {isImpersonating && impersonationData && (
        <Alert 
          severity="warning" 
          sx={{ 
            borderRadius: 0,
            '& .MuiAlert-message': {
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }
          }}
        >
          <Box>
            <strong>Impersonation Active:</strong> You are viewing as{' '}
            {impersonationData.targetCustomer ? 
              `${impersonationData.targetCustomer.name} (Customer)` : 
              `${impersonationData.targetUser?.name} (User)`
            }
          </Box>
        </Alert>
      )}
    </>
  );
};

export default NavigationHeader;