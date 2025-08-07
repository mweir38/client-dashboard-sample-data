# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Customer Health Dashboard.

## 🚨 Quick Diagnostics

### System Health Check
```bash
# Check if servers are running
curl -f http://localhost:5000/health && echo "Backend: ✓" || echo "Backend: ✗"
curl -f http://localhost:3000 && echo "Frontend: ✓" || echo "Frontend: ✗"

# Check database connection
mongo --eval "db.adminCommand('ismaster')" && echo "MongoDB: ✓" || echo "MongoDB: ✗"
```

### Authentication Test
```bash
# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

## 🔧 Common Issues

### 1. Authentication & Login Issues

#### Problem: "Invalid credentials" error
**Symptoms:**
- Login fails with correct credentials
- 401 Unauthorized responses

**Solutions:**
```bash
# Re-seed the database
cd server
node seed.js

# Check user exists in database
mongo customer-health-dashboard --eval "db.users.find({email: 'admin@example.com'})"

# Verify password hashing
node -e "
const bcrypt = require('bcrypt');
console.log('Test password hash:', bcrypt.hashSync('password123', 10));
"
```

#### Problem: JWT token issues
**Symptoms:**
- "Token is not valid" errors
- Frequent logout redirects

**Solutions:**
```bash
# Check JWT_SECRET is set
echo $JWT_SECRET

# Verify token format
node -e "
const jwt = require('jsonwebtoken');
const token = 'YOUR_TOKEN_HERE';
try {
  console.log(jwt.decode(token));
} catch(e) {
  console.log('Invalid token:', e.message);
}
"
```

### 2. Database Connection Issues

#### Problem: MongoDB connection failures
**Symptoms:**
- "MongoNetworkError" messages
- Server crashes on startup

**Solutions:**
```bash
# Check MongoDB service
sudo systemctl status mongod
sudo systemctl start mongod

# Test connection string
mongo "mongodb://localhost:27017/customer-health-dashboard" --eval "db.stats()"

# For MongoDB Atlas
mongo "mongodb+srv://username:password@cluster.mongodb.net/customer-health-dashboard" --eval "db.stats()"
```

#### Problem: Database schema issues
**Symptoms:**
- Validation errors
- Missing fields in responses

**Solutions:**
```bash
# Drop and recreate database
mongo customer-health-dashboard --eval "db.dropDatabase()"
cd server && node seed.js

# Check collection schemas
mongo customer-health-dashboard --eval "
db.customers.findOne();
db.users.findOne();
db.alerts.findOne();
"
```

### 3. API Integration Issues

#### Problem: Third-party API failures
**Symptoms:**
- Integration data not loading
- API rate limit errors
- Connection timeouts

**Solutions:**
```bash
# Test Jira connection
curl -u "email:api_token" \
  "https://your-domain.atlassian.net/rest/api/3/myself"

# Test Zendesk connection
curl -u "email/token:api_token" \
  "https://your-subdomain.zendesk.com/api/v2/users/me.json"

# Test HubSpot connection
curl -H "Authorization: Bearer your-api-key" \
  "https://api.hubapi.com/contacts/v1/lists/all/contacts/all"
```

#### Problem: OpenAI API issues
**Symptoms:**
- AI insights showing mock data
- "API key not found" errors
- Rate limit exceeded

**Solutions:**
```bash
# Test OpenAI API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  "https://api.openai.com/v1/models"

# Check API usage
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  "https://api.openai.com/v1/dashboard/billing/usage"

# Verify environment variable
echo "OpenAI Key: ${OPENAI_API_KEY:0:10}..."
```

### 4. Frontend Issues

#### Problem: Compilation errors
**Symptoms:**
- Webpack build failures
- Module not found errors
- Syntax errors

**Solutions:**
```bash
# Clear node_modules and reinstall
cd client
rm -rf node_modules package-lock.json
npm install

# Check for version conflicts
npm ls
npm audit fix

