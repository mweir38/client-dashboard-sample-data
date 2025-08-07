const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'client'],
    default: 'user'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  // Impersonation fields
  canImpersonate: {
    type: Boolean,
    default: false
  },
  impersonationHistory: [{
    impersonatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    impersonatedCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    impersonatedAt: {
      type: Date,
      default: Date.now
    },
    impersonatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    duration: Number, // in minutes
    reason: String
  }],
  // Reporting permissions
  reportingPermissions: {
    canViewAllReports: {
      type: Boolean,
      default: function() { return this.role === 'admin'; }
    },
    canGenerateReports: {
      type: Boolean,
      default: function() { return this.role === 'admin'; }
    },
    canExportReports: {
      type: Boolean,
      default: function() { return this.role === 'admin'; }
    },
    canScheduleReports: {
      type: Boolean,
      default: function() { return this.role === 'admin'; }
    },
    canViewOwnReports: {
      type: Boolean,
      default: true
    },
    allowedReportTypes: [{
      type: String,
      enum: [
        'customer-health', 
        'qbr', 
        'onboarding', 
        'alerts', 
        'financial',
        'customer-360',
        'customer-usage',
        'customer-support',
        'dashboard',
        'portfolio'
      ]
    }],
    allowedCategories: [{
      type: String,
      enum: [
        'Customer Health',
        'QBR', 
        'Customer Analysis',
        'Onboarding',
        'Monitoring',
        'Financial',
        'Summary'
      ]
    }],
    restrictedCustomers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    }]
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
