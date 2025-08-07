const axios = require('axios');

// Test proxy connection from frontend perspective
async function testProxyConnection() {
  try {
    console.log('🧪 Testing Frontend-Backend Proxy Connection...\n');

    // Test 1: Direct connection to backend
    console.log('1. Testing direct backend connection...');
    try {
      const healthResponse = await axios.get('http://localhost:5000/health');
      console.log('✅ Backend health check successful');
      console.log('   Status:', healthResponse.data.status);
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
    }

    // Test 2: Test login through proxy simulation
    console.log('\n2. Testing login through proxy simulation...');
    try {
      const loginResponse = await axios.post('/api/auth/login', {
        email: 'admin@example.com',
        password: 'password123'
      }, {
        baseURL: 'http://localhost:5000',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000'
        }
      });
      console.log('✅ Proxy login successful');
      console.log('   Token received:', !!loginResponse.data.token);
      console.log('   User role:', loginResponse.data.user.role);
    } catch (error) {
      console.log('❌ Proxy login failed:', error.response?.data || error.message);
      console.log('   Status:', error.response?.status);
    }

    // Test 3: Test CORS headers
    console.log('\n3. Testing CORS configuration...');
    try {
      const corsResponse = await axios.options('http://localhost:5000/api/auth/login', {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      console.log('✅ CORS preflight successful');
      console.log('   CORS headers:', corsResponse.headers['access-control-allow-origin']);
    } catch (error) {
      console.log('❌ CORS preflight failed:', error.message);
    }

    // Test 4: Test with different user agent (simulating browser)
    console.log('\n4. Testing with browser-like user agent...');
    try {
      const browserResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@example.com',
        password: 'password123'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Origin': 'http://localhost:3000',
          'Referer': 'http://localhost:3000/'
        }
      });
      console.log('✅ Browser-like request successful');
      console.log('   Token received:', !!browserResponse.data.token);
    } catch (error) {
      console.log('❌ Browser-like request failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Proxy connection tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
  }
}

// Run the test
testProxyConnection(); 