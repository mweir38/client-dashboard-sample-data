const mongoose = require('mongoose');
const reportingService = require('./services/reportingService');
require('dotenv').config();

async function testReportingEngine() {
  try {
    // Connect to database
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: Generate customer health report
    console.log('\n🧪 Testing Customer Health Report Generation...');
    try {
      const healthReport = await reportingService.generateCustomerHealthReport();
      console.log('✅ Customer Health Report generated successfully');
      console.log('   Summary:', healthReport.summary);
      console.log('   Metrics count:', Object.keys(healthReport.metrics).length);
    } catch (error) {
      console.error('❌ Customer Health Report failed:', error.message);
    }

    // Test 2: Generate dashboard report
    console.log('\n🧪 Testing Dashboard Report Generation...');
    try {
      const dashboardReport = await reportingService.generateDashboardReport();
      console.log('✅ Dashboard Report generated successfully');
      console.log('   Summary:', dashboardReport.summary);
    } catch (error) {
      console.error('❌ Dashboard Report failed:', error.message);
    }

    // Test 3: Generate financial report
    console.log('\n🧪 Testing Financial Report Generation...');
    try {
      const financialReport = await reportingService.generateFinancialReport();
      console.log('✅ Financial Report generated successfully');
      console.log('   Summary:', financialReport.summary);
    } catch (error) {
      console.error('❌ Financial Report failed:', error.message);
    }

    // Test 4: Generate alerts report
    console.log('\n🧪 Testing Alerts Report Generation...');
    try {
      const alertsReport = await reportingService.generateAlertsReport();
      console.log('✅ Alerts Report generated successfully');
      console.log('   Summary:', alertsReport.summary);
    } catch (error) {
      console.error('❌ Alerts Report failed:', error.message);
    }

    // Test 5: Generate onboarding report
    console.log('\n🧪 Testing Onboarding Report Generation...');
    try {
      const onboardingReport = await reportingService.generateOnboardingReport();
      console.log('✅ Onboarding Report generated successfully');
      console.log('   Summary:', onboardingReport.summary);
    } catch (error) {
      console.error('❌ Onboarding Report failed:', error.message);
    }

    console.log('\n🎉 Reporting Engine Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testReportingEngine(); 