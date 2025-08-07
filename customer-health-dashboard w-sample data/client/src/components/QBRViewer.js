import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  GetApp as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';

const QBRViewer = ({ open, onClose, customerId, customerName }) => {
  const [qbrs, setQbrs] = useState([]);
  const [selectedQBR, setSelectedQBR] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [user, setUser] = useState(null);
  const { showQBRGenerated, showExportComplete, showError, showDataSyncFailure } = useNotification();

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    if (open && customerId) {
      fetchQBRs();
      fetchSuggestions();
    }
  }, [open, customerId]);

  const fetchQBRs = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`http://localhost:5000/api/qbr/customer/${customerId}`, config);
      setQbrs(response.data.qbrs || []);
      if (response.data.qbrs && response.data.qbrs.length > 0) {
        setSelectedQBR(response.data.qbrs[0]); // Select most recent QBR
      }
    } catch (err) {
      console.error('Error fetching QBRs:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.msg || 'Failed to fetch QBRs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`http://localhost:5000/api/qbr/templates/${customerId}`, config);
      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      // Don't set error for suggestions as it's not critical
    }
  };

  const generateQBR = async (quarter, year) => {
    setGenerating(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.post('http://localhost:5000/api/qbr/generate', {
        customerId,
        quarter,
        year
      }, config);
      
      await fetchQBRs(); // Refresh the list
      setSelectedQBR(response.data.qbr);
      await fetchSuggestions(); // Refresh suggestions
      showQBRGenerated(customerName, `${quarter} ${year}`);
    } catch (err) {
      console.error('Error generating QBR:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.msg || 'Failed to generate QBR';
      setError(errorMessage);
      showError(errorMessage, 'QBR Generation Failed');
      if (err.message) {
        showDataSyncFailure('QBR Service', err.message);
      }
    } finally {
      setGenerating(false);
    }
  };

  const exportQBRToPDF = async () => {
    if (!selectedQBR) return;
    
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob' // Important for file downloads
      };
      
      const response = await axios.get(`http://localhost:5000/api/qbr/${selectedQBR._id}/export`, config);
      
      // Get the filename from the response headers
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `QBR_${customerName}_${selectedQBR.quarter.replace(' ', '_')}.pdf`;
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showExportComplete(filename);
    } catch (err) {
      console.error('Error exporting QBR to PDF:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.msg || 'Failed to export QBR';
      showError(errorMessage, 'Export Failed');
    } finally {
      setExporting(false);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUpIcon color="success" />;
      case 'declining': return <TrendingDownIcon color="error" />;
      default: return <TrendingFlatIcon color="action" />;
    }
  };

  const renderExecutiveSummary = (qbr) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Executive Summary
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Overall Health
              </Typography>
              <Chip 
                label={qbr.executiveSummary.overallHealth}
                color={getHealthColor(qbr.healthAnalysis.currentScore)}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Health Score Trend
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                {getTrendIcon(qbr.healthAnalysis.trend)}
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {qbr.healthAnalysis.currentScore} 
                  ({qbr.healthAnalysis.currentScore > qbr.healthAnalysis.previousScore ? '+' : ''}
                  {(qbr.healthAnalysis.currentScore - qbr.healthAnalysis.previousScore).toFixed(1)})
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {qbr.executiveSummary.keyAchievements.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Key Achievements
            </Typography>
            <List dense>
              {qbr.executiveSummary.keyAchievements.map((achievement, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 16 }} />
                  <ListItemText primary={achievement} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {qbr.executiveSummary.majorChallenges.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Major Challenges
            </Typography>
            <List dense>
              {qbr.executiveSummary.majorChallenges.map((challenge, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <WarningIcon color="warning" sx={{ mr: 1, fontSize: 16 }} />
                  <ListItemText primary={challenge} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {qbr.executiveSummary.recommendations.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Recommendations
            </Typography>
            <List dense>
              {qbr.executiveSummary.recommendations.map((recommendation, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText primary={recommendation} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderBusinessMetrics = (qbr) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Business Metrics
        </Typography>
        
        <Grid container spacing={2}>
          {/* ARR - only for admin users */}
          {user?.role === 'admin' && (
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  ${qbr.businessMetrics.arr?.toLocaleString() || 0}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  ARR
                </Typography>
                {qbr.businessMetrics.arrGrowth !== 0 && (
                  <Typography variant="body2" color={qbr.businessMetrics.arrGrowth > 0 ? 'success.main' : 'error.main'}>
                    {qbr.businessMetrics.arrGrowth > 0 ? '+' : ''}{qbr.businessMetrics.arrGrowth}%
                  </Typography>
                )}
              </Box>
            </Grid>
          )}
          
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {qbr.businessMetrics.featureAdoption}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Feature Adoption
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {qbr.businessMetrics.supportTickets}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Support Tickets
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color={qbr.businessMetrics.criticalIssues > 0 ? 'error.main' : 'success.main'}>
                {qbr.businessMetrics.criticalIssues}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Critical Issues
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderRiskAssessment = (qbr) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Risk Assessment
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Renewal Risk
              </Typography>
              <Chip 
                label={qbr.riskAssessment.renewalRisk.toUpperCase()}
                color={getRiskColor(qbr.riskAssessment.renewalRisk)}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Churn Probability
              </Typography>
              <Typography variant="h6" color={qbr.riskAssessment.churnProbability > 50 ? 'error.main' : 'success.main'}>
                {qbr.riskAssessment.churnProbability}%
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {qbr.riskAssessment.riskFactors.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Risk Factors
            </Typography>
            <List dense>
              {qbr.riskAssessment.riskFactors.map((factor, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ErrorIcon color="error" sx={{ mr: 1, fontSize: 16 }} />
                  <ListItemText primary={factor} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {qbr.riskAssessment.mitigationStrategies.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Mitigation Strategies
            </Typography>
            <List dense>
              {qbr.riskAssessment.mitigationStrategies.map((strategy, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 16 }} />
                  <ListItemText primary={strategy} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderActionPlan = (qbr) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Action Plan
        </Typography>
        
        {qbr.actionPlan.immediateActions.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Immediate Actions
            </Typography>
            <List dense>
              {qbr.actionPlan.immediateActions.map((action, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={action.action}
                    secondary={`Owner: ${action.owner} | Due: ${new Date(action.dueDate).toLocaleDateString()} | Priority: ${action.priority}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {qbr.actionPlan.longTermInitiatives.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Long-term Initiatives
            </Typography>
            <List dense>
              {qbr.actionPlan.longTermInitiatives.map((initiative, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={initiative.initiative}
                    secondary={`Timeline: ${initiative.timeline} | Expected: ${initiative.expectedOutcome}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            QBR Reports - {customerName}
          </Typography>
          <Box>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchQBRs} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* QBR Selection and Generation */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select QBR</InputLabel>
                <Select
                  value={selectedQBR?._id || ''}
                  onChange={(e) => {
                    const qbr = qbrs.find(q => q._id === e.target.value);
                    setSelectedQBR(qbr);
                  }}
                  disabled={loading || qbrs.length === 0}
                >
                  {qbrs.map((qbr) => (
                    <MenuItem key={qbr._id} value={qbr._id}>
                      {qbr.quarter} - Generated {new Date(qbr.generatedAt).toLocaleDateString()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {suggestions.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Generate New QBR:
                  </Typography>
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outlined"
                      size="small"
                      onClick={() => generateQBR(suggestion.quarter, suggestion.year)}
                      disabled={generating}
                      sx={{ mr: 1, mb: 1 }}
                    >
                      {generating ? <CircularProgress size={16} /> : suggestion.quarter} {suggestion.year}
                    </Button>
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* QBR Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : selectedQBR ? (
          <Box>
            <Typography variant="h5" gutterBottom>
              {selectedQBR.quarter} Quarterly Business Review
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Generated on {new Date(selectedQBR.generatedAt).toLocaleDateString()} by {selectedQBR.generatedBy?.name}
            </Typography>
            
            {renderExecutiveSummary(selectedQBR)}
            {renderBusinessMetrics(selectedQBR)}
            {renderRiskAssessment(selectedQBR)}
            {renderActionPlan(selectedQBR)}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              No QBRs available for this customer
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Generate your first QBR using the buttons above
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {selectedQBR && (
          <Button
            startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={exportQBRToPDF}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        )}
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QBRViewer;