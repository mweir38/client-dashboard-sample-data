const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'blocked'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: Date,
  completedAt: Date,
  estimatedHours: Number,
  actualHours: Number,
  dependencies: [String], // Task IDs that must be completed first
  notes: [String]
});

const milestoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  targetDate: Date,
  completedDate: Date,
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'delayed'],
    default: 'pending'
  },
  tasks: [taskSchema],
  successCriteria: [String]
});

const onboardingProjectSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  projectName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  targetCompletionDate: Date,
  actualCompletionDate: Date,
  projectManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String
  }],
  
  // Project phases/milestones
  milestones: [milestoneSchema],
  
  // Overall project metrics
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Budget and resources
  budget: {
    allocated: Number,
    spent: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Risk management
  risks: [{
    description: String,
    impact: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    probability: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    mitigation: String,
    status: {
      type: String,
      enum: ['identified', 'mitigated', 'resolved'],
      default: 'identified'
    }
  }],
  
  // Communication log
  communications: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['email', 'call', 'meeting', 'slack', 'other']
    },
    participants: [String],
    summary: String,
    actionItems: [String],
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Success metrics
  successMetrics: [{
    metric: String,
    target: String,
    actual: String,
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'achieved', 'missed']
    }
  }],
  
  // Templates and resources
  template: {
    type: String,
    enum: ['standard', 'enterprise', 'technical', 'custom'],
    default: 'standard'
  },
  
  // Customer feedback and satisfaction
  customerFeedback: [{
    date: {
      type: Date,
      default: Date.now
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    category: {
      type: String,
      enum: ['communication', 'timeline', 'quality', 'support', 'overall']
    }
  }],
  
  // Integration requirements
  integrations: [{
    system: String,
    status: {
      type: String,
      enum: ['planned', 'in-progress', 'completed', 'blocked']
    },
    complexity: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    estimatedHours: Number,
    actualHours: Number
  }]
}, {
  timestamps: true
});

// Calculate progress based on completed tasks
onboardingProjectSchema.methods.calculateProgress = function() {
  let totalTasks = 0;
  let completedTasks = 0;
  
  this.milestones.forEach(milestone => {
    totalTasks += milestone.tasks.length;
    completedTasks += milestone.tasks.filter(task => task.status === 'completed').length;
  });
  
  this.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  return this.progress;
};

// Get overdue tasks
onboardingProjectSchema.methods.getOverdueTasks = function() {
  const overdueTasks = [];
  const now = new Date();
  
  this.milestones.forEach(milestone => {
    milestone.tasks.forEach(task => {
      if (task.dueDate && task.dueDate < now && task.status !== 'completed') {
        overdueTasks.push({
          milestoneId: milestone._id,
          milestoneName: milestone.name,
          task: task
        });
      }
    });
  });
  
  return overdueTasks;
};

// Get upcoming deadlines (next 7 days)
onboardingProjectSchema.methods.getUpcomingDeadlines = function() {
  const upcoming = [];
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  this.milestones.forEach(milestone => {
    milestone.tasks.forEach(task => {
      if (task.dueDate && task.dueDate >= now && task.dueDate <= nextWeek && task.status !== 'completed') {
        upcoming.push({
          milestoneId: milestone._id,
          milestoneName: milestone.name,
          task: task,
          daysUntilDue: Math.ceil((task.dueDate - now) / (24 * 60 * 60 * 1000))
        });
      }
    });
  });
  
  return upcoming.sort((a, b) => a.task.dueDate - b.task.dueDate);
};

// Indexes for efficient querying
onboardingProjectSchema.index({ customerId: 1, status: 1 });
onboardingProjectSchema.index({ projectManager: 1, status: 1 });
onboardingProjectSchema.index({ 'teamMembers.user': 1 });

module.exports = mongoose.model('OnboardingProject', onboardingProjectSchema);