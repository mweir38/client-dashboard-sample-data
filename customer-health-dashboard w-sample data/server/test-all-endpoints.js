const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAllEndpoints() {
  try {
    console.log('🧪 Testing All Failing Endpoints...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful\n');

    // Step 2: Test customers endpoint
    console.log('2. Testing /api/customers...');
    try {
      const customersResponse = await axios.get(`${BASE_URL}/customers`, { headers });
      console.log('✅ Customers endpoint works');
      console.log(`   Customers returned: ${customersResponse.data.length}`);
    } catch (error) {
      console.log('❌ Customers endpoint failed:', error.response?.data || error.message);
    }

    // Step 3: Test insights endpoint
    console.log('\n3. Testing /api/alerts/dashboard-insights...');
    try {
      const insightsResponse = await axios.get(`${BASE_URL}/alerts/dashboard-insights`, { headers });
      console.log('✅ Insights endpoint works');
      console.log('   Insights data received');
    } catch (error) {
      console.log('❌ Insights endpoint failed:', error.response?.data || error.message);
    }

    // Step 4: Test reports endpoint
    console.log('\n4. Testing /api/reports...');
    try {
      const reportsResponse = await axios.get(`${BASE_URL}/reports`, { headers });
      console.log('✅ Reports endpoint works');
      console.log(`   Reports returned: ${reportsResponse.data.length || 0}`);
    } catch (error) {
      console.log('❌ Reports endpoint failed:', error.response?.data || error.message);
    }

    // Step 5: Test report generation
    console.log('\n5. Testing report generation...');
    try {
      const generateResponse = await axios.post(`${BASE_URL}/reports/generate`, {
        type: 'customer-health',
        format: 'pdf',
        filters: {}
      }, { headers });
      console.log('✅ Report generation works');
      console.log('   Report generated successfully');
    } catch (error) {
      console.log('❌ Report generation failed:', error.response?.data || error.message);
    }

    // Step 6: Test impersonation targets
    console.log('\n6. Testing /api/impersonation/available-targets...');
    try {
      const targetsResponse = await axios.get(`${BASE_URL}/impersonation/available-targets`, { headers });
      console.log('✅ Impersonation targets endpoint works');
      console.log(`   Users: ${targetsResponse.data.users.length}`);
      console.log(`   Customers: ${targetsResponse.data.customers.length}`);
    } catch (error) {
      console.log('❌ Impersonation targets failed:', error.response?.data || error.message);
    }

    // Step 7: Test AI insights
    console.log('\n7. Testing /api/ai-insights/portfolio...');
    try {
      const aiResponse = await axios.get(`${BASE_URL}/ai-insights/portfolio`, { headers });
      console.log('✅ AI insights endpoint works');
      console.log('   AI insights data received');
    } catch (error) {
      console.log('❌ AI insights failed:', error.response?.data || error.message);
    }

    // Step 8: Test with relative URLs (simulating frontend)
    console.log('\n8. Testing with relative URLs (frontend simulation)...');
    try {
      const relativeResponse = await axios.get('/api/customers', {
        baseURL: 'http://localhost:5000',
        headers
      });
      console.log('✅ Relative URL works');
      console.log(`   Customers via relative URL: ${relativeResponse.data.length}`);
    } catch (error) {
      console.log('❌ Relative URL failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 All endpoint tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
  }
}

// Run the test
testAllEndpoints(); 