# Update dependencies
npm update
```

#### Problem: Runtime errors
**Symptoms:**
- White screen of death
- Component crashes
- Network errors

**Solutions:**
```bash
# Check browser console for errors
# Open Developer Tools → Console

# Test API connectivity
curl -f http://localhost:5000/api/customers

# Clear browser cache and localStorage
# Developer Tools → Application → Storage → Clear All
```

### 5. Smart Insights & Alerts Issues

#### Problem: Analytics not loading
**Symptoms:**
- Empty analytics dashboard
- "null" values in insights
- Risk scores not calculating

**Solutions:**
```bash
# Test analytics endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/alerts/dashboard-insights

# Check customer data exists
mongo customer-health-dashboard --eval "
db.customers.find({}).forEach(c => {
  console.log(c.name, 'Health:', c.healthScore, 'Products:', c.productUsage?.length);
});
"

# Verify AI insights service
node -e "
const aiService = require('./services/aiInsightsService');
console.log('AI Service loaded:', typeof aiService.calculateComprehensiveRiskScore);
"
```

#### Problem: Alerts not generating
**Symptoms:**
- No alerts showing
- Alert counts always zero
- Missing alert types

**Solutions:**
```bash
# Test alert generation
node -e "
const alertsService = require('./services/alertsService');
const Customer = require('./models/Customer');

Customer.findOne().then(customer => {
  return alertsService.generateCustomerAlerts(customer);
}).then(alerts => {
  console.log('Generated alerts:', alerts.length);
  alerts.forEach(a => console.log('-', a.type, a.severity));
}).catch(console.error);
"

# Check thresholds calculation
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/alerts" | jq '.summary'
```

### 6. Impersonation Issues

#### Problem: Impersonation failures
**Symptoms:**
- "No customer associated with this account"
- Impersonation token errors
- Wrong dashboard redirection

**Solutions:**
```bash
# Check user-customer associations
mongo customer-health-dashboard --eval "
db.users.find({role: 'client'}).forEach(u => {
  console.log(u.email, 'Customer ID:', u.customerId);
});
"

# Test impersonation endpoint
curl -X POST http://localhost:5000/api/impersonation/start \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetType":"customer","targetId":"CUSTOMER_ID","reason":"Testing"}'

# Verify populated customer data
node -e "
const User = require('./models/User');
User.findOne({role: 'client'}).populate('customerId').then(user => {
  console.log('User:', user.email);
  console.log('Customer:', user.customerId?.name);
}).catch(console.error);
"
```

### 7. PDF Export Issues

#### Problem: PDF generation failures
**Symptoms:**
- 500 errors on export
- Empty PDF files
- Memory errors

**Solutions:**
```bash
# Check memory usage
free -h
# Increase Node.js memory if needed
node --max-old-space-size=4096 server.js

# Test PDF service
node -e "
const pdfService = require('./services/pdfExportService');
pdfService.generateReportPDF({
  title: 'Test Report',
  content: '<h1>Test</h1>',
  customer: { name: 'Test Customer' }
}).then(buffer => {
  console.log('PDF generated:', buffer.length, 'bytes');
}).catch(console.error);
"

# Check file permissions
ls -la /tmp/
chmod 755 /tmp/
```

## 🔍 Advanced Debugging

### Enable Debug Logging
```bash
# Backend debugging
DEBUG=* node server.js

# Database query debugging
MONGOOSE_DEBUG=true node server.js

# Frontend debugging
REACT_APP_DEBUG=true npm start
```

### Network Debugging
```bash
# Monitor API calls
netstat -tulpn | grep :5000
netstat -tulpn | grep :3000

# Check CORS issues
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS \
  http://localhost:5000/api/auth/login
```

### Database Debugging
```bash
# Enable MongoDB logging
mongo --eval "db.setLogLevel(2)"

# Check database size and indexes
mongo customer-health-dashboard --eval "
db.stats();
db.customers.getIndexes();
db.users.getIndexes();
"

