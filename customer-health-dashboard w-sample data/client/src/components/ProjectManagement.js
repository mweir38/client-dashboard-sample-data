import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as ProjectIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Group as TeamIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [newProject, setNewProject] = useState({
    projectName: '',
    customerId: '',
    template: 'standard',
    targetCompletionDate: '',
    teamMembers: []
  });

  const { showSuccess, showError, showOnboardingUpdate } = useNotification();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [dashboardRes, projectsRes, customersRes, usersRes, templatesRes] = await Promise.all([
        fetch('http://localhost:5000/api/onboarding/dashboard', { headers }),
        fetch('http://localhost:5000/api/onboarding/projects', { headers }),
        fetch('http://localhost:5000/api/customers', { headers }),
        fetch('http://localhost:5000/api/users', { headers }),
        fetch('http://localhost:5000/api/onboarding/templates', { headers })
      ]);

      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        setDashboard(dashboardData);
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      }

      if (customersRes.ok) {
        const customersData = await customersRes.json();
        // The customers API returns an array directly, not wrapped in an object
        setCustomers(Array.isArray(customersData) ? customersData : []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        // The users API returns an array directly, not wrapped in an object
        setUsers(Array.isArray(usersData) ? usersData : []);
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load project data', 'Data Load Error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/onboarding/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProject)
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess(`Project "${newProject.projectName}" created successfully`);
        if (data.project && data.project.customerId && data.project.customerId.name) {
          showOnboardingUpdate(
            data.project.customerId.name,
            'Project created and onboarding initiated'
          );
        }
        setCreateDialogOpen(false);
        setNewProject({
          projectName: '',
          customerId: '',
          template: 'standard',
          targetCompletionDate: '',
          teamMembers: []
        });
        fetchData();
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      showError('Error creating project');
    }
  };

  const handleUpdateTaskStatus = async (projectId, milestoneId, taskId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/onboarding/projects/${projectId}/milestones/${milestoneId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess('Task status updated successfully');
        
        // Find the task and milestone names for notification
        const project = projects.find(p => p._id === projectId);
        const milestone = project?.milestones.find(m => m._id === milestoneId);
        const task = milestone?.tasks.find(t => t._id === taskId);
        
        if (status === 'completed' && project && milestone && task) {
          showOnboardingUpdate(
            project.customerId.name,
            `${milestone.name}: ${task.title} completed`
          );
        }
        
        fetchData();
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      showError('Error updating task status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': case 'in-progress': return 'primary';
      case 'on-hold': case 'blocked': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const renderDashboard = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ProjectIcon color="primary" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4">{dashboard?.totalProjects || 0}</Typography>
                <Typography variant="body2" color="textSecondary">Total Projects</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TimelineIcon color="success" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4">{dashboard?.activeProjects || 0}</Typography>
                <Typography variant="body2" color="textSecondary">Active Projects</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon color="success" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4">{dashboard?.completedProjects || 0}</Typography>
                <Typography variant="body2" color="textSecondary">Completed</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WarningIcon color="error" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4">{dashboard?.overdueProjects || 0}</Typography>
                <Typography variant="body2" color="textSecondary">Overdue</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderProjectsList = () => (
    <Grid container spacing={2}>
      {projects.map((project) => (
        <Grid item xs={12} md={6} lg={4} key={project._id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" noWrap>{project.projectName}</Typography>
                <Chip 
                  label={project.status} 
                  color={getStatusColor(project.status)}
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {project.customerId?.name}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Progress: {project.progress}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={project.progress} 
                  sx={{ mb: 1 }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="textSecondary">
                  PM: {project.projectManager?.name}
                </Typography>
                <Box>
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setSelectedProject(project);
                        setViewDialogOpen(true);
                      }}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderUpcomingDeadlines = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Upcoming Deadlines
        </Typography>
        {dashboard?.upcomingDeadlines?.length > 0 ? (
          <List>
            {dashboard.upcomingDeadlines.slice(0, 5).map((deadline, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <WarningIcon color={deadline.daysUntilDue <= 2 ? 'error' : 'warning'} />
                </ListItemIcon>
                <ListItemText
                  primary={deadline.task.title}
                  secondary={`${deadline.customerName} - ${deadline.milestoneName} (${deadline.daysUntilDue} days)`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="textSecondary">No upcoming deadlines</Typography>
        )}
      </CardContent>
    </Card>
  );

  const renderProjectDetails = () => {
    if (!selectedProject) return null;

    return (
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedProject.projectName} - {selectedProject.customerId?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Status</Typography>
                <Chip label={selectedProject.status} color={getStatusColor(selectedProject.status)} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Progress</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={selectedProject.progress} 
                    sx={{ flexGrow: 1, mr: 1 }}
                  />
                  <Typography variant="body2">{selectedProject.progress}%</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="h6" gutterBottom>Milestones</Typography>
          {selectedProject.milestones?.map((milestone) => (
            <Accordion key={milestone._id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography sx={{ flexGrow: 1 }}>{milestone.name}</Typography>
                  <Chip 
                    label={milestone.status} 
                    color={getStatusColor(milestone.status)}
                    size="small"
                    sx={{ mr: 2 }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {milestone.description}
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Task</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {milestone.tasks?.map((task) => (
                        <TableRow key={task._id}>
                          <TableCell>{task.title}</TableCell>
                          <TableCell>
                            <Chip 
                              label={task.priority} 
                              color={getPriorityColor(task.priority)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={task.status} 
                              color={getStatusColor(task.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {task.status !== 'completed' && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleUpdateTaskStatus(
                                  selectedProject._id,
                                  milestone._id,
                                  task._id,
                                  task.status === 'pending' ? 'in-progress' : 'completed'
                                )}
                              >
                                {task.status === 'pending' ? 'Start' : 'Complete'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderCreateProjectDialog = () => (
    <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Create New Onboarding Project</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Project Name"
              value={newProject.projectName}
              onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Customer</InputLabel>
              <Select
                value={newProject.customerId}
                onChange={(e) => setNewProject({ ...newProject, customerId: e.target.value })}
              >
                {customers.map((customer) => (
                  <MenuItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Template</InputLabel>
              <Select
                value={newProject.template}
                onChange={(e) => setNewProject({ ...newProject, template: e.target.value })}
              >
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name} ({template.duration})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              type="date"
              label="Target Completion Date"
              InputLabelProps={{ shrink: true }}
              value={newProject.targetCompletionDate}
              onChange={(e) => setNewProject({ ...newProject, targetCompletionDate: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
        <Button 
          onClick={handleCreateProject}
          variant="contained"
          disabled={!newProject.projectName || !newProject.customerId}
        >
          Create Project
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading project management...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Project Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Project
        </Button>
      </Box>

      {dashboard && renderDashboard()}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="All Projects" />
          <Tab label="Upcoming Deadlines" />
        </Tabs>
      </Box>

      {tabValue === 0 && renderProjectsList()}
      {tabValue === 1 && renderUpcomingDeadlines()}

      {renderCreateProjectDialog()}
      {renderProjectDetails()}
    </Box>
  );
};

export default ProjectManagement;