import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Container,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Description as TemplateIcon,
  ExpandMore as ExpandMoreIcon,
  BarChart as ChartIcon,
  Warning as AlertIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';
import NavigationHeader from './NavigationHeader';

const ReportingEngine = () => {
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Report generation modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    type: '',
    filters: {},
    config: {
      includeCharts: true,
      includeTables: true,
      includeTrends: true,
      includeRecommendations: true,
      format: 'pdf'
    }
  });

  // Schedule modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    isRecurring: false,
    frequency: 'weekly',
    recipients: []
  });

  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchCurrentUser();
    fetchReports();
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, currentUser]);

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

  const filterTemplates = () => {
    if (!currentUser) {
      setFilteredTemplates([]);
      return;
    }

    // Admin users can see all templates
    if (currentUser.role === 'admin') {
      setFilteredTemplates(templates);
      return;
    }

    const permissions = currentUser.reportingPermissions || {};
    
    // If user doesn't have permission to generate reports, show no templates
    if (!permissions.canGenerateReports) {
      setFilteredTemplates([]);
      return;
    }

    let filtered = templates;

    // Filter by allowed report types
    if (permissions.allowedReportTypes && permissions.allowedReportTypes.length > 0) {
      filtered = filtered.filter(template => 
        permissions.allowedReportTypes.includes(template.type)
      );
    }

    // Filter by allowed categories
    if (permissions.allowedCategories && permissions.allowedCategories.length > 0) {
      filtered = filtered.filter(template => 
        permissions.allowedCategories.includes(template.category)
      );
    }

    setFilteredTemplates(filtered);
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (err) {
      setError('Failed to fetch reports');
      showError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching templates with token:', token ? 'Token exists' : 'No token');
      const response = await axios.get('http://localhost:5000/api/reports/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Templates response:', response.data);
      console.log('Templates count:', response.data.length);
      setTemplates(response.data);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      showError('Failed to fetch report templates');
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post('http://localhost:5000/api/reports/generate', reportForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showSuccess('Report generated successfully');
      setReportModalOpen(false);
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to generate report');
      showError(err.response?.data?.msg || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (reportId, format = 'pdf') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5000/api/reports/${reportId}/export`, 
        { format },
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showSuccess('Report exported successfully');
    } catch (err) {
      showError('Failed to export report');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showSuccess('Report deleted successfully');
      fetchReports();
    } catch (err) {
      showError('Failed to delete report');
    }
  };

  const handleScheduleReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const payload = {
        ...reportForm,
        schedule: scheduleForm
      };

      const response = await axios.post('http://localhost:5000/api/reports/schedule', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showSuccess('Report scheduled successfully');
      setScheduleModalOpen(false);
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to schedule report');
      showError(err.response?.data?.msg || 'Failed to schedule report');
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    setReportForm({
      ...reportForm,
      type: template.type,
      title: template.name,
      description: template.description,
      filters: template.defaultFilters || {}
    });
    setReportModalOpen(true);
  };

  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'customer-health': return <ChartIcon />;
      case 'qbr': return <AssessmentIcon />;
      case 'onboarding': return <ScheduleIcon />;
      case 'alerts': return <AlertIcon />;
      case 'financial': return <AssessmentIcon />;
      default: return <AssessmentIcon />;
    }
  };

  const getReportStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'generating': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const renderTemplates = () => {
    console.log('Templates array:', templates, 'Length:', templates.length);
    console.log('Filtered templates:', filteredTemplates, 'Length:', filteredTemplates.length);
    console.log('Current user permissions:', currentUser?.reportingPermissions);
    
    if (filteredTemplates.length === 0) {
      if (templates.length === 0) {
        return (
          <Alert severity="info">
            No report templates available. The templates may still be loading or there was an error fetching them.
          </Alert>
        );
      } else {
        return (
          <Alert severity="warning">
            No report templates available based on your current permissions. Contact your administrator to request access to specific report types.
          </Alert>
        );
      }
    }
    
    return (
      <Grid container spacing={3}>
        {filteredTemplates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { boxShadow: 4 }
              }}
              onClick={() => selectTemplate(template)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <TemplateIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">{template.name}</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" mb={2}>
                  {template.description}
                </Typography>
                <Chip 
                  label={(template.type || 'unknown').replace('-', ' ')} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderReports = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Report</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Generated By</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Downloads</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report._id}>
              <TableCell>
                <Box>
                  <Typography variant="subtitle2">{report.title}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {report.description}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  icon={getReportTypeIcon(report.type || 'unknown')}
                  label={(report.type || 'unknown').replace('-', ' ')}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {report.generatedBy?.name || 'Unknown'}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={report.status}
                  color={getReportStatusColor(report.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(report.createdAt).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {report.downloadCount || 0}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" gap={1}>
                  <IconButton
                    size="small"
                    onClick={() => handleExportReport(report._id, 'pdf')}
                    disabled={report.status !== 'completed'}
                  >
                    <DownloadIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteReport(report._id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderReportModal = () => (
    <Dialog open={reportModalOpen} onClose={() => setReportModalOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
                          <AssessmentIcon sx={{ mr: 1 }} />
          Generate Report
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Report Title"
              value={reportForm.title}
              onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={reportForm.description}
              onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Report Configuration</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Include Charts</InputLabel>
                      <Select
                        value={reportForm.config.includeCharts}
                        onChange={(e) => setReportForm({
                          ...reportForm,
                          config: { ...reportForm.config, includeCharts: e.target.value }
                        })}
                        label="Include Charts"
                      >
                        <MenuItem value={true}>Yes</MenuItem>
                        <MenuItem value={false}>No</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Include Tables</InputLabel>
                      <Select
                        value={reportForm.config.includeTables}
                        onChange={(e) => setReportForm({
                          ...reportForm,
                          config: { ...reportForm.config, includeTables: e.target.value }
                        })}
                        label="Include Tables"
                      >
                        <MenuItem value={true}>Yes</MenuItem>
                        <MenuItem value={false}>No</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Include Trends</InputLabel>
                      <Select
                        value={reportForm.config.includeTrends}
                        onChange={(e) => setReportForm({
                          ...reportForm,
                          config: { ...reportForm.config, includeTrends: e.target.value }
                        })}
                        label="Include Trends"
                      >
                        <MenuItem value={true}>Yes</MenuItem>
                        <MenuItem value={false}>No</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Export Format</InputLabel>
                      <Select
                        value={reportForm.config.format}
                        onChange={(e) => setReportForm({
                          ...reportForm,
                          config: { ...reportForm.config, format: e.target.value }
                        })}
                        label="Export Format"
                      >
                        <MenuItem value="pdf">PDF</MenuItem>
                        <MenuItem value="excel">Excel</MenuItem>
                        <MenuItem value="csv">CSV</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setReportModalOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            setReportModalOpen(false);
            setScheduleModalOpen(true);
          }}
          startIcon={<ScheduleIcon />}
        >
          Schedule
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerateReport}
          disabled={loading || !reportForm.title}
                          startIcon={<AssessmentIcon />}
        >
          Generate Report
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderScheduleModal = () => (
    <Dialog open={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <ScheduleIcon sx={{ mr: 1 }} />
          Schedule Report
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={scheduleForm.frequency}
                onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                label="Frequency"
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Recipients (comma-separated emails)"
              value={scheduleForm.recipients.join(', ')}
              onChange={(e) => setScheduleForm({
                ...scheduleForm,
                recipients: e.target.value.split(',').map(email => email.trim())
              })}
              margin="normal"
              placeholder="user1@example.com, user2@example.com"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setScheduleModalOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleScheduleReport}
          disabled={loading || scheduleForm.recipients.length === 0}
          startIcon={<ScheduleIcon />}
        >
          Schedule Report
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <NavigationHeader title="Customer Health Dashboard" currentPage="Reports" />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Reporting Engine
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setReportModalOpen(true)}
          >
            Generate Report
          </Button>
        </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Templates" icon={<TemplateIcon />} />
                          <Tab label="Reports" icon={<AssessmentIcon />} />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Report Templates
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Select a template to generate a report with predefined settings and filters.
          </Typography>
          {renderTemplates()}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Generated Reports
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : reports.length === 0 ? (
            <Alert severity="info">
              No reports generated yet. Use the templates above to create your first report.
            </Alert>
          ) : (
            renderReports()
          )}
        </Box>
      )}

      {renderReportModal()}
      {renderScheduleModal()}
      
      {/* Debug component - remove in production */}
      {/* <Box sx={{ mt: 4 }}>
        <ReportingDebug />
      </Box> */}
      </Container>
    </Box>
  );
};

export default ReportingEngine; 