import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  AlertTitle,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Feedback as FeedbackIcon,
  BugReport as BugReportIcon,
  Support as SupportIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import axios from 'axios';

const InsightsBox = ({ user }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const res = await axios.get('http://localhost:5000/api/alerts/dashboard-insights', config);
      setInsights(res.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch insights');
      console.error('Error fetching insights:', err);
    }
    setLoading(false);
  };

  const refreshInsights = async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
  };

  const getSeverityIcon = (type, severity) => {
    const iconProps = { fontSize: 'small' };
    
    switch (severity || type) {
      case 'critical':
        return <ErrorIcon color="error" {...iconProps} />;
      case 'high':
        return <WarningIcon color="warning" {...iconProps} />;
      case 'medium':
        return <InfoIcon color="info" {...iconProps} />;
      case 'renewal_risk':
        return <ScheduleIcon color="warning" {...iconProps} />;
      case 'negative_feedback':
        return <FeedbackIcon color="error" {...iconProps} />;
      case 'critical_issues':
        return <BugReportIcon color="error" {...iconProps} />;
      case 'support_overload':
        return <SupportIcon color="warning" {...iconProps} />;
      case 'sales_stagnation':
        return <BusinessIcon color="info" {...iconProps} />;
      default:
        return <InfoIcon color="info" {...iconProps} />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" p={2}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading insights...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
          <Box display="flex" alignItems="center" flex={1}>
            <Typography variant="h6" component="div">
              Smart Insights & Alerts
            </Typography>
            <Tooltip title={`Total: ${insights?.summary?.criticalAlerts || 0} Critical + ${insights?.summary?.highAlerts || 0} High + ${insights?.summary?.mediumAlerts || 0} Medium + ${insights?.summary?.lowAlerts || 0} Low severity alerts`}>
              <Chip 
                label={`${insights?.summary?.totalAlerts || 0} active`}
                size="small" 
                color={insights?.summary?.criticalAlerts > 0 ? 'error' : 'default'}
                sx={{ ml: 2 }}
              />
            </Tooltip>
          </Box>
          <Box>
            <Tooltip title="Refresh insights">
              <IconButton 
                onClick={refreshInsights} 
                disabled={refreshing}
                size="small"
              >
                {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            <IconButton 
              onClick={() => setExpanded(!expanded)}
              size="small"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          {insights?.summary?.criticalAlerts > 0 && (
            <Chip
              icon={<ErrorIcon />}
              label={`${insights.summary.criticalAlerts} Critical`}
              color="error"
              size="small"
            />
          )}
          {insights?.summary?.highAlerts > 0 && (
            <Chip
              icon={<WarningIcon />}
              label={`${insights.summary.highAlerts} High`}
              color="warning"
              size="small"
            />
          )}
          {insights?.summary?.mediumAlerts > 0 && (
            <Chip
              icon={<InfoIcon />}
              label={`${insights.summary.mediumAlerts} Medium`}
              color="info"
              size="small"
            />
          )}
          {insights?.summary?.actionRequired > 0 && (
            <Tooltip title="Alerts that require immediate follow-up actions (may overlap with severity levels above)">
              <Chip
                icon={<ScheduleIcon />}
                label={`${insights.summary.actionRequired} Need Action`}
                color="secondary"
                size="small"
                variant="outlined"
              />
            </Tooltip>
          )}
          {insights?.summary?.totalAlerts === 0 && (
            <Chip
              icon={<CheckCircleIcon />}
              label="All Clear"
              color="success"
              size="small"
            />
          )}
        </Box>

        <Collapse in={expanded}>
          {/* Key Insights */}
          {insights?.insights && insights.insights.length > 0 ? (
            <List dense>
              {insights.insights.slice(0, 5).map((insight, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getSeverityIcon(insight.type, insight.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={insight.title}
                    secondary={insight.description}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <Chip
                    label={insight.count}
                    size="small"
                    color={getSeverityColor(insight.severity)}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box textAlign="center" py={2}>
              <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body2" color="textSecondary">
                No active alerts - all customers appear healthy
              </Typography>
            </Box>
          )}

          {/* Smart Analytics */}
          {insights?.analytics && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Smart Analytics
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                {insights.analytics.behaviorScore && (
                  <Chip
                    icon={<PsychologyIcon />}
                    label={`${insights.analytics.behaviorScore.category} Behavior`}
                    size="small"
                    color={
                      insights.analytics.behaviorScore.category === 'Champion' ? 'success' :
                      insights.analytics.behaviorScore.category === 'Advocate' ? 'primary' :
                      insights.analytics.behaviorScore.category === 'Passive' ? 'default' :
                      insights.analytics.behaviorScore.category === 'At Risk' ? 'warning' : 'error'
                    }
                    variant="outlined"
                  />
                )}
                {insights.analytics.trendDirection && (
                  <Chip
                    icon={
                      insights.analytics.trendDirection.includes('improving') ? 
                        <TrendingUpIcon /> : 
                        insights.analytics.trendDirection.includes('declining') ? 
                          <TrendingDownIcon /> : <SpeedIcon />
                    }
                    label={insights.analytics.trendDirection.replace('_', ' ')}
                    size="small"
                    color={
                      insights.analytics.trendDirection.includes('improving') ? 'success' :
                      insights.analytics.trendDirection.includes('declining') ? 'error' : 'default'
                    }
                    variant="outlined"
                  />
                )}
                {insights.analytics.riskScore !== undefined && (
                  <Chip
                    label={`Risk: ${insights.analytics.riskScore}%`}
                    size="small"
                    color={
                      insights.analytics.riskScore >= 70 ? 'error' :
                      insights.analytics.riskScore >= 40 ? 'warning' : 'success'
                    }
                    variant="outlined"
                  />
                )}
              </Box>
            </>
          )}

          {/* Top Risk Customers */}
          {insights?.topRiskCustomers && insights.topRiskCustomers.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Customers Requiring Attention
              </Typography>
              <List dense>
                {insights.topRiskCustomers.slice(0, 3).map((customer, index) => (
                  <ListItem key={customer.customerId} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {customer.criticalCount > 0 ? (
                        <ErrorIcon color="error" fontSize="small" />
                      ) : (
                        <WarningIcon color="warning" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={customer.customerName}
                      secondary={`${customer.count} alert${customer.count > 1 ? 's' : ''}${customer.criticalCount > 0 ? ` (${customer.criticalCount} critical)` : ''}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {/* Admin Actions */}
          {user?.role === 'admin' && insights?.summary?.totalAlerts > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.location.href = '/admin'}
                >
                  View All Alerts
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={refreshInsights}
                  disabled={refreshing}
                >
                  Refresh All
                </Button>
              </Box>
            </>
          )}

          {/* Last Updated */}
          <Box mt={2} textAlign="center">
            <Typography variant="caption" color="textSecondary">
              Last updated: {insights?.lastUpdated ? new Date(insights.lastUpdated).toLocaleTimeString() : 'Unknown'}
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default InsightsBox;
