# Customer Health Dashboard

A comprehensive customer success management platform built with React.js and Node.js, featuring real-time health monitoring, smart AI-powered insights, intelligent alert systems, user impersonation, comprehensive reporting engine, and advanced role-based access control.

## 🚀 Features

### Core Functionality
- **Customer Health Monitoring**: Real-time health score tracking with visual indicators
- **Smart AI-Powered Insights**: ML-inspired risk prediction, behavior scoring, and trend analysis
- **Intelligent Alert System**: Dynamic thresholds, priority scoring, and real-time detection
- **User Impersonation**: Admin capability to impersonate customers and users for support
- **Advanced User Avatars**: Role-based avatars with animated status indicators
- **Comprehensive Reporting Engine**: 10+ report types with PDF export capabilities
- **AI-Powered Insights**: Intelligent customer analysis and recommendations (OpenAI integration)
- **Role-Based Access Control**: Granular permissions for reports, impersonation, and features
- **Third-Party Integrations**: Jira, Zendesk, and HubSpot integration support
- **QBR Generation**: Automated Quarterly Business Review creation with PDF export
- **Project Management**: Client onboarding project tracking and management
- **Real-time Notifications**: Toast notification system with context awareness

### Dashboard Features
- **Client Dashboard**: Dedicated view for customer users with filtered data
- **Admin Dashboard**: Complete system management interface
- **Health Score Visualization**: Color-coded health indicators with trends
- **Smart Analytics Dashboard**: Portfolio behavior analysis, risk scoring, and trend indicators
- **Integration Metrics**: Live data from connected third-party services
- **Executive Summary Cards**: Portfolio health overview
- **Real-time Alert Center**: Prioritized alerts with intelligent categorization

### Smart Insights & Alerts System
- **ML-Inspired Risk Prediction**: Comprehensive risk scoring using weighted factors (health, engagement, support, financial, adoption, sentiment)
- **Dynamic Alert Thresholds**: Customer value-based and health status-adaptive thresholds
- **Intelligent Alert Prioritization**: Urgency and impact-based alert ranking with automatic sorting
- **Customer Behavior Scoring**: 5-tier categorization (Champion, Advocate, Passive, At Risk, Critical)
- **Advanced Trend Analysis**: Historical pattern detection with confidence scoring for health, engagement, and satisfaction
- **Real-time Portfolio Analytics**: Live risk assessment, behavior distribution, and trend direction
- **Predictive Insights**: Trend forecasting and escalation risk detection
- **Smart Alert Types**: Health decline, product adoption stagnation, escalation risk, and enhanced existing alerts

### Advanced Features
- **User Management**: Complete CRUD operations with role assignment
- **Customer Assignment**: Link client users to specific customers
- **Permission Management**: Granular control over report access and features
- **Consistent UI/UX**: Modern glass-morphism design with aviation theme
- **Navigation Consistency**: Unified navigation across all pages

## 🛠 Technology Stack

### Frontend
- **React.js** - Modern UI framework with hooks
- **Material-UI (MUI)** - Professional component library
- **React Router** - Client-side routing with protected routes
- **Axios** - HTTP client for API communication
- **Context API** - State management for notifications

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - Authentication and impersonation tokens
- **html-pdf-node** - PDF generation for reports and QBRs
- **bcrypt** - Password hashing
- **Express Rate Limiting** - API protection

### Integrations
- **OpenAI API** - AI-powered insights and recommendations
- **Jira API** - Issue tracking and project management metrics
- **Zendesk API** - Customer support ticket analysis
- **HubSpot API** - Sales and engagement tracking

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager
- OpenAI API key (for AI insights)

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd customer-health-dashboard
```

### 2. Install Dependencies

#### Backend Dependencies
```bash
cd server
npm install
```

#### Frontend Dependencies
```bash
cd client
npm install
```

### 3. Environment Configuration

Create a `.env` file in the server directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/customer-health-dashboard
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/customer-health-dashboard

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters

# AI Integration (Required for AI Insights)
OPENAI_API_KEY=your-openai-api-key-here

# Third-Party API Keys (Optional - for real integrations)
JIRA_API_TOKEN=your-jira-api-token
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com

ZENDESK_API_TOKEN=your-zendesk-api-token
ZENDESK_SUBDOMAIN=your-zendesk-subdomain
ZENDESK_EMAIL=your-email@company.com

HUBSPOT_API_KEY=your-hubspot-api-key

# Server Configuration
NODE_ENV=development
PORT=5000
```

