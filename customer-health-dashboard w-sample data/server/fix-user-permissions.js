require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Suppress deprecation warning
mongoose.set('strictQuery', false);

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/customer-health-dashboard';
console.log('Connecting to:', mongoURI);

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

async function fixUserPermissions() {
  try {
    await mongoose.connect(mongoURI, options);
    console.log('Connected to MongoDB');
    console.log('Fixing user permissions...');
    
    // Find all users with invalid reportingPermissions
    const users = await User.find({});
    
    for (let user of users) {
      let hasChanges = false;
      
      // Remove invalid values from allowedReportTypes
      if (user.reportingPermissions && user.reportingPermissions.allowedReportTypes) {
        const validTypes = [
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
        ];
        
        const originalLength = user.reportingPermissions.allowedReportTypes.length;
        user.reportingPermissions.allowedReportTypes = user.reportingPermissions.allowedReportTypes.filter(
          type => validTypes.includes(type)
        );
        
        if (user.reportingPermissions.allowedReportTypes.length !== originalLength) {
          hasChanges = true;
          console.log(`Fixed ${user.email}: removed invalid report types`);
        }
      }
      
      // Remove invalid values from allowedCategories
      if (user.reportingPermissions && user.reportingPermissions.allowedCategories) {
        const validCategories = [
          'Customer Health',
          'QBR', 
          'Customer Analysis',
          'Onboarding',
          'Monitoring',
          'Financial',
          'Summary'
        ];
        
        const originalLength = user.reportingPermissions.allowedCategories.length;
        user.reportingPermissions.allowedCategories = user.reportingPermissions.allowedCategories.filter(
          category => validCategories.includes(category)
        );
        
        if (user.reportingPermissions.allowedCategories.length !== originalLength) {
          hasChanges = true;
          console.log(`Fixed ${user.email}: removed invalid categories`);
        }
      }
      
      if (hasChanges) {
        await user.save();
        console.log(`Saved changes for ${user.email}`);
      }
    }
    
    console.log('User permissions fix completed');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing user permissions:', error);
    process.exit(1);
  }
}

fixUserPermissions();