const axios = require('axios');

// Simulate frontend request to impersonation endpoint
async function testFrontendImpersonation() {
  try {
    console.log('🧪 Testing Frontend Impersonation Request...\n');

    // Step 1: Login to get token (simulate frontend login)
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Test the exact request the frontend makes
    console.log('2. Testing /api/impersonation/available-targets...');
    const response = await axios.get('http://localhost:5000/api/impersonation/available-targets', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Available targets fetched successfully');
    console.log(`   Users: ${response.data.users.length}`);
    console.log(`   Customers: ${response.data.customers.length}`);
    console.log('\n📋 Response data:');
    console.log(JSON.stringify(response.data, null, 2));

    // Step 3: Test with relative URL (like frontend proxy)
    console.log('\n3. Testing with relative URL (simulating frontend proxy)...');
    const relativeResponse = await axios.get('/api/impersonation/available-targets', {
      baseURL: 'http://localhost:5000',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Relative URL request successful');
    console.log(`   Users: ${relativeResponse.data.users.length}`);
    console.log(`   Customers: ${relativeResponse.data.customers.length}`);

    // Step 4: Test error handling
    console.log('\n4. Testing error handling...');
    try {
      await axios.get('http://localhost:5000/api/impersonation/available-targets', {
        headers: { 
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('✅ Error handling works correctly');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.msg}`);
    }

    console.log('\n🎉 All frontend impersonation tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
  }
}

// Run the test
testFrontendImpersonation(); 