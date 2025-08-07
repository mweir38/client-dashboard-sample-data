const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testImpersonationFlow() {
  console.log('🧪 Testing Complete Impersonation Flow...\n');

  try {
    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Step 2: Get available targets
    console.log('\n2️⃣ Fetching available targets...');
    const targetsResponse = await axios.get(`${BASE_URL}/impersonation/available-targets`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Available targets:', targetsResponse.data.users.length, 'users,', targetsResponse.data.customers.length, 'customers');
    
    if (targetsResponse.data.users.length === 0) {
      console.log('❌ No users available for impersonation');
      return;
    }
    
    // Step 3: Start impersonation
    console.log('\n3️⃣ Starting impersonation...');
    const targetUser = targetsResponse.data.users[0];
    console.log(`   Target: ${targetUser.name} (${targetUser.email})`);
    
    const startResponse = await axios.post(`${BASE_URL}/impersonation/start`, {
      targetType: 'user',
      targetId: targetUser.id,
      reason: 'Testing impersonation flow'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const impersonationToken = startResponse.data.impersonationToken;
    console.log('✅ Impersonation started successfully');
    
    // Step 4: Test impersonation token
    console.log('\n4️⃣ Testing impersonation token...');
    const testResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${impersonationToken}` }
    });
    
    console.log('✅ Impersonation token valid');
    console.log('   Current user:', testResponse.data.name);
    
    // Step 5: Stop impersonation
    console.log('\n5️⃣ Stopping impersonation...');
    const stopResponse = await axios.post(`${BASE_URL}/impersonation/stop`, {}, {
      headers: { Authorization: `Bearer ${impersonationToken}` }
    });
    
    console.log('✅ Impersonation stopped successfully');
    console.log('   Duration:', stopResponse.data.impersonationDuration, 'minutes');
    console.log('   Original user restored');
    
    // Step 6: Verify original token works
    console.log('\n6️⃣ Verifying original token...');
    const originalToken = stopResponse.data.token;
    const verifyResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${originalToken}` }
    });
    
    console.log('✅ Original token restored');
    console.log('   User:', verifyResponse.data.name);
    
    console.log('\n🎉 Complete impersonation flow test PASSED!');
    
  } catch (error) {
    console.error('\n❌ Impersonation flow test FAILED!');
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

// Run the test
testImpersonationFlow(); 