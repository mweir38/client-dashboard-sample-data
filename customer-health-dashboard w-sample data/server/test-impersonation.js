const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testImpersonation() {
  try {
    console.log('🧪 Testing Impersonation Functionality...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Get available targets
    console.log('2. Fetching available targets...');
    const targetsResponse = await axios.get(`${BASE_URL}/impersonation/available-targets`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Available targets fetched successfully');
    console.log(`   Users: ${targetsResponse.data.users.length}`);
    console.log(`   Customers: ${targetsResponse.data.customers.length}\n`);

    // Step 3: Start impersonating a customer
    console.log('3. Starting customer impersonation...');
    const customerId = targetsResponse.data.customers[0].id;
    const startResponse = await axios.post(`${BASE_URL}/impersonation/start`, {
      targetCustomerId: customerId,
      reason: 'Testing impersonation functionality'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Customer impersonation started successfully');
    console.log(`   Target: ${targetsResponse.data.customers[0].name}`);
    console.log(`   Reason: ${startResponse.data.impersonationData.reason}\n`);

    // Step 4: Start impersonating a user
    console.log('4. Starting user impersonation...');
    const userId = targetsResponse.data.users[0].id;
    const userStartResponse = await axios.post(`${BASE_URL}/impersonation/start`, {
      targetUserId: userId,
      reason: 'Testing user impersonation'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ User impersonation started successfully');
    console.log(`   Target: ${targetsResponse.data.users[0].name}`);
    console.log(`   Reason: ${userStartResponse.data.impersonationData.reason}\n`);

    // Step 5: Get impersonation history
    console.log('5. Fetching impersonation history...');
    const historyResponse = await axios.get(`${BASE_URL}/impersonation/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Impersonation history fetched successfully');
    console.log(`   History entries: ${historyResponse.data.length}\n`);

    // Step 6: Test with regular user
    console.log('6. Testing with regular user...');
    const userLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'user@example.com',
      password: 'password123'
    });
    
    const userToken = userLoginResponse.data.token;
    const userTargetsResponse = await axios.get(`${BASE_URL}/impersonation/available-targets`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    console.log('✅ Regular user can access impersonation targets');
    console.log(`   Users: ${userTargetsResponse.data.users.length}`);
    console.log(`   Customers: ${userTargetsResponse.data.customers.length}\n`);

    console.log('🎉 All impersonation tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Admin login works');
    console.log('   ✅ Available targets endpoint works');
    console.log('   ✅ Customer impersonation works');
    console.log('   ✅ User impersonation works');
    console.log('   ✅ History tracking works');
    console.log('   ✅ Regular user permissions work');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
  }
}

// Run the test
testImpersonation(); 