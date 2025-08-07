const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testReportingEndpoints() {
  console.log('🧪 Testing Reporting Endpoints...\n');

  try {
    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Step 2: Test templates endpoint
    console.log('\n2️⃣ Testing /api/reports/templates...');
    const templatesResponse = await axios.get(`${BASE_URL}/reports/templates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Templates endpoint working');
    console.log('   Templates found:', templatesResponse.data.length);
    
    // Step 3: Test reports list endpoint
    console.log('\n3️⃣ Testing /api/reports...');
    const reportsResponse = await axios.get(`${BASE_URL}/reports`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Reports list endpoint working');
    console.log('   Reports found:', reportsResponse.data.length);
    
    // Step 4: Test report generation
    console.log('\n4️⃣ Testing /api/reports/generate...');
    const generateResponse = await axios.post(`${BASE_URL}/reports/generate`, {
      type: 'customer-health',
      title: 'Test Customer Health Report',
      description: 'Test report generation',
      filters: {},
      config: {}
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Report generation working');
    console.log('   Report ID:', generateResponse.data.report.id);
    
    console.log('\n🎉 All reporting endpoints working correctly!');
    
  } catch (error) {
    console.error('\n❌ Reporting endpoints test FAILED!');
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

// Run the test
testReportingEndpoints(); 