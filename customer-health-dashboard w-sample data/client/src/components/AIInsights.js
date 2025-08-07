import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  LinearProgress,
  Container
} from '@mui/material';
import {
  Psychology as AIIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  Lightbulb as LightbulbIcon,
  Assignment as AssignmentIcon,
  Speed as SpeedIcon,
  TrendingFlat as TrendingFlatIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';
import NavigationHeader from './NavigationHeader';

const AIInsights = ({ customerId = null }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [insights, setInsights] = useState(null);
  const [portfolioInsights, setPortfolioInsights] = useState(null);
  const [user, setUser] = useState(null);
  
  const { showError } = useNotification();

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    if (customerId) {
      fetchCustomerInsights();
    } else {
      fetchPortfolioInsights();
    }
  }, [customerId]);

  const fetchCustomerInsights = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/ai-insights/customer/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInsights(response.data.data);
    } catch (err) {
      setError('Failed to fetch customer insights');
      showError('Failed to fetch customer insights');
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioInsights = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/ai-insights/portfolio', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPortfolioInsights(response.data.data);
    } catch (err) {
      setError('Failed to fetch portfolio insights');
      showError('Failed to fetch portfolio insights');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (customerId) {
      fetchCustomerInsights();
    } else {
      fetchPortfolioInsights();
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'increasing': return <TrendingUpIcon color="success" />;
      case 'decreasing': return <TrendingDownIcon color="error" />;
      default: return <TrendingFlatIcon color="action" />;
    }
  };

  const renderCustomerInsights = () => {
    if (!insights) return null;

    return (
      <Box>
        {/* Customer Overview */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <AIIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">AI Analysis for {insights.customer.name}</Typography>
              <Chip 
                label={insights.priority.toUpperCase()} 
                color={getPriorityColor(insights.priority)}
                sx={{ ml: 'auto' }}
              />
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Health Score</Typography>
                <Typography variant="h4" color="primary">
                  {insights.customer.healthScore}/10
                </Typography>
              </Grid>
              {/* ARR - only for admin users */}
              {user?.role === 'admin' && (
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">ARR</Typography>
                  <Typography variant="h4" color="primary">
                    ${insights.customer.arr?.toLocaleString()}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Risk Level</Typography>
                <Chip 
                  label={insights.riskAnalysis.riskLevel} 
                  color={getRiskLevelColor(insights.riskAnalysis.riskLevel)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Risk Analysis" icon={<WarningIcon />} />
          <Tab label="Opportunities" icon={<TrendingUpIcon />} />
          <Tab label="Recommendations" icon={<LightbulbIcon />} />
          <Tab label="Trends" icon={<TimelineIcon />} />
          <Tab label="Predictions" icon={<AnalyticsIcon />} />
          <Tab label="Action Items" icon={<AssignmentIcon />} />
        </Tabs>

        {activeTab === 0 && renderRiskAnalysis()}
        {activeTab === 1 && renderOpportunities()}
        {activeTab === 2 && renderRecommendations()}
        {activeTab === 3 && renderTrends()}
        {activeTab === 4 && renderPredictions()}
        {activeTab === 5 && renderActionItems()}
      </Box>
    );
  };

  const renderPortfolioInsights = () => {
    if (!portfolioInsights) return null;

    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          <AIIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Portfolio AI Insights
        </Typography>

        <Grid container spacing={3}>
          {/* Portfolio Overview */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Portfolio Health Overview
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography>Total Customers</Typography>
                  <Typography variant="h6">{portfolioInsights.portfolioOverview.totalCustomers}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography>Healthy</Typography>
                  <Typography color="success.main">{portfolioInsights.portfolioOverview.healthyCustomers}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography>At Risk</Typography>
                  <Typography color="warning.main">{portfolioInsights.portfolioOverview.atRiskCustomers}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Critical</Typography>
                  <Typography color="error.main">{portfolioInsights.portfolioOverview.criticalCustomers}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Risk Analysis */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Risk Analysis
                </Typography>
                <List>
                  {portfolioInsights.optimizationRecommendations.map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={rec.description}
                        secondary={rec.action}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Growth Opportunities */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Growth Opportunities
                </Typography>
                <Typography variant="h4" color="success.main" gutterBottom>
                  ${portfolioInsights.growthOpportunities.totalPotentialValue?.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Potential Value
                </Typography>
                <List>
                  {portfolioInsights.growthOpportunities.topOpportunities.map((opp, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={opp.customer}
                        secondary={`$${opp.potentialValue?.toLocaleString()} - ${opp.confidence * 100}% confidence`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Strategic Recommendations */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Strategic Recommendations
                </Typography>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Short Term</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {portfolioInsights.strategicRecommendations.shortTerm.map((rec, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={rec} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Medium Term</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {portfolioInsights.strategicRecommendations.mediumTerm.map((rec, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={rec} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderRiskAnalysis = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Risk Analysis
        </Typography>
        
        <Box mb={3}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Overall Risk Score: {Math.round(insights.riskAnalysis.overallRiskScore * 100)}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={insights.riskAnalysis.overallRiskScore * 100}
            color={getRiskLevelColor(insights.riskAnalysis.riskLevel)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <List>
          {insights.riskAnalysis.risks.map((risk, index) => (
            <ListItem key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
              <ListItemIcon>
                <WarningIcon color={getRiskLevelColor(risk.severity)} />
              </ListItemIcon>
              <ListItemText
                primary={risk.description}
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Impact: {risk.impact}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Probability: {Math.round(risk.probability * 100)}%
                    </Typography>
                    <Typography variant="body2" color="primary">
                      Recommendation: {risk.recommendation}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderOpportunities = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Growth Opportunities
        </Typography>
        
        <Box mb={3}>
          <Typography variant="h4" color="success.main" gutterBottom>
            ${insights.opportunities.totalPotentialValue?.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Potential Value
          </Typography>
        </Box>

        <List>
          {insights.opportunities.opportunities.map((opp, index) => (
            <ListItem key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
              <ListItemIcon>
                <TrendingUpIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary={opp.description}
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Category: {opp.category}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      Potential Value: ${opp.potentialValue?.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Confidence: {Math.round(opp.confidence * 100)}%
                    </Typography>
                    <Typography variant="body2" color="primary">
                      Recommendation: {opp.recommendation}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Timeline: {opp.timeline}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderRecommendations = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AI Recommendations
        </Typography>

        <List>
          {insights.recommendations.recommendations.map((rec, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Chip 
                    label={rec.priority.toUpperCase()} 
                    color={getPriorityColor(rec.priority)}
                    size="small"
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="subtitle1">{rec.title}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {rec.description}
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Actions:
                </Typography>
                <List dense>
                  {rec.actions.map((action, actionIndex) => (
                    <ListItem key={actionIndex}>
                      <ListItemIcon>
                        <CheckCircleIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={action} />
                    </ListItem>
                  ))}
                </List>
                
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    Expected Outcome: {rec.expectedOutcome}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Timeline: {rec.timeline}
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderTrends = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Trend Analysis
        </Typography>
        
        <Box mb={3}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Overall Trend: {insights.trends.overallTrend}
          </Typography>
        </Box>

        <List>
          {insights.trends.trends.map((trend, index) => (
            <ListItem key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
              <ListItemIcon>
                {getTrendIcon(trend.direction)}
              </ListItemIcon>
              <ListItemText
                primary={trend.description}
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Metric: {trend.metric}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Magnitude: {trend.magnitude}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Confidence: {Math.round(trend.confidence * 100)}%
                    </Typography>
                    <Typography variant="body2" color="primary">
                      Implications: {trend.implications}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Key Insights:
          </Typography>
          <List dense>
            {insights.trends.keyInsights.map((insight, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <LightbulbIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={insight.insight}
                  secondary={insight.action}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </CardContent>
    </Card>
  );

  const renderPredictions = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Predictive Insights
        </Typography>
        
        <Box mb={3}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Overall Confidence: {Math.round(insights.predictiveInsights.confidence * 100)}%
          </Typography>
          <Typography variant="body2" color="primary">
            {insights.predictiveInsights.overallPrediction.summary}
          </Typography>
        </Box>

        <List>
          {insights.predictiveInsights.predictions.map((prediction, index) => (
            <ListItem key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
              <ListItemIcon>
                <AnalyticsIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={`${prediction.metric}: ${prediction.value}`}
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Type: {prediction.type}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Timeframe: {prediction.timeframe}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Confidence: {Math.round(prediction.confidence * 100)}%
                    </Typography>
                    <Typography variant="body2" color="primary">
                      Recommendation: {prediction.recommendation}
                    </Typography>
                    {prediction.factors.length > 0 && (
                      <Typography variant="body2" color="textSecondary">
                        Factors: {prediction.factors.join(', ')}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderActionItems = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Action Items
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Immediate Actions (24 hours)
            </Typography>
            <List>
              {insights.actionItems.immediateActions.map((action, index) => (
                <ListItem key={index} sx={{ border: 1, borderColor: 'error.main', borderRadius: 1, mb: 1 }}>
                  <ListItemIcon>
                    <SpeedIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={action.action}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Owner: {action.owner}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {action.description}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Short Term Actions (1 week)
            </Typography>
            <List>
              {insights.actionItems.shortTermActions.map((action, index) => (
                <ListItem key={index} sx={{ border: 1, borderColor: 'warning.main', borderRadius: 1, mb: 1 }}>
                  <ListItemIcon>
                    <AssignmentIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={action.action}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Owner: {action.owner}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {action.description}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <NavigationHeader title="Customer Health Dashboard" currentPage="AI Insights" />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            <AIIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            AI-Powered Insights
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

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
        <>
          {customerId ? renderCustomerInsights() : renderPortfolioInsights()}
        </>
      )}
      </Container>
    </Box>
  );
};

export default AIInsights; 