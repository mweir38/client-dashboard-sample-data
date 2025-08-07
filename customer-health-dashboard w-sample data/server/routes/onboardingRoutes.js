const express = require('express');
const router = express.Router();
const onboardingService = require('../services/onboardingService');
const { auth } = require('../middleware/auth');

// Get project dashboard for current user
router.get('/dashboard', auth, async (req, res) => {
  try {
    const dashboard = await onboardingService.getProjectDashboard(req.user.id);
    res.json(dashboard);
  } catch (error) {
    console.error('Error fetching onboarding dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all projects for current user
router.get('/projects', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const projects = await onboardingService.getUserProjects(req.user.id, status);
    res.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get specific project
router.get('/projects/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await onboardingService.getProject(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user has access to this project
    const hasAccess = project.projectManager.toString() === req.user.id ||
                     project.teamMembers.some(member => member.user.toString() === req.user.id);
    
    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new onboarding project
router.post('/projects', auth, async (req, res) => {
  try {
    const projectData = req.body;
    
    // Validate required fields
    if (!projectData.customerId || !projectData.projectName) {
      return res.status(400).json({ 
        error: 'Customer ID and project name are required' 
      });
    }
    
    const project = await onboardingService.createProject(projectData, req.user.id);
    res.status(201).json({ 
      message: 'Onboarding project created successfully',
      project 
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/projects/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;
    
    const OnboardingProject = require('../models/OnboardingProject');
    const project = await OnboardingProject.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check permissions
    const hasAccess = project.projectManager.toString() === req.user.id || req.user.role === 'admin';
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    Object.assign(project, updates);
    await project.save();
    await project.populate(['customerId', 'projectManager', 'teamMembers.user']);
    
    res.json({ 
      message: 'Project updated successfully',
      project 
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Update task status
router.patch('/projects/:projectId/milestones/:milestoneId/tasks/:taskId', auth, async (req, res) => {
  try {
    const { projectId, milestoneId, taskId } = req.params;
    const { status, actualHours, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const project = await onboardingService.updateTaskStatus(
      projectId, 
      milestoneId, 
      taskId, 
      status, 
      req.user.id
    );
    
    // Update additional task fields if provided
    if (actualHours !== undefined || notes) {
      const milestone = project.milestones.id(milestoneId);
      const task = milestone.tasks.id(taskId);
      
      if (actualHours !== undefined) {
        task.actualHours = actualHours;
      }
      
      if (notes) {
        task.notes.push(notes);
      }
      
      await project.save();
    }
    
    res.json({ 
      message: 'Task updated successfully',
      project 
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Add communication log
router.post('/projects/:projectId/communications', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const communicationData = req.body;
    
    if (!communicationData.type || !communicationData.summary) {
      return res.status(400).json({ 
        error: 'Communication type and summary are required' 
      });
    }
    
    const project = await onboardingService.addCommunication(
      projectId, 
      communicationData, 
      req.user.id
    );
    
    res.json({ 
      message: 'Communication logged successfully',
      project 
    });
  } catch (error) {
    console.error('Error adding communication:', error);
    res.status(500).json({ error: 'Failed to log communication' });
  }
});

// Add team member to project
router.post('/projects/:projectId/team', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }
    
    const OnboardingProject = require('../models/OnboardingProject');
    const project = await OnboardingProject.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check permissions
    const hasAccess = project.projectManager.toString() === req.user.id || req.user.role === 'admin';
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if user is already a team member
    const existingMember = project.teamMembers.find(
      member => member.user.toString() === userId
    );
    
    if (existingMember) {
      return res.status(400).json({ error: 'User is already a team member' });
    }
    
    project.teamMembers.push({ user: userId, role });
    await project.save();
    await project.populate(['customerId', 'projectManager', 'teamMembers.user']);
    
    res.json({ 
      message: 'Team member added successfully',
      project 
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

// Remove team member from project
router.delete('/projects/:projectId/team/:userId', auth, async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    
    const OnboardingProject = require('../models/OnboardingProject');
    const project = await OnboardingProject.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check permissions
    const hasAccess = project.projectManager.toString() === req.user.id || req.user.role === 'admin';
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    project.teamMembers = project.teamMembers.filter(
      member => member.user.toString() !== userId
    );
    
    await project.save();
    await project.populate(['customerId', 'projectManager', 'teamMembers.user']);
    
    res.json({ 
      message: 'Team member removed successfully',
      project 
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

// Get project templates
router.get('/templates', auth, async (req, res) => {
  try {
    const templates = onboardingService.getProjectTemplates();
    res.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Generate project status report
router.get('/projects/:projectId/report', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const report = await onboardingService.generateStatusReport(projectId);
    res.json({ report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Add risk to project
router.post('/projects/:projectId/risks', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const riskData = req.body;
    
    if (!riskData.description || !riskData.impact || !riskData.probability) {
      return res.status(400).json({ 
        error: 'Risk description, impact, and probability are required' 
      });
    }
    
    const OnboardingProject = require('../models/OnboardingProject');
    const project = await OnboardingProject.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    project.risks.push(riskData);
    await project.save();
    
    res.json({ 
      message: 'Risk added successfully',
      project 
    });
  } catch (error) {
    console.error('Error adding risk:', error);
    res.status(500).json({ error: 'Failed to add risk' });
  }
});

// Update risk status
router.patch('/projects/:projectId/risks/:riskId', auth, async (req, res) => {
  try {
    const { projectId, riskId } = req.params;
    const { status, mitigation } = req.body;
    
    const OnboardingProject = require('../models/OnboardingProject');
    const project = await OnboardingProject.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const risk = project.risks.id(riskId);
    if (!risk) {
      return res.status(404).json({ error: 'Risk not found' });
    }
    
    if (status) risk.status = status;
    if (mitigation) risk.mitigation = mitigation;
    
    await project.save();
    
    res.json({ 
      message: 'Risk updated successfully',
      project 
    });
  } catch (error) {
    console.error('Error updating risk:', error);
    res.status(500).json({ error: 'Failed to update risk' });
  }
});

// Add customer feedback
router.post('/projects/:projectId/feedback', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const feedbackData = req.body;
    
    if (!feedbackData.rating || !feedbackData.feedback || !feedbackData.category) {
      return res.status(400).json({ 
        error: 'Rating, feedback, and category are required' 
      });
    }
    
    const OnboardingProject = require('../models/OnboardingProject');
    const project = await OnboardingProject.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    project.customerFeedback.push(feedbackData);
    await project.save();
    
    res.json({ 
      message: 'Customer feedback added successfully',
      project 
    });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({ error: 'Failed to add feedback' });
  }
});

// Get projects by customer
router.get('/customers/:customerId/projects', auth, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const OnboardingProject = require('../models/OnboardingProject');
    const projects = await OnboardingProject.find({ customerId })
      .populate(['projectManager', 'teamMembers.user'])
      .sort({ createdAt: -1 });
    
    res.json({ projects });
  } catch (error) {
    console.error('Error fetching customer projects:', error);
    res.status(500).json({ error: 'Failed to fetch customer projects' });
  }
});

module.exports = router;