### 4. AI Integration Setup

#### OpenAI API Key
1. Sign up for an OpenAI account at [https://platform.openai.com](https://platform.openai.com)
2. Navigate to API Keys section
3. Generate a new API key
4. Add it to your `.env` file as `OPENAI_API_KEY`

**Note**: AI insights require a valid OpenAI API key. Without it, the AI insights feature will show mock data.

#### AI Features Include:
- Enhanced customer risk analysis with ML-inspired algorithms
- Advanced behavior scoring and trend pattern detection
- Dynamic alert thresholds and intelligent prioritization
- Opportunity identification and recommendations
- Portfolio-wide insights and predictive analytics
- Intelligent action item generation
- Automated renewal likelihood modeling

### 5. Database Setup

Initialize the database with admin user:

```bash
cd server
node seed.js
```

This creates:
- Admin user: `admin@example.com` / `password123`
- Regular user: `user@example.com` / `password123`
- Client user: `client@acme.com` / `password123`

## 🚀 Running the Application

### Quick Start (Recommended)
```bash
# Automated setup and start
./setup.sh
./start.sh
```

### Development Mode

#### Start the Backend Server
```bash
cd server
npm start
```
Server runs on: http://localhost:5000

#### Start the Frontend Development Server
```bash
cd client
npm start
```
Client runs on: http://localhost:3000

### Helper Scripts
```bash
./start.sh     # Start both frontend and backend
./stop.sh      # Stop all servers
./dev.sh       # Start in development mode
./test-api.sh  # Test API endpoints
```

### Production Mode

#### Build the Frontend
```bash
cd client
npm run build
```

#### Start Production Server
```bash
cd server
npm run production
```

## 👥 User Accounts & Roles

### Admin Account
- **Email**: admin@example.com
- **Password**: password123
- **Capabilities**: 
  - Full system access
  - User management
  - Customer management
  - User impersonation
  - All reports access
  - AI insights access

### Regular User Account
- **Email**: user@example.com
- **Password**: password123
- **Capabilities**:
  - Customer dashboard access
  - Limited reporting permissions
  - No impersonation capabilities

### Client Account
- **Email**: client@acme.com
- **Password**: password123
- **Capabilities**:
  - Client dashboard only
  - Own customer data access
  - No administrative features

## 🎯 Key Features Detailed

### Smart Insights & Alerts System

#### Advanced Risk Prediction Engine
- **Comprehensive Risk Scoring**: 6-factor weighted analysis
  - Health Score Risk (25%): Current health status impact
  - Engagement Risk (20%): Activity and communication patterns
  - Support Issues Risk (20%): Jira and Zendesk ticket analysis
  - Financial Risk (15%): Renewal likelihood and ARR considerations
  - Product Adoption Risk (10%): Usage breadth and depth
  - Feedback Sentiment Risk (10%): Recent feedback analysis
- **Dynamic Thresholds**: Automatically adjust based on customer value (ARR), health status, and product adoption
- **Real-time Calculation**: Instant risk assessment updates

#### Intelligent Alert System
- **Smart Alert Types**:
  - Health Score Decline: Detects declining health patterns
  - Product Adoption Stagnation: Identifies expansion opportunities
  - Escalation Risk: Multi-factor risk assessment (50+ risk score)
  - Enhanced Traditional Alerts: All existing alerts with smart thresholds
- **Priority Scoring**: Based on severity + customer value + health status
- **Automatic Ranking**: Alerts sorted by urgency and business impact

#### Customer Behavior Analytics
- **5-Tier Behavior Categories**:
  - **Champion** (80-100): High engagement across all areas
  - **Advocate** (60-79): Good engagement with minor gaps
  - **Passive** (40-59): Moderate engagement levels
  - **At Risk** (20-39): Poor engagement patterns
  - **Critical** (0-19): Minimal engagement, immediate attention needed
- **Multi-Factor Scoring**: Product adoption, support engagement, development collaboration, sales relationship, activity consistency

#### Advanced Trend Analysis
- **Historical Pattern Detection**: 5-point moving averages with confidence scoring
- **Multi-Dimensional Analysis**: Health, engagement, and satisfaction trends
- **Predictive Direction**: Improving, declining, stable with variations
- **Confidence Metrics**: Mathematical confidence in trend predictions

#### Portfolio Analytics Dashboard
- **Real-time Risk Assessment**: Portfolio-wide risk scoring
- **Behavior Distribution**: Visual breakdown of customer categories
- **Trend Direction Indicators**: Overall portfolio movement patterns
- **Smart Analytics Chips**: Color-coded visual indicators for quick insights

### User Impersonation System
- **Admin Capability**: Impersonate any user or customer
- **Secure Tokens**: Separate JWT tokens for impersonation sessions
- **Activity Logging**: Complete audit trail of impersonation activities
- **Session Management**: 2-hour time limits with manual stop capability
- **UI Indicators**: Clear visual indicators when impersonating

### Advanced Avatar System
- **Role-Based Colors**: Visual role identification (Admin=Blue, Client=Gray, User=Info)
- **Animated Indicators**: Spinning borders for impersonation, pulsing status badges
- **Smart Initials**: Two-letter initials from names with fallbacks
- **Hover Effects**: Smooth animations and interactive feedback
- **Status Badges**: Role indicators with icons (A/C/U/I)

### Comprehensive Reporting Engine
**Available Report Types:**
1. **Customer Health** - Portfolio health analysis
2. **QBR** - Quarterly Business Reviews
3. **Customer 360** - Complete customer profiles
4. **Customer Usage** - Product adoption metrics
5. **Customer Support** - Support ticket analysis
6. **Portfolio** - Portfolio-wide insights
7. **Onboarding** - Project progress reports
8. **Alerts** - System alerts and notifications
9. **Financial** - Revenue and ARR analysis
10. **Dashboard** - Executive summaries

**Report Features:**
- Professional PDF exports with branded templates
- Role-based access control
- Custom filtering and date ranges
- Automated scheduling capabilities
- Template gallery with previews

### AI-Powered Insights
- **Enhanced Risk Analysis**: Comprehensive 6-factor risk scoring with dynamic thresholds
- **Customer Behavior Analysis**: 5-tier behavior categorization with engagement patterns
- **Advanced Trend Detection**: Multi-dimensional trend analysis (health, engagement, satisfaction)
- **Predictive Modeling**: Renewal likelihood calculation with automated factors
- **Opportunity Detection**: Surface expansion and upsell opportunities
- **Smart Recommendations**: Context-aware actionable insights for customer success
- **Portfolio Intelligence**: Real-time portfolio analytics with risk distribution
- **Escalation Prevention**: Early warning system for customer escalation risks

### Third-Party Integrations
- **Jira Integration**: Track development issues and project progress
- **Zendesk Integration**: Monitor support tickets and satisfaction
- **HubSpot Integration**: Sales pipeline and engagement tracking
- **Real-time Sync**: Automatic data updates and health score recalculation

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `GET /api/auth/me` - Get current user info

### User Management (Admin Only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/permissions` - Update user permissions

### Customer Management
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer (admin only)
- `PUT /api/customers/:id` - Update customer (admin only)
- `DELETE /api/customers/:id` - Delete customer (admin only)
- `GET /api/customers/:id/tickets` - Get customer support tickets
- `GET /api/customers/:id/jira-tickets` - Get customer Jira issues

### Impersonation (Admin Only)
- `POST /api/impersonation/start` - Start impersonation session
- `POST /api/impersonation/stop` - Stop impersonation session
- `GET /api/impersonation/history` - Get impersonation history
- `GET /api/impersonation/available-targets` - Get impersonation targets

### Reporting Engine
- `POST /api/reports/generate` - Generate new report
- `GET /api/reports` - Get user's reports
- `GET /api/reports/templates` - Get available report templates
- `POST /api/reports/:id/export` - Export report to PDF
- `DELETE /api/reports/:id` - Delete report

### AI Insights (Admin Only)
- `GET /api/ai-insights/customer/:id` - Get customer AI insights
- `GET /api/ai-insights/portfolio` - Get portfolio insights
- `GET /api/ai-insights/risk-analysis` - Get risk analysis
- `GET /api/ai-insights/recommendations` - Get AI recommendations

### Smart Alerts & Analytics
- `GET /api/alerts/dashboard-insights` - Get enhanced dashboard insights with analytics
- `GET /api/alerts` - Get all active alerts with intelligent prioritization
- `POST /api/alerts/refresh-ai-summary` - Refresh AI-generated alert summaries
- `GET /api/customers/:id/calculate-renewal` - Calculate automated renewal likelihood

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permission system
- **Password Hashing**: bcrypt with salt rounds
- **API Rate Limiting**: Protection against abuse
- **Input Validation**: Mongoose schema validation
- **CORS Protection**: Configured for production
- **Helmet Security**: HTTP header security
- **Environment Variables**: Secure configuration management

## 🎨 UI/UX Features

### Modern Design System
- **Glass-morphism**: Semi-transparent components with backdrop blur
- **Aviation Theme**: Blue gradient color palette
- **Dark Mode**: Optimized for dark backgrounds
- **Consistent Typography**: Inter font family with proper weights
- **Professional Animations**: Smooth transitions and hover effects

### Navigation
- **Consistent Header**: Unified navigation across all pages
- **Breadcrumbs**: Clear page hierarchy indicators
- **Context-Aware Menus**: Role-based menu items
- **Mobile Responsive**: Optimized for all screen sizes

## 🔧 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check MongoDB status
systemctl status mongod

# Test connection
mongo --eval "db.adminCommand('ismaster')"
```

#### API Integration Issues
- Verify API credentials in `.env`
- Check network connectivity
- Review API rate limits
- Monitor API responses in browser dev tools

#### AI Integration Issues
- Ensure OpenAI API key is valid
- Check API quota and billing
- Verify network access to OpenAI endpoints
- Review OpenAI API documentation for model availability

#### PDF Export Issues
- Ensure sufficient server memory
- Check file system permissions
- Verify html-pdf-node dependencies

### Performance Optimization
- **Database Indexing**: Optimized queries for large datasets
- **React Optimization**: Proper component memoization
- **API Caching**: Intelligent caching strategies
- **Lazy Loading**: Efficient component loading
- **Smart Analytics Caching**: Efficient portfolio analytics computation
- **Real-time Updates**: Optimized alert generation and trend analysis
- **Batch Processing**: Efficient multi-customer risk assessment

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
1. Set up MongoDB instance
2. Configure environment variables
3. Build frontend: `npm run build`
4. Start production server: `npm run production`

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=<production-mongodb-uri>
JWT_SECRET=<secure-jwt-secret>
OPENAI_API_KEY=<production-openai-key>
PORT=5000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- 📖 **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Comprehensive problem-solving guide
- 📚 **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference with examples
- 🚀 **[Quick Setup](./setup.sh)** - Automated setup script
- 🧪 **[API Testing](./test-api.sh)** - API endpoint testing script
- Create an issue in the repository

---

## 🌟 Latest Enhancements

### Smart Insights & Alerts (v2.0)
- **ML-Inspired Risk Engine**: 6-factor comprehensive risk scoring
- **Dynamic Alert Thresholds**: Customer value and health-adaptive monitoring
- **Intelligent Prioritization**: Urgency and impact-based alert ranking
- **Behavior Analytics**: 5-tier customer categorization system
- **Advanced Trend Detection**: Historical pattern analysis with confidence scoring
- **Real-time Portfolio Analytics**: Live risk assessment and trend indicators
- **Predictive Modeling**: Enhanced renewal likelihood and escalation risk detection

**Built with ❤️ and ⚡ AI for customer success teams**