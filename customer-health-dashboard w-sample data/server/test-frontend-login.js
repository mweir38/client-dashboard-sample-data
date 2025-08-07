const axios = require('axios');

// Simulate frontend login request
async function testFrontendLogin() {
  try {
    console.log('🧪 Testing Frontend Login Process...\n');

    // Test 1: Direct backend call (should work)
    console.log('1. Testing direct backend login...');
    try {
      const directResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@example.com',
        password: 'password123'
      });
      console.log('✅ Direct backend login successful');
      console.log('   Token received:', !!directResponse.data.token);
      console.log('   User role:', directResponse.data.user.role);
    } catch (error) {
      console.log('❌ Direct backend login failed:', error.response?.data || error.message);
    }

    // Test 2: Relative URL call (simulating frontend proxy)
    console.log('\n2. Testing relative URL login (frontend proxy simulation)...');
    try {
      const relativeResponse = await axios.post('/api/auth/login', {
        email: 'admin@example.com',
        password: 'password123'
      }, {
        baseURL: 'http://localhost:5000'
      });
      console.log('✅ Relative URL login successful');
      console.log('   Token received:', !!relativeResponse.data.token);
      console.log('   User role:', relativeResponse.data.user.role);
    } catch (error) {
      console.log('❌ Relative URL login failed:', error.response?.data || error.message);
    }

    // Test 3: Test with different credentials
    console.log('\n3. Testing with regular user credentials...');
    try {
      const userResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'user@example.com',
        password: 'password123'
      });
      console.log('✅ Regular user login successful');
      console.log('   Token received:', !!userResponse.data.token);
      console.log('   User role:', userResponse.data.user.role);
    } catch (error) {
      console.log('❌ Regular user login failed:', error.response?.data || error.message);
    }

    // Test 4: Test invalid credentials
    console.log('\n4. Testing with invalid credentials...');
    try {
      await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@example.com',
        password: 'wrongpassword'
      });
      console.log('❌ Invalid login should have failed but succeeded');
    } catch (error) {
      console.log('✅ Invalid login correctly failed');
      console.log('   Error message:', error.response?.data?.msg);
      console.log('   Status code:', error.response?.status);
    }

    // Test 5: Test non-existent user
    console.log('\n5. Testing with non-existent user...');
    try {
      await axios.post('http://localhost:5000/api/auth/login', {
        email: 'nonexistent@example.com',
        password: 'password123'
      });
      console.log('❌ Non-existent user should have failed but succeeded');
    } catch (error) {
      console.log('✅ Non-existent user correctly failed');
      console.log('   Error message:', error.response?.data?.msg);
      console.log('   Status code:', error.response?.status);
    }

    console.log('\n🎉 All login tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
  }
}

// Run the test
testFrontendLogin(); 