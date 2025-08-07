import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRefresh = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              An error occurred while loading this component. Please try refreshing the page.
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleRefresh}
            >
              Refresh Page
            </Button>
          </Alert>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box sx={{ mt: 2, textAlign: 'left' }}>
              <Typography variant="h6" gutterBottom>
                Error Details (Development Only):
              </Typography>
              <Typography variant="body2" component="pre" sx={{ 
                bgcolor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.75rem'
              }}>
                {this.state.error.toString()}
              </Typography>
              {this.state.errorInfo && (
                <Typography variant="body2" component="pre" sx={{ 
                  bgcolor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  mt: 1
                }}>
                  {this.state.errorInfo.componentStack}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 