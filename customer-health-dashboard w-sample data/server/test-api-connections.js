require('dotenv').config();
const jiraService = require('./services/jiraService');
const zendeskService = require('./services/zendeskService');
const hubspotService = require('./services/hubspotService');

async function testJiraConnection() {
  console.log('\n🔧 Testing Jira Connection...');
  try {
    // Test basic search functionality
    const searchResult = await jiraService.searchIssues('ORDER BY created DESC', 1);
    console.log('✅ Jira search API working');
    console.log(`   Found ${searchResult.total} total issues`);
    
    if (searchResult.issues && searchResult.issues.length > 0) {
      const issueKey = searchResult.issues[0].key;
      console.log(`   Testing issue fetch with key: ${issueKey}`);
      
      const issue = await jiraService.getIssue(issueKey);
      console.log('✅ Jira issue fetch working');
      
      const comments = await jiraService.getIssueComments(issueKey);
      console.log(`✅ Jira comments fetch working (${comments.length} comments)`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Jira connection failed:', error.message);
    if (error.message.includes('not configured')) {
      console.log('   💡 Set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN in .env');
    }
    return false;
  }
}

async function testZendeskConnection() {
  console.log('\n🎫 Testing Zendesk Connection...');
  try {
    // Test search functionality
    const tickets = await zendeskService.searchTickets('type:ticket', 'created_at', 'desc');
    console.log('✅ Zendesk search API working');
    console.log(`   Found ${tickets.length} tickets`);
    
    if (tickets.length > 0) {
      const ticketId = tickets[0].id;
      console.log(`   Testing ticket fetch with ID: ${ticketId}`);
      
      const ticket = await zendeskService.getTicketById(ticketId);
      console.log('✅ Zendesk ticket fetch working');
      
      if (ticket.requester_id) {
        const user = await zendeskService.getUserById(ticket.requester_id);
        console.log('✅ Zendesk user fetch working');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Zendesk connection failed:', error.message);
    if (error.message.includes('not configured')) {
      console.log('   💡 Set ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, and ZENDESK_API_TOKEN in .env');
    }
    return false;
  }
}

async function testHubSpotConnection() {
  console.log('\n🏢 Testing HubSpot Connection...');
  try {
    // Test products fetch
    const products = await hubspotService.getAllProducts(5);
    console.log('✅ HubSpot products API working');
    console.log(`   Found ${products.length} products`);
    
    // Test company search
    const companies = await hubspotService.searchCompanies('test', 1);
    console.log('✅ HubSpot company search working');
    console.log(`   Found ${companies.length} companies matching "test"`);
    
    return true;
  } catch (error) {
    console.error('❌ HubSpot connection failed:', error.message);
    if (error.message.includes('not configured')) {
      console.log('   💡 Set HUBSPOT_API_KEY in .env');
    }
    return false;
  }
}

async function testAllConnections() {
  console.log('🚀 Starting API Connection Tests...');
  console.log('=====================================');
  
  const results = {
    jira: await testJiraConnection(),
    zendesk: await testZendeskConnection(),
    hubspot: await testHubSpotConnection()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Jira:     ${results.jira ? '✅ Connected' : '❌ Failed'}`);
  console.log(`Zendesk:  ${results.zendesk ? '✅ Connected' : '❌ Failed'}`);
  console.log(`HubSpot:  ${results.hubspot ? '✅ Connected' : '❌ Failed'}`);
  
  const successCount = Object.values(results).filter(Boolean).length;
  console.log(`\n${successCount}/3 APIs connected successfully`);
  
  if (successCount === 3) {
    console.log('\n🎉 All APIs are ready for integration!');
  } else {
    console.log('\n⚠️  Some APIs need configuration. Check the API_SETUP_GUIDE.md for details.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAllConnections().catch(console.error);
}

module.exports = {
  testJiraConnection,
  testZendeskConnection,
  testHubSpotConnection,
  testAllConnections
};