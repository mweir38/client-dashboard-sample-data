const OnboardingProject = require('../models/OnboardingProject');
const Customer = require('../models/Customer');
const User = require('../models/User');

class OnboardingService {
  // Create a new onboarding project
  async createProject(projectData, userId) {
    try {
      const project = new OnboardingProject({
        ...projectData,
        projectManager: userId
      });

      // Add default milestones based on template
      project.milestones = this.getDefaultMilestones(projectData.template || 'standard');
      
      await project.save();
      await project.populate(['customerId', 'projectManager', 'teamMembers.user']);
      
      return project;
    } catch (error) {
      console.error('Error creating onboarding project:', error);
      throw error;
    }
  }

  // Get default milestones based on template
  getDefaultMilestones(template) {
    const templates = {
      standard: [
        {
          name: 'Project Kickoff',
          description: 'Initial project setup and team introductions',
          targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          tasks: [
            {
              title: 'Schedule kickoff meeting',
              description: 'Coordinate with customer for initial meeting',
              priority: 'high',
              estimatedHours: 2
            },
            {
              title: 'Prepare project documentation',
              description: 'Create project charter and timeline',
              priority: 'medium',
              estimatedHours: 4
            },
            {
              title: 'Set up communication channels',
              description: 'Create Slack channels, email groups, etc.',
              priority: 'medium',
              estimatedHours: 1
            }
          ],
          successCriteria: [
            'Kickoff meeting completed',
            'Project timeline agreed upon',
            'Communication channels established'
          ]
        },
        {
          name: 'Requirements Gathering',
          description: 'Collect and document customer requirements',
          targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
          tasks: [
            {
              title: 'Conduct requirements workshops',
              description: 'Facilitate sessions to gather detailed requirements',
              priority: 'high',
              estimatedHours: 16
            },
            {
              title: 'Document technical specifications',
              description: 'Create detailed technical documentation',
              priority: 'high',
              estimatedHours: 12
            },
            {
              title: 'Review and approve requirements',
              description: 'Get customer sign-off on requirements',
              priority: 'critical',
              estimatedHours: 4
            }
          ],
          successCriteria: [
            'All requirements documented',
            'Customer approval received',
            'Technical specifications complete'
          ]
        },
        {
          name: 'System Configuration',
          description: 'Configure and customize the system',
          targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
          tasks: [
            {
              title: 'Environment setup',
              description: 'Set up development and staging environments',
              priority: 'high',
              estimatedHours: 8
            },
            {
              title: 'System configuration',
              description: 'Configure system based on requirements',
              priority: 'high',
              estimatedHours: 20
            },
            {
              title: 'Integration setup',
              description: 'Configure third-party integrations',
              priority: 'medium',
              estimatedHours: 16
            },
            {
              title: 'Security configuration',
              description: 'Implement security settings and access controls',
              priority: 'critical',
              estimatedHours: 8
            }
          ],
          successCriteria: [
            'System fully configured',
            'Integrations working',
            'Security measures in place'
          ]
        },
        {
          name: 'Testing & Quality Assurance',
          description: 'Comprehensive testing of the configured system',
          targetDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days
          tasks: [
            {
              title: 'Unit testing',
              description: 'Test individual components and features',
              priority: 'high',
              estimatedHours: 12
            },
            {
              title: 'Integration testing',
              description: 'Test system integrations and data flow',
              priority: 'high',
              estimatedHours: 16
            },
            {
              title: 'User acceptance testing',
              description: 'Customer testing and feedback collection',
              priority: 'critical',
              estimatedHours: 20
            },
            {
              title: 'Performance testing',
              description: 'Load and performance testing',
              priority: 'medium',
              estimatedHours: 8
            }
          ],
          successCriteria: [
            'All tests passed',
            'Customer acceptance received',
            'Performance benchmarks met'
          ]
        },
        {
          name: 'Training & Documentation',
          description: 'User training and documentation delivery',
          targetDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days
          tasks: [
            {
              title: 'Create user documentation',
              description: 'Develop comprehensive user guides',
              priority: 'high',
              estimatedHours: 16
            },
            {
              title: 'Conduct admin training',
              description: 'Train customer administrators',
              priority: 'critical',
              estimatedHours: 8
            },
            {
              title: 'Conduct end-user training',
              description: 'Train end users on system usage',
              priority: 'high',
              estimatedHours: 12
            },
            {
              title: 'Create training materials',
              description: 'Develop videos and quick reference guides',
              priority: 'medium',
              estimatedHours: 12
            }
          ],
          successCriteria: [
            'All documentation delivered',
            'Training sessions completed',
            'Users comfortable with system'
          ]
        },
        {
          name: 'Go-Live & Support',
          description: 'Production deployment and initial support',
          targetDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000), // 42 days
          tasks: [
            {
              title: 'Production deployment',
              description: 'Deploy system to production environment',
              priority: 'critical',
              estimatedHours: 8
            },
            {
              title: 'Go-live support',
              description: 'Provide intensive support during go-live',
              priority: 'critical',
              estimatedHours: 24
            },
            {
              title: 'Monitor system performance',
              description: 'Monitor and optimize system performance',
              priority: 'high',
              estimatedHours: 16
            },
            {
              title: 'Project closure',
              description: 'Complete project documentation and handover',
              priority: 'medium',
              estimatedHours: 4
            }
          ],
          successCriteria: [
            'System live in production',
            'No critical issues',
            'Customer satisfaction achieved'
          ]
        }
      ],
      enterprise: [
        // Enterprise template would have more complex milestones
        // For brevity, using standard template with extended timelines
        ...this.getDefaultMilestones('standard').map(milestone => ({
          ...milestone,
          targetDate: new Date(milestone.targetDate.getTime() + 14 * 24 * 60 * 60 * 1000) // Add 2 weeks
        }))
      ],
      technical: [
        // Technical template focused on integration and customization
        {
          name: 'Technical Discovery',
          description: 'Deep technical analysis and architecture planning',
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          tasks: [
            {
              title: 'Architecture review',
              description: 'Review customer technical architecture',
              priority: 'critical',
              estimatedHours: 16
            },
            {
              title: 'Integration analysis',
              description: 'Analyze required integrations and APIs',
              priority: 'high',
              estimatedHours: 12
            }
          ],
          successCriteria: ['Technical architecture documented', 'Integration plan approved']
        }
      ]
    };

