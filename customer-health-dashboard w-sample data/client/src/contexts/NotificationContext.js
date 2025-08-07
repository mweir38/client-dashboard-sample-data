import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const timeoutRefs = useRef(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutRefs.current.clear();
    };
  }, []);

  const hideNotification = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, open: false }
          : notification
      )
    );

    // Clear existing timeout for this notification
    if (timeoutRefs.current.has(id)) {
      clearTimeout(timeoutRefs.current.get(id));
      timeoutRefs.current.delete(id);
    }

    // Remove from array after animation
    const removeTimeoutId = setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      timeoutRefs.current.delete(id);
    }, 300);

    timeoutRefs.current.set(id, removeTimeoutId);
  }, []);

  const showNotification = useCallback((message, severity = 'info', title = null, duration = 6000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      severity,
      title,
      duration,
      open: true
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-hide notification after duration
    if (duration > 0) {
      const autoHideTimeoutId = setTimeout(() => {
        hideNotification(id);
      }, duration);
      
      timeoutRefs.current.set(id, autoHideTimeoutId);
    }

    return id;
  }, [hideNotification]);

  const showSuccess = useCallback((message, title = 'Success') => {
    return showNotification(message, 'success', title);
  }, [showNotification]);

  const showError = useCallback((message, title = 'Error') => {
    return showNotification(message, 'error', title, 8000);
  }, [showNotification]);

  const showWarning = useCallback((message, title = 'Warning') => {
    return showNotification(message, 'warning', title, 7000);
  }, [showNotification]);

  const showInfo = useCallback((message, title = 'Information') => {
    return showNotification(message, 'info', title);
  }, [showNotification]);

  // Specific notification types for the application
  const showQBRDue = useCallback((customerName, quarter) => {
    return showWarning(
      `QBR for ${customerName} is due for ${quarter}. Click to generate the report.`,
      'QBR Due',
      10000
    );
  }, [showWarning]);

  const showDataSyncFailure = useCallback((service, error) => {
    return showError(
      `Failed to sync data from ${service}: ${error}. Please check your integration settings.`,
      'Data Sync Failed',
      12000
    );
  }, [showError]);

  const showQBRGenerated = useCallback((customerName, quarter) => {
    return showSuccess(
      `QBR for ${customerName} (${quarter}) has been successfully generated.`,
      'QBR Generated'
    );
  }, [showSuccess]);

  const showExportComplete = useCallback((fileName) => {
    return showSuccess(
      `Report has been exported as ${fileName}`,
      'Export Complete'
    );
  }, [showSuccess]);

  const showOnboardingUpdate = useCallback((customerName, milestone) => {
    return showInfo(
      `${customerName} onboarding: ${milestone} completed`,
      'Onboarding Progress'
    );
  }, [showInfo]);

  const value = {
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showQBRDue,
    showDataSyncFailure,
    showQBRGenerated,
    showExportComplete,
    showOnboardingUpdate
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Render notifications */}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={notification.open}
          onClose={() => hideNotification(notification.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: 8 }}
        >
          <Alert
            onClose={() => hideNotification(notification.id)}
            severity={notification.severity}
            variant="filled"
            sx={{ minWidth: '300px' }}
          >
            {notification.title && (
              <AlertTitle>{notification.title}</AlertTitle>
            )}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};