# Analyze slow queries
mongo customer-health-dashboard --eval "
db.setProfilingLevel(2, { slowms: 100 });
// Run your operations
db.system.profile.find().sort({ts: -1}).limit(5);
"
```

## 🛠 Performance Troubleshooting

### High Memory Usage
```bash
# Monitor Node.js memory
node --inspect server.js
# Open chrome://inspect in Chrome

# Check for memory leaks
npm install -g clinic
clinic doctor -- node server.js
```

### Slow API Responses
```bash
# Profile API endpoints
time curl http://localhost:5000/api/customers

# Check database performance
mongo customer-health-dashboard --eval "
db.customers.explain('executionStats').find({});
"

# Monitor with top/htop
htop
```

### Database Performance
```bash
# Add missing indexes
mongo customer-health-dashboard --eval "
db.customers.createIndex({ healthScore: 1 });
db.alerts.createIndex({ customerId: 1, status: 1 });
db.users.createIndex({ email: 1 }, { unique: true });
"

# Analyze query performance
mongo customer-health-dashboard --eval "
db.customers.find().explain('executionStats');
"
```

## 🚨 Emergency Recovery

### Complete System Reset
```bash
# Stop all processes
pkill -f "node server.js"
pkill -f "npm start"

# Reset database
mongo customer-health-dashboard --eval "db.dropDatabase()"

# Reinstall dependencies
cd server && rm -rf node_modules && npm install
cd client && rm -rf node_modules && npm install

# Reseed database
cd server && node seed.js

# Restart services
cd server && npm start &
cd client && npm start &
```

### Data Recovery
```bash
# Backup current database
mongodump --db customer-health-dashboard --out backup/

# Restore from backup
mongorestore --db customer-health-dashboard backup/customer-health-dashboard/

# Export specific collections
mongoexport --db customer-health-dashboard --collection customers --out customers.json
```

## 📞 Getting Help

### Log Collection
```bash
# Collect system logs
journalctl -u mongod --since "1 hour ago" > mongodb.log
npm --prefix server run logs > server.log
npm --prefix client run logs > client.log
```

### Environment Information
```bash
# System information
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo "MongoDB: $(mongo --version | head -1)"
echo "OS: $(uname -a)"
echo "Memory: $(free -h | head -2)"
echo "Disk: $(df -h / | tail -1)"
```

### Support Checklist
When seeking help, please provide:

1. **Error Messages**: Full error logs and stack traces
2. **Environment**: Node.js, MongoDB, OS versions
3. **Configuration**: Anonymized .env file
4. **Steps to Reproduce**: Detailed reproduction steps
5. **Expected vs Actual**: What should happen vs what happens
6. **Recent Changes**: Any recent code or config changes

## 🔧 Maintenance Commands

### Daily Maintenance
```bash
# Check system health
curl -f http://localhost:5000/health
curl -f http://localhost:3000

# Monitor disk space
df -h

# Check error logs
tail -f server/logs/error.log
```

### Weekly Maintenance
```bash
# Update dependencies
npm update
npm audit fix

# Clean up old logs
find . -name "*.log" -mtime +7 -delete

# Optimize database
mongo customer-health-dashboard --eval "
db.customers.reIndex();
db.users.reIndex();
db.alerts.reIndex();
"
```

### Monthly Maintenance
```bash
# Full system update
npm install -g npm
npm update -g

# Database maintenance
mongo customer-health-dashboard --eval "
db.runCommand({compact: 'customers'});
db.runCommand({compact: 'users'});
db.runCommand({compact: 'alerts'});
"

# Performance review
clinic doctor -- node server.js
```

---

## 📚 Additional Resources

- [MongoDB Troubleshooting](https://docs.mongodb.com/manual/troubleshooting/)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [React Developer Tools](https://reactjs.org/blog/2019/08/15/new-react-devtools.html)
- [JWT Debugging](https://jwt.io/)

For more help, create an issue in the repository with your logs and environment details.