    return templates[template] || templates.standard;
  }

  // Get all projects for a user (as manager or team member)
  async getUserProjects(userId, status = null) {
    try {
      const query = {
        $or: [
          { projectManager: userId },
          { 'teamMembers.user': userId }
        ]
      };

      if (status) {
        query.status = status;
      }

      const projects = await OnboardingProject.find(query)
        .populate(['customerId', 'projectManager', 'teamMembers.user'])
        .sort({ createdAt: -1 });

      return projects;
    } catch (error) {
      console.error('Error fetching user projects:', error);
      throw error;
    }
  }

  // Get project by ID
  async getProject(projectId) {
    try {
      const project = await OnboardingProject.findById(projectId)
        .populate(['customerId', 'projectManager', 'teamMembers.user']);
      
      if (project) {
        project.calculateProgress();
        await project.save();
      }
      
      return project;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  }

  // Update task status
  async updateTaskStatus(projectId, milestoneId, taskId, status, userId) {
    try {
      const project = await OnboardingProject.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const milestone = project.milestones.id(milestoneId);
      if (!milestone) {
        throw new Error('Milestone not found');
      }

      const task = milestone.tasks.id(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date();
      }

      // Update milestone status based on task completion
      const completedTasks = milestone.tasks.filter(t => t.status === 'completed').length;
      const totalTasks = milestone.tasks.length;
      
      if (completedTasks === totalTasks) {
        milestone.status = 'completed';
        milestone.completedDate = new Date();
      } else if (completedTasks > 0) {
        milestone.status = 'in-progress';
      }

      // Recalculate project progress
      project.calculateProgress();

      await project.save();
      return project;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  // Add communication log entry
  async addCommunication(projectId, communicationData, userId) {
    try {
      const project = await OnboardingProject.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      project.communications.push({
        ...communicationData,
        recordedBy: userId
      });

      await project.save();
      return project;
    } catch (error) {
      console.error('Error adding communication:', error);
      throw error;
    }
  }

  // Get project dashboard data
  async getProjectDashboard(userId) {
    try {
      const projects = await this.getUserProjects(userId);
      
      const dashboard = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        overdueProjects: 0,
        upcomingDeadlines: [],
        recentActivity: []
      };

      // Calculate overdue projects and upcoming deadlines
      projects.forEach(project => {
        const overdue = project.getOverdueTasks();
        if (overdue.length > 0) {
          dashboard.overdueProjects++;
        }
        
        const upcoming = project.getUpcomingDeadlines();
        dashboard.upcomingDeadlines.push(...upcoming.map(item => ({
          projectId: project._id,
          projectName: project.projectName,
          customerName: project.customerId.name,
          ...item
        })));
      });

      // Sort upcoming deadlines
      dashboard.upcomingDeadlines.sort((a, b) => a.task.dueDate - b.task.dueDate);
      dashboard.upcomingDeadlines = dashboard.upcomingDeadlines.slice(0, 10); // Top 10

      return dashboard;
    } catch (error) {
      console.error('Error fetching project dashboard:', error);
      throw error;
    }
  }

  // Get project templates
  getProjectTemplates() {
    return [
      {
        id: 'standard',
        name: 'Standard Onboarding',
        description: 'Standard 6-week onboarding process for typical customers',
        duration: '6 weeks',
        milestones: 6
      },
      {
        id: 'enterprise',
        name: 'Enterprise Onboarding',
        description: 'Extended onboarding process for enterprise customers',
        duration: '8-10 weeks',
        milestones: 6
      },
      {
        id: 'technical',
        name: 'Technical Integration',
        description: 'Focused on complex technical integrations and customizations',
        duration: '4-6 weeks',
        milestones: 4
      },
      {
        id: 'custom',
        name: 'Custom Project',
        description: 'Create a custom onboarding project from scratch',
        duration: 'Variable',
        milestones: 'Custom'
      }
    ];
  }

  // Generate project status report
  async generateStatusReport(projectId) {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const report = {
        project: {
          name: project.projectName,
          customer: project.customerId.name,
          status: project.status,
          progress: project.progress,
          startDate: project.startDate,
          targetCompletion: project.targetCompletionDate,
          manager: project.projectManager.name
        },
        milestones: project.milestones.map(milestone => ({
          name: milestone.name,
          status: milestone.status,
          targetDate: milestone.targetDate,
          completedDate: milestone.completedDate,
          tasksTotal: milestone.tasks.length,
          tasksCompleted: milestone.tasks.filter(t => t.status === 'completed').length
        })),
        risks: project.risks.filter(r => r.status !== 'resolved'),
        overdueTasks: project.getOverdueTasks(),
        upcomingDeadlines: project.getUpcomingDeadlines(),
        recentCommunications: project.communications.slice(-5).reverse()
      };

      return report;
    } catch (error) {
      console.error('Error generating status report:', error);
      throw error;
    }
  }
}

module.exports = new OnboardingService();