const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Customer = require('./models/Customer');

require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🌱 Starting database initialization...');

    // Clear existing data
    await User.deleteMany({});
    await Customer.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      canImpersonate: true,
      reportingPermissions: {
        canViewAllReports: true,
        canGenerateReports: true,
        canExportReports: true,
        canScheduleReports: true,
        canViewOwnReports: true,
        allowedReportTypes: [
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
        ],
        allowedCategories: [
          'Customer Health',
          'QBR', 
          'Customer Analysis',
          'Onboarding',
          'Monitoring',
          'Financial',
          'Summary'
        ],
        restrictedCustomers: []
      }
    });
    
    await adminUser.save();
    console.log('👤 Created admin user: admin@example.com / password123');

    // Create regular user
    const regularUser = new User({
      name: 'Regular User',
      email: 'user@example.com',
      password: hashedPassword,
      role: 'user',
      canImpersonate: false,
      reportingPermissions: {
        canViewAllReports: false,
        canGenerateReports: true,
        canExportReports: true,
        canScheduleReports: false,
        canViewOwnReports: true,
        allowedReportTypes: ['customer-health', 'qbr'],
        allowedCategories: ['Customer Health', 'QBR'],
        restrictedCustomers: []
      }
    });
    
    await regularUser.save();
    console.log('👤 Created regular user: user@example.com / password123');

    console.log('✅ Database initialization completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Admin user: admin@example.com / password123 (full access)');
    console.log('- Regular user: user@example.com / password123 (limited access)');
    console.log('\n🚀 You can now start the application and begin adding your customers.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

seedData();