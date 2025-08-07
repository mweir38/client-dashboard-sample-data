import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import axios from 'axios';

const ReportingDebug = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState({});

  const testEndpoints = async () => {
    setLoading(true);
    setError('');
    setResults({});

    const token = localStorage.getItem('token');
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    const endpoints = [
          { name: 'Templates', url: 'http://localhost:5000/api/reports/templates', method: 'GET' },
    { name: 'Reports List', url: 'http://localhost:5000/api/reports', method: 'GET' },
    { name: 'Generate Health Report', url: 'http://localhost:5000/api/reports/generate', method: 'POST', data: {
        type: 'customer-health',
        title: 'Test Health Report',
        description: 'Test report generation'
      }},
      { name: 'Generate Dashboard Report', url: 'http://localhost:5000/api/reports/generate', method: 'POST', data: {
        type: 'dashboard',
        title: 'Test Dashboard Report',
        description: 'Test dashboard report generation'
      }}
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing ${endpoint.name}...`);
        let response;
        
        if (endpoint.method === 'GET') {
          response = await axios.get(endpoint.url, config);
        } else {
          response = await axios.post(endpoint.url, endpoint.data, config);
        }
        
        setResults(prev => ({
          ...prev,
          [endpoint.name]: {
            status: 'success',
            data: response.data,
            statusCode: response.status
          }
        }));
        
        console.log(`${endpoint.name} success:`, response.data);
      } catch (err) {
        console.error(`${endpoint.name} failed:`, err);
        setResults(prev => ({
          ...prev,
          [endpoint.name]: {
            status: 'error',
            error: err.response?.data?.msg || err.message,
            statusCode: err.response?.status
          }
        }));
      }
    }

    setLoading(false);
  };

  const renderResult = (name, result) => {
    if (!result) return null;

    return (
      <ListItem key={name}>
        <ListItemText
          primary={
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle1">{name}</Typography>
              {result.status === 'success' ? (
                <Alert severity="success" sx={{ py: 0, px: 1 }}>
                  Success ({result.statusCode})
                </Alert>
              ) : (
                <Alert severity="error" sx={{ py: 0, px: 1 }}>
                  Error ({result.statusCode})
                </Alert>
              )}
            </Box>
          }
          secondary={
            result.status === 'success' ? (
              <Typography variant="body2" color="textSecondary">
                {typeof result.data === 'object' ? 
                  JSON.stringify(result.data, null, 2) : 
                  result.data
                }
              </Typography>
            ) : (
              <Typography variant="body2" color="error">
                {result.error}
              </Typography>
            )
          }
        />
      </ListItem>
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Reporting API Debug
        </Typography>
        
        <Button
          variant="contained"
          onClick={testEndpoints}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={20} /> : 'Test All Endpoints'}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {Object.keys(results).length > 0 && (
          <List>
            {Object.entries(results).map(([name, result]) => renderResult(name, result))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportingDebug; 