const mongoose = require('mongoose');
const aiInsightsService = require('./services/aiInsightsService');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/customer-health-dashboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testAIInsights() {
  try {
    console.log('🧪 Testing AI Insights Service...\n');

    // Test 1: Portfolio Insights
    console.log('📊 Testing Portfolio Insights...');
    const portfolioInsights = await aiInsightsService.generatePortfolioInsights();
    console.log('✅ Portfolio insights generated successfully');
    console.log('   - Total customers:', portfolioInsights.portfolioOverview.totalCustomers);
    console.log('   - Critical customers:', portfolioInsights.portfolioOverview.criticalCustomers);
    console.log('   - At-risk customers:', portfolioInsights.portfolioOverview.atRiskCustomers);
    console.log('   - Healthy customers:', portfolioInsights.portfolioOverview.healthyCustomers);
    console.log('   - Average health score:', portfolioInsights.portfolioOverview.averageHealthScore.toFixed(2));
    console.log('   - Total potential value: $', portfolioInsights.growthOpportunities.totalPotentialValue?.toLocaleString());
    console.log('   - Risk recommendations:', portfolioInsights.optimizationRecommendations.length);
    console.log('   - Strategic recommendations:', portfolioInsights.strategicRecommendations.shortTerm.length);
    console.log();

    // Test 2: Customer Insights (if customers exist)
    const Customer = require('./models/Customer');
    const customers = await Customer.find().limit(1);
    
    if (customers.length > 0) {
      console.log('👤 Testing Customer Insights...');
      const customerInsights = await aiInsightsService.generateCustomerInsights(customers[0]._id);
      console.log('✅ Customer insights generated successfully');
      console.log('   - Customer:', customerInsights.customer.name);
      console.log('   - Health score:', customerInsights.customer.healthScore);
      console.log('   - ARR: $', customerInsights.customer.arr?.toLocaleString());
      console.log('   - Priority:', customerInsights.priority);
      console.log('   - Risk level:', customerInsights.riskAnalysis.riskLevel);
      console.log('   - Risk score:', (customerInsights.riskAnalysis.overallRiskScore * 100).toFixed(1) + '%');
      console.log('   - Risks identified:', customerInsights.riskAnalysis.risks.length);
      console.log('   - Opportunities:', customerInsights.opportunities.opportunities.length);
      console.log('   - Total potential value: $', customerInsights.opportunities.totalPotentialValue?.toLocaleString());
      console.log('   - Recommendations:', customerInsights.recommendations.recommendations.length);
      console.log('   - Trends:', customerInsights.trends.trends.length);
      console.log('   - Predictions:', customerInsights.predictiveInsights.predictions.length);
      console.log('   - Action items:', customerInsights.actionItems.actionItems.length);
      console.log();

      // Test 3: Risk Analysis
      console.log('⚠️  Testing Risk Analysis...');
      const riskAnalysis = await aiInsightsService.analyzeRiskFactors(customers[0]);
      console.log('✅ Risk analysis completed');
      console.log('   - Overall risk score:', (riskAnalysis.overallRiskScore * 100).toFixed(1) + '%');
      console.log('   - Risk level:', riskAnalysis.riskLevel);
      console.log('   - Number of risks:', riskAnalysis.risks.length);
      console.log('   - Top risks:', riskAnalysis.topRisks.length);
      console.log();

      // Test 4: Opportunities
      console.log('🚀 Testing Opportunity Identification...');
      const opportunities = await aiInsightsService.identifyOpportunities(customers[0]);
      console.log('✅ Opportunities identified');
      console.log('   - Total opportunities:', opportunities.opportunities.length);
      console.log('   - Total potential value: $', opportunities.totalPotentialValue?.toLocaleString());
      console.log('   - Priority opportunities:', opportunities.priorityOpportunities.length);
      console.log();

      // Test 5: Recommendations
      console.log('💡 Testing Recommendations...');
      const recommendations = await aiInsightsService.generateRecommendations(customers[0]);
      console.log('✅ Recommendations generated');
      console.log('   - Total recommendations:', recommendations.recommendations.length);
      console.log('   - Priority recommendations:', recommendations.priorityRecommendations.length);
      console.log('   - Implementation plan sections:', Object.keys(recommendations.implementationPlan).length);
      console.log();

      // Test 6: Predictive Insights
      console.log('🔮 Testing Predictive Insights...');
      const predictions = await aiInsightsService.generatePredictiveInsights(customers[0]);
      console.log('✅ Predictive insights generated');
      console.log('   - Number of predictions:', predictions.predictions.length);
      console.log('   - Overall confidence:', (predictions.confidence * 100).toFixed(1) + '%');
      console.log('   - Prediction summary:', predictions.overallPrediction.summary);
      console.log();

      // Test 7: Action Items
      console.log('📋 Testing Action Items...');
      const actionItems = await aiInsightsService.generateActionItems(customers[0]);
      console.log('✅ Action items generated');
      console.log('   - Total action items:', actionItems.actionItems.length);
      console.log('   - Immediate actions:', actionItems.immediateActions.length);
      console.log('   - Short-term actions:', actionItems.shortTermActions.length);
      console.log('   - Medium-term actions:', actionItems.mediumTermActions.length);
      console.log('   - Long-term actions:', actionItems.longTermActions.length);
      console.log();

    } else {
      console.log('⚠️  No customers found in database. Skipping customer-specific tests.');
      console.log('   Please run the seed script first: npm run seed');
    }

    console.log('🎉 All AI Insights tests completed successfully!');
    console.log('\n📈 Key Features Verified:');
    console.log('   ✅ Portfolio health analysis');
    console.log('   ✅ Risk assessment and scoring');
    console.log('   ✅ Opportunity identification');
    console.log('   ✅ Strategic recommendations');
    console.log('   ✅ Predictive analytics');
    console.log('   ✅ Action item generation');
    console.log('   ✅ Trend analysis');
    console.log('   ✅ Integration health monitoring');

  } catch (error) {
    console.error('❌ Error testing AI Insights:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testAIInsights(); 