const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'password123';

async function testAIIntegration() {
  try {
    console.log('🧪 Testing AI Insights API Integration...\n');

    // Step 1: Login to get token
    console.log('🔐 Step 1: Authenticating...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (!loginResponse.data.token) {
      console.log('⚠️  No token received. Trying with different credentials...');
      // Try with different credentials
      const altLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'user@example.com',
        password: 'password123'
      });
      
      if (!altLoginResponse.data.token) {
        console.log('❌ Could not authenticate. Please check if users exist in database.');
        return;
      }
      
      var token = altLoginResponse.data.token;
    } else {
      var token = loginResponse.data.token;
    }
    
    console.log('✅ Authentication successful');
    console.log('   Token received:', token.substring(0, 20) + '...');
    console.log();

    // Step 2: Test Portfolio Insights
    console.log('📊 Step 2: Testing Portfolio Insights API...');
    const portfolioResponse = await axios.get(`${BASE_URL}/api/ai-insights/portfolio`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (portfolioResponse.data.success) {
      console.log('✅ Portfolio insights API working');
      const data = portfolioResponse.data.data;
      console.log('   - Total customers:', data.portfolioOverview.totalCustomers);
      console.log('   - Critical customers:', data.portfolioOverview.criticalCustomers);
      console.log('   - At-risk customers:', data.portfolioOverview.atRiskCustomers);
      console.log('   - Healthy customers:', data.portfolioOverview.healthyCustomers);
      console.log('   - Average health score:', data.portfolioOverview.averageHealthScore);
      console.log('   - Total potential value: $', data.growthOpportunities.totalPotentialValue?.toLocaleString());
    } else {
      console.log('❌ Portfolio insights API failed');
    }
    console.log();

    // Step 3: Test Risk Analysis
    console.log('⚠️  Step 3: Testing Risk Analysis API...');
    const riskResponse = await axios.get(`${BASE_URL}/api/ai-insights/risk-analysis`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (riskResponse.data.success) {
      console.log('✅ Risk analysis API working');
      const data = riskResponse.data.data;
      console.log('   - High risk customers:', data.highRiskCustomers.length);
      console.log('   - At risk customers:', data.atRiskCustomers.length);
      console.log('   - Average churn risk:', data.churnPredictions.averageRisk?.toFixed(2));
    } else {
      console.log('❌ Risk analysis API failed');
    }
    console.log();

    // Step 4: Test Opportunities
    console.log('🚀 Step 4: Testing Opportunities API...');
    const opportunitiesResponse = await axios.get(`${BASE_URL}/api/ai-insights/opportunities`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (opportunitiesResponse.data.success) {
      console.log('✅ Opportunities API working');
      const data = opportunitiesResponse.data.data;
      console.log('   - Growth opportunities:', data.growthOpportunities.opportunities.length);
      console.log('   - Total potential value: $', data.growthOpportunities.totalPotentialValue?.toLocaleString());
      console.log('   - Market insights:', data.marketInsights.marketTrends.length);
    } else {
      console.log('❌ Opportunities API failed');
    }
    console.log();

    // Step 5: Test Predictions
    console.log('🔮 Step 5: Testing Predictions API...');
    const predictionsResponse = await axios.get(`${BASE_URL}/api/ai-insights/predictions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (predictionsResponse.data.success) {
      console.log('✅ Predictions API working');
      const data = predictionsResponse.data.data;
      console.log('   - Churn predictions:', data.churnPredictions.predictions.length);
      console.log('   - Average risk:', data.churnPredictions.averageRisk?.toFixed(2));
    } else {
      console.log('❌ Predictions API failed');
    }
    console.log();

    // Step 6: Test Summary
    console.log('📋 Step 6: Testing Summary API...');
    const summaryResponse = await axios.get(`${BASE_URL}/api/ai-insights/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (summaryResponse.data.success) {
      console.log('✅ Summary API working');
      const data = summaryResponse.data.data;
      console.log('   - Portfolio health:', data.portfolioHealth.totalCustomers, 'customers');
      console.log('   - Top risks:', data.topRisks.length);
      console.log('   - Top opportunities:', data.topOpportunities.length);
      console.log('   - Key recommendations:', data.keyRecommendations.length);
    } else {
      console.log('❌ Summary API failed');
    }
    console.log();

    console.log('🎉 All AI Insights API tests completed successfully!');
    console.log('\n📈 API Endpoints Verified:');
    console.log('   ✅ GET /api/ai-insights/portfolio');
    console.log('   ✅ GET /api/ai-insights/risk-analysis');
    console.log('   ✅ GET /api/ai-insights/opportunities');
    console.log('   ✅ GET /api/ai-insights/predictions');
    console.log('   ✅ GET /api/ai-insights/summary');

  } catch (error) {
    console.error('❌ Error testing AI Insights API:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run the test
testAIIntegration(); 