# Documentation Index

Welcome to the Customer Health Dashboard documentation! This guide helps you navigate all available documentation and resources.

## 📚 Documentation Structure

### 🎯 Getting Started
| Document | Purpose | Audience |
|----------|---------|----------|
| **[README.md](./README.md)** | Complete project overview, installation, and features | Everyone |
| **[setup.sh](./setup.sh)** | Automated setup script with prerequisites check | Developers |

### 🔧 Development
| Document | Purpose | Audience |
|----------|---------|----------|
| **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** | Complete API reference with examples | Developers, Integrators |
| **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** | Problem diagnosis and solutions | Developers, Admins |
| **[test-api.sh](./test-api.sh)** | API endpoint testing script | Developers |

### 🚀 Operations
| Document | Purpose | Audience |
|----------|---------|----------|
| **[start.sh](./start.sh)** | Start both frontend and backend servers | Everyone |
| **[stop.sh](./stop.sh)** | Stop all running servers | Everyone |
| **[dev.sh](./dev.sh)** | Development environment startup | Developers |

## 🎯 Quick Navigation

### 📋 I want to...

#### Set up the project for the first time
1. 🚀 **[Quick Setup Guide](./setup.sh)** - Run `./setup.sh`
2. 📖 **[Full Installation Guide](./README.md#installation)** - Manual setup steps

#### Start using the application
1. 🏃 **[Running the Application](./README.md#running-the-application)** - Start commands
2. 👥 **[User Accounts](./README.md#user-accounts--roles)** - Default login credentials

#### Understand the features
1. 🌟 **[Features Overview](./README.md#features)** - Complete feature list
2. 🧠 **[Smart Insights System](./README.md#smart-insights--alerts-system)** - AI-powered analytics
3. 🎯 **[Key Features Detailed](./README.md#key-features-detailed)** - In-depth explanations

#### Integrate with the API
1. 📚 **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference
2. 🧪 **[API Testing](./test-api.sh)** - Test all endpoints: `./test-api.sh`
3. 🔐 **[Authentication Guide](./API_DOCUMENTATION.md#authentication)** - JWT token setup

#### Troubleshoot issues
1. 🚨 **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Common problems and solutions
2. ⚡ **[Performance Issues](./TROUBLESHOOTING.md#performance-troubleshooting)** - Speed and memory problems
3. 🔧 **[Emergency Recovery](./TROUBLESHOOTING.md#emergency-recovery)** - System reset procedures

#### Deploy to production
1. 🚀 **[Deployment Guide](./README.md#deployment)** - Production setup
2. 🔒 **[Security Features](./README.md#security-features)** - Security considerations
3. ⚙️ **[Environment Variables](./README.md#environment-configuration)** - Production config

## 📊 Feature Documentation Map

### 🧠 Smart Insights & Alerts
- **Overview**: [Smart Insights System](./README.md#smart-insights--alerts-system)
- **API**: [Smart Alerts Endpoints](./API_DOCUMENTATION.md#smart-alerts--analytics-endpoints)
- **Troubleshooting**: [Analytics Issues](./TROUBLESHOOTING.md#smart-insights--alerts-issues)

### 👥 User Management
- **Overview**: [User Management](./README.md#advanced-features)
- **API**: [User Management Endpoints](./API_DOCUMENTATION.md#user-management-endpoints)
- **Troubleshooting**: [Authentication Issues](./TROUBLESHOOTING.md#authentication--login-issues)

### 🔄 Impersonation System
- **Overview**: [Impersonation System](./README.md#user-impersonation-system)
- **API**: [Impersonation Endpoints](./API_DOCUMENTATION.md#impersonation-endpoints)
- **Troubleshooting**: [Impersonation Issues](./TROUBLESHOOTING.md#impersonation-issues)

### 📊 Reporting Engine
- **Overview**: [Reporting Engine](./README.md#comprehensive-reporting-engine)
- **API**: [Reporting Endpoints](./API_DOCUMENTATION.md#reporting-endpoints)
- **Troubleshooting**: [PDF Export Issues](./TROUBLESHOOTING.md#pdf-export-issues)

### 🤖 AI-Powered Insights
- **Overview**: [AI Features](./README.md#ai-powered-insights)
- **API**: [AI Insights Endpoints](./API_DOCUMENTATION.md#ai-insights-endpoints-admin-only)
- **Setup**: [AI Integration](./README.md#ai-integration-setup)
- **Troubleshooting**: [AI Issues](./TROUBLESHOOTING.md#common-issues)

### 🔗 Third-Party Integrations
- **Overview**: [Integrations](./README.md#third-party-integrations)
- **Setup**: [API Keys Configuration](./README.md#environment-configuration)
- **Troubleshooting**: [Integration Issues](./TROUBLESHOOTING.md#api-integration-issues)

## 🛠 Development Resources

### 📝 Code Examples
| Example | Location | Description |
|---------|----------|-------------|
| **Authentication** | [API Docs](./API_DOCUMENTATION.md#authentication) | JWT token usage |
| **Customer Management** | [API Docs](./API_DOCUMENTATION.md#customer-management-endpoints) | CRUD operations |
| **Smart Analytics** | [API Docs](./API_DOCUMENTATION.md#smart-alerts--analytics-endpoints) | Risk scoring and behavior analysis |
| **JavaScript SDK** | [API Docs](./API_DOCUMENTATION.md#sdks--examples) | Node.js integration example |
| **cURL Examples** | [API Docs](./API_DOCUMENTATION.md#sdks--examples) | Command line testing |

### 🧪 Testing Resources
| Resource | Command | Purpose |
|----------|---------|---------|
| **API Testing** | `./test-api.sh` | Test all API endpoints |
| **Health Check** | `curl http://localhost:5000/health` | Server status |
| **Authentication Test** | See [Troubleshooting](./TROUBLESHOOTING.md#authentication-test) | Login verification |

### 🔧 Debugging Tools
| Tool | Location | Purpose |
|------|----------|---------|
| **Debug Logging** | [Troubleshooting](./TROUBLESHOOTING.md#enable-debug-logging) | Detailed logging |
| **Database Debugging** | [Troubleshooting](./TROUBLESHOOTING.md#database-debugging) | MongoDB troubleshooting |
| **Network Debugging** | [Troubleshooting](./TROUBLESHOOTING.md#network-debugging) | API communication issues |

## 📋 Checklists

### ✅ First-Time Setup Checklist
- [ ] Node.js v16+ installed
- [ ] MongoDB installed or Atlas configured
- [ ] Repository cloned
- [ ] Run `./setup.sh`
- [ ] Configure `.env` file
- [ ] Set JWT_SECRET
- [ ] Add OpenAI API key (optional)
- [ ] Run `./start.sh`
- [ ] Test login at http://localhost:3000

### ✅ Production Deployment Checklist
- [ ] Secure JWT_SECRET configured
- [ ] Database backups enabled
- [ ] Environment variables secured
- [ ] HTTPS configured
- [ ] API rate limiting enabled
- [ ] Error monitoring setup
- [ ] Log aggregation configured
- [ ] Health checks implemented
- [ ] Default passwords changed
- [ ] Third-party API keys configured

### ✅ Troubleshooting Checklist
- [ ] Check [Common Issues](./TROUBLESHOOTING.md#common-issues)
- [ ] Verify server status: `curl http://localhost:5000/health`
- [ ] Check database connection
- [ ] Review error logs
- [ ] Test authentication
- [ ] Verify environment variables
- [ ] Run API tests: `./test-api.sh`
- [ ] Check browser console for frontend errors

## 🆘 Getting Help

### 📞 Support Channels
1. **Documentation** - Check this index and linked guides
2. **Troubleshooting** - [Comprehensive guide](./TROUBLESHOOTING.md)
3. **API Reference** - [Complete documentation](./API_DOCUMENTATION.md)
4. **GitHub Issues** - Create an issue with logs and details

### 📋 What to Include When Seeking Help
- **Error Messages**: Full error logs and stack traces
- **Environment**: Node.js, MongoDB, OS versions
- **Configuration**: Anonymized .env file
- **Steps to Reproduce**: Detailed reproduction steps
- **Expected vs Actual**: What should happen vs what happens
- **Recent Changes**: Any recent code or config changes

### 🔧 Emergency Commands
```bash
# Complete system reset
./stop.sh
mongo customer-health-dashboard --eval "db.dropDatabase()"
cd server && node seed.js
./start.sh

# Quick health check
curl -f http://localhost:5000/health
curl -f http://localhost:3000

# View recent logs
tail -f server/logs/error.log
```

---

## 🌟 Latest Updates

This documentation is regularly updated to reflect new features and improvements. Key recent additions:

- **Smart Insights & Alerts System** - ML-inspired risk prediction and behavior analytics
- **Enhanced API Documentation** - Complete endpoint reference with examples
- **Comprehensive Troubleshooting** - Step-by-step problem solving
- **Automated Setup Scripts** - One-command installation and testing

**Last Updated**: August 2024  
**Version**: 2.0 (Smart Insights Release)

---

**💡 Tip**: Bookmark this page for quick access to all documentation!