# API Documentation

Complete API reference for the Customer Health Dashboard platform.

## 🔗 Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

## 👤 Authentication Endpoints

### POST `/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "admin|user|client",
    "customerId": "string (if client)"
  }
}
```

**Errors:**
- `400`: Invalid input data
- `401`: Invalid credentials
- `500`: Server error

### POST `/auth/register`
Register new user (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required, min 6 chars)",
  "role": "admin|user|client",
  "customerId": "string (required if role is client)"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  }
}
```

### GET `/auth/me`
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "string",
  "customerId": "string (if applicable)",
  "isImpersonation": "boolean",
  "impersonationData": {
    "originalUserId": "string",
    "reason": "string",
    "startedAt": "datetime"
  }
}
```

## 👥 User Management Endpoints

### GET `/users`
Get all users (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `role`: Filter by role (admin|user|client)
- `customerId`: Filter by customer ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response (200):**
```json
{
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "customerId": "string",
      "createdAt": "datetime",
      "lastLogin": "datetime",
      "canImpersonate": "boolean",
      "reportingPermissions": ["string"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### POST `/users`
Create new user (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required)",
  "role": "admin|user|client (required)",
  "customerId": "string (required if role is client)",
  "canImpersonate": "boolean (default: false)",
  "reportingPermissions": ["string array"]
}
```

### PUT `/users/:id`
Update user (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "role": "string",
  "customerId": "string",
  "canImpersonate": "boolean",
  "reportingPermissions": ["string"]
}
```

### DELETE `/users/:id`
Delete user (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

### PUT `/users/:id/permissions`
Update user permissions (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "reportingPermissions": ["customer-health", "qbr", "portfolio"],
  "canImpersonate": true
}
```

## 🏢 Customer Management Endpoints

### GET `/customers`
Get all customers.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `healthScore[gte]`: Minimum health score
- `healthScore[lte]`: Maximum health score
- `renewalLikelihood`: Filter by renewal likelihood
- `search`: Search by name or email
- `page`: Page number
- `limit`: Items per page

**Response (200):**
```json
{
  "customers": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "arr": "number",
      "healthScore": "number (0-10)",
      "renewalLikelihood": "low|medium|high",
      "renewalDate": "date",
      "tools": ["string"],
      "productUsage": [
        {
          "name": "string",
          "type": "OC|OC2|EFB|Flight Planner|PCS|VMO Manager|Other",
          "customName": "string"
        }
      ],
      "integrationData": {
        "jira": {
          "openIssues": "number",
          "criticalIssues": "number",
          "lastSync": "datetime"
        },
        "zendesk": {
          "openTickets": "number",
          "satisfactionScore": "number",
          "urgentTickets": "number"
        },
        "hubspot": {
          "openDeals": "number",
          "lastActivity": "datetime"
        }
      },
      "healthScoreHistory": [
        {
          "date": "datetime",
          "score": "number"
        }
      ],
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### POST `/customers`
Create new customer (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string",
  "arr": "number",
  "healthScore": "number (0-10)",
  "renewalLikelihood": "low|medium|high",
  "renewalDate": "date",
  "tools": ["string"],
  "productUsage": [
    {
      "name": "string (required)",
      "type": "string (required)",
      "customName": "string (if type is Other)"
    }
  ]
}
```

### PUT `/customers/:id`
Update customer (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:** Same as POST (all fields optional)

### DELETE `/customers/:id`
Delete customer (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

### GET `/customers/:id/calculate-renewal`
Calculate automated renewal likelihood.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "customerId": "string",
  "customerName": "string",
  "currentRenewalLikelihood": "string",
  "calculatedRenewalLikelihood": "string",
  "calculatedScore": "number",
  "factors": [
    "Health Score: 7.5/10",
    "Product Usage: 3 products",
    "Support Satisfaction: 85%"
  ],
  "calculationDate": "datetime"
}
```

### GET `/customers/:id/tickets`
Get customer support tickets.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: Filter by status (open|closed|pending)
- `priority`: Filter by priority (low|medium|high|urgent)
- `dateFrom`: Start date filter
- `dateTo`: End date filter
- `page`: Page number
- `limit`: Items per page

**Response (200):**
```json
{
  "tickets": [
    {
      "id": "string",
      "subject": "string",
      "status": "string",
      "priority": "string",
      "created_at": "datetime",
      "updated_at": "datetime",
      "requester": {
        "name": "string",
        "email": "string"
      },
      "assignee": {
        "name": "string",
        "email": "string"
      },
      "satisfaction_rating": {
        "score": "string",
        "comment": "string"
      }
    }
  ],
  "summary": {
    "total": 100,
    "open": 25,
    "closed": 70,
    "pending": 5,
    "avgResolutionTime": "48 hours",
    "satisfactionScore": 85
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET `/customers/:id/jira-tickets`
Get customer Jira issues.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:** Similar to tickets endpoint

**Response (200):**
```json
{
  "issues": [
    {
      "id": "string",
      "key": "string",
      "summary": "string",
      "status": "string",
      "priority": "string",
      "issueType": "string",
      "created": "datetime",
      "updated": "datetime",
      "assignee": {
        "displayName": "string",
        "emailAddress": "string"
      },
      "reporter": {
        "displayName": "string",
        "emailAddress": "string"
      }
    }
  ],
  "summary": {
    "total": 50,
    "open": 15,
    "inProgress": 10,
    "done": 25,
    "critical": 2,
    "avgResolutionTime": "5 days"
  }
}
```

## 🔄 Impersonation Endpoints

### GET `/impersonation/available-targets`
Get available impersonation targets (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Response (200):**
```json
{
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "customerId": "string",
      "customerName": "string"
    }
  ],
  "customers": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "healthScore": "number"
    }
  ]
}
```

### POST `/impersonation/start`
Start impersonation session (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "targetType": "user|customer (required)",
  "targetId": "string (required)",
  "reason": "string (required)"
}
```

**Response (200):**
```json
{
  "impersonationToken": "string",
  "expiresAt": "datetime",
  "targetUser": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "customerId": "string"
  },
  "targetCustomer": {
    "id": "string",
    "name": "string",
    "email": "string"
  }
}
```

### POST `/impersonation/stop`
Stop current impersonation session.

**Headers:** `Authorization: Bearer <impersonation-token>`

**Response (200):**
```json
{
  "message": "Impersonation session ended",
  "originalToken": "string"
}
```

### GET `/impersonation/history`
Get impersonation history (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `userId`: Filter by user who performed impersonation
- `targetType`: Filter by target type
- `dateFrom`: Start date filter
- `dateTo`: End date filter

**Response (200):**
```json
{
  "history": [
    {
      "id": "string",
      "userId": "string",
      "userName": "string",
      "targetType": "string",
      "targetId": "string",
      "targetName": "string",
      "reason": "string",
      "startedAt": "datetime",
      "endedAt": "datetime",
      "duration": "string"
    }
  ]
}
```

## 📊 Reporting Endpoints

### GET `/reports/templates`
Get available report templates.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "templates": [
    {
      "id": "customer-health",
      "name": "Customer Health Report",
      "description": "Comprehensive customer health analysis",
      "category": "health",
      "requiredPermission": "customer-health",
      "parameters": [
        {
          "name": "customerId",
          "type": "select",
          "required": true,
          "options": ["customer-list"]
        },
        {
          "name": "dateRange",
          "type": "daterange",
          "required": false,
          "default": "last-30-days"
        }
      ]
    }
  ]
}
```

### POST `/reports/generate`
Generate new report.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "templateId": "string (required)",
  "title": "string",
  "parameters": {
    "customerId": "string",
    "dateRange": {
      "start": "date",
      "end": "date"
    },
    "includeCharts": "boolean"
  }
}
```

**Response (201):**
```json
{
  "reportId": "string",
  "title": "string",
  "status": "generating|completed|failed",
  "createdAt": "datetime",
  "estimatedCompletion": "datetime"
}
```

### GET `/reports`
Get user's reports.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: Filter by status
- `templateId`: Filter by template
- `page`: Page number
- `limit`: Items per page

**Response (200):**
```json
{
  "reports": [
    {
      "id": "string",
      "title": "string",
      "templateId": "string",
      "templateName": "string",
      "status": "string",
      "createdAt": "datetime",
      "completedAt": "datetime",
      "parameters": "object",
      "fileSize": "number",
      "downloadUrl": "string"
    }
  ]
}
```

### GET `/reports/:id`
Get specific report details.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "string",
  "title": "string",
  "templateId": "string",
  "status": "string",
  "content": "object",
  "parameters": "object",
  "createdAt": "datetime",
  "completedAt": "datetime",
  "fileSize": "number"
}
```

### POST `/reports/:id/export`
Export report to PDF.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "format": "pdf (default)",
  "options": {
    "includeCharts": "boolean",
    "paperSize": "A4|Letter",
    "orientation": "portrait|landscape"
  }
}
```

**Response (200):** PDF file download

### DELETE `/reports/:id`
Delete report.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Report deleted successfully"
}
```

## 🚨 Smart Alerts & Analytics Endpoints

### GET `/alerts/dashboard-insights`
Get enhanced dashboard insights with smart analytics.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "summary": {
    "totalAlerts": 15,
    "criticalAlerts": 3,
    "highAlerts": 7,
    "actionRequired": 8
  },
  "insights": [
    {
      "type": "critical",
      "title": "3 Critical Alerts",
      "description": "Immediate attention required for 3 customers",
      "count": 3,
      "priority": 1
    }
  ],
  "alertTypes": {
    "negative_feedback": 2,
    "renewal_risk": 4,
    "low_engagement": 5,
    "health_decline": 3,
    "escalation_risk": 1
  },
  "topRiskCustomers": [
    {
      "customerId": "string",
      "customerName": "string",
      "count": 4,
      "criticalCount": 2
    }
  ],
  "analytics": {
    "riskScore": 38,
    "behaviorScore": {
      "category": "At Risk",
      "distribution": {
        "Champion": 1,
        "Advocate": 0,
        "Passive": 0,
        "At Risk": 4,
        "Critical": 0
      }
    },
    "trendDirection": "declining",
    "trendDistribution": {
      "improving": 1,
      "declining": 4,
      "stable": 0
    },
    "totalCustomers": 5
  },
  "lastUpdated": "datetime"
}
```

### GET `/alerts`
Get all active alerts with intelligent prioritization.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `customerId`: Filter by customer
- `severity`: Filter by severity (low|medium|high|critical)
- `type`: Filter by alert type
- `status`: Filter by status (open|acknowledged|resolved|closed)
- `priority`: Filter by priority (low|medium|high|urgent)
- `page`: Page number
- `limit`: Items per page

**Response (200):**
```json
{
  "alerts": [
    {
      "id": "string",
      "type": "health_decline|product_adoption_stagnation|escalation_risk|...",
      "severity": "low|medium|high|critical",
      "priority": "low|medium|high|urgent",
      "priorityScore": "number",
      "title": "string",
      "description": "string",
      "customerId": "string",
      "customerName": "string",
      "status": "open|acknowledged|resolved|closed",
      "actionRequired": "boolean",
      "data": {
        "riskScore": "number",
        "decline": "number",
        "threshold": "number",
        "factors": ["string"]
      },
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "acknowledgedBy": "string",
      "acknowledgedAt": "datetime",
      "resolvedBy": "string",
      "resolvedAt": "datetime"
    }
  ],
  "summary": {
    "total": 50,
    "open": 35,
    "acknowledged": 10,
    "resolved": 5,
    "byPriority": {
      "urgent": 5,
      "high": 15,
      "medium": 20,
      "low": 10
    },
    "bySeverity": {
      "critical": 3,
      "high": 12,
      "medium": 25,
      "low": 10
    }
  }
}
```

### POST `/alerts/refresh-ai-summary`
Refresh AI-generated alert summaries (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Response (200):**
```json
{
  "message": "AI summary refresh completed",
  "results": [
    {
      "customerId": "string",
      "customerName": "string",
      "alertCount": 3,
      "summaryLength": 150,
      "updated": true
    }
  ],
  "totalCustomers": 25,
  "successfulUpdates": 23
}
```

### PUT `/alerts/:id/acknowledge`
Acknowledge an alert.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "notes": "string"
}
```

### PUT `/alerts/:id/resolve`
Resolve an alert.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "resolutionNotes": "string (required)",
  "actionsTaken": ["string"]
}
```

## 🤖 AI Insights Endpoints (Admin Only)

### GET `/ai-insights/customer/:id`
Get AI insights for specific customer.

**Headers:** `Authorization: Bearer <admin-token>`

**Response (200):**
```json
{
  "customer": {
    "id": "string",
    "name": "string",
    "arr": "number",
    "healthScore": "number"
  },
  "riskAnalysis": {
    "overallRisk": "low|medium|high|critical",
    "riskScore": "number (0-100)",
    "factors": [
      {
        "category": "engagement",
        "risk": "high",
        "description": "Low activity in past 30 days",
        "recommendation": "Schedule check-in call"
      }
    ]
  },
  "behaviorScore": {
    "score": 65,
    "category": "Advocate",
    "factors": [
      "High product adoption",
      "Good support satisfaction"
    ]
  },
  "trendPatterns": {
    "healthTrend": {
      "direction": "declining",
      "confidence": 75,
      "avgChange": -0.5
    },
    "engagementTrend": {
      "direction": "stable",
      "confidence": 60,
      "score": 55
    },
    "satisfactionTrend": {
      "direction": "improving",
      "confidence": 80,
      "avgRating": 4.2,
      "change": 0.3
    },
    "predictedDirection": "slightly_declining"
  },
  "opportunities": [
    {
      "type": "expansion",
      "confidence": "high",
      "description": "Customer shows strong engagement with core product",
      "recommendation": "Introduce advanced features"
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "category": "engagement",
      "action": "Schedule quarterly business review",
      "rationale": "Customer shows declining health trend"
    }
  ],
  "predictiveInsights": {
    "churnRisk": "medium",
    "renewalLikelihood": "high",
    "expansionPotential": "high",
    "timeToChurn": "6+ months"
  },
  "actionItems": [
    {
      "priority": "urgent",
      "task": "Address support ticket backlog",
      "assignee": "customer-success-team",
      "dueDate": "2024-01-15"
    }
  ],
  "priority": "high"
}
```

### GET `/ai-insights/portfolio`
Get portfolio-wide AI insights.

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `segment`: Filter by customer segment
- `riskLevel`: Filter by risk level
- `dateRange`: Analysis date range

**Response (200):**
```json
{
  "portfolioOverview": {
    "totalCustomers": 150,
    "averageHealthScore": 7.2,
    "totalARR": 5000000,
    "churnRisk": "medium"
  },
  "riskSegments": {
    "high": 15,
    "medium": 45,
    "low": 90
  },
  "growthOpportunities": [
    {
      "segment": "enterprise",
      "opportunity": "Advanced analytics adoption",
      "potential": "$500K ARR",
      "confidence": "high"
    }
  ],
  "churnPredictions": {
    "next30Days": 2,
    "next90Days": 8,
    "next180Days": 15
  },
  "marketInsights": {
    "trends": ["Increased automation demand", "Integration focus"],
    "competitorActivity": "moderate",
    "marketSentiment": "positive"
  },
  "strategicRecommendations": {
    "shortTerm": [
      "Implement customer health monitoring dashboard",
      "Establish proactive engagement program"
    ],
    "mediumTerm": [
      "Expand AI-powered insights capabilities",
      "Build predictive analytics platform"
    ],
    "longTerm": [
      "Develop comprehensive customer success platform",
      "Create industry-specific solutions"
    ]
  }
}
```

## 📈 Health & Metrics Endpoints

### GET `/health`
Server health check.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "datetime",
  "version": "1.0.0",
  "uptime": "5d 10h 30m",
  "database": "connected",
  "memory": {
    "used": "256MB",
    "total": "512MB"
  }
}
```

### GET `/metrics`
System metrics (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Response (200):**
```json
{
  "requests": {
    "total": 50000,
    "per_minute": 150,
    "success_rate": 99.2
  },
  "database": {
    "connections": 5,
    "avg_query_time": "50ms",
    "slow_queries": 3
  },
  "alerts": {
    "active": 25,
    "generated_today": 15,
    "resolved_today": 12
  },
  "users": {
    "total": 50,
    "active_sessions": 15,
    "last_hour_logins": 8
  }
}
```

## 🔄 Webhook Endpoints

### POST `/webhooks/jira`
Jira webhook endpoint for real-time updates.

**Headers:** 
- `X-Jira-Webhook-Secret`: Webhook secret
- `Content-Type`: application/json

**Request Body:** Jira webhook payload

### POST `/webhooks/zendesk`
Zendesk webhook endpoint.

**Headers:**
- `X-Zendesk-Webhook-Secret`: Webhook secret
- `Content-Type`: application/json

**Request Body:** Zendesk webhook payload

### POST `/webhooks/hubspot`
HubSpot webhook endpoint.

**Headers:**
- `X-HubSpot-Signature`: Webhook signature
- `Content-Type`: application/json

**Request Body:** HubSpot webhook payload

## 📝 Error Responses

### Standard Error Format
```json
{
  "error": "string",
  "message": "string",
  "details": "object (optional)",
  "timestamp": "datetime",
  "path": "string",
  "method": "string"
}
```

### Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate data)
- **422**: Unprocessable Entity (business logic errors)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

### Error Examples

**400 - Validation Error:**
```json
{
  "error": "Validation failed",
  "message": "Invalid input data",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
```

**401 - Authentication Error:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**403 - Permission Error:**
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions for this operation"
}
```

**429 - Rate Limit Error:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Try again in 60 seconds",
  "retryAfter": 60
}
```

## 🔧 Rate Limiting

API endpoints are rate limited to prevent abuse:

- **General endpoints**: 100 requests per minute per IP
- **Authentication endpoints**: 5 requests per minute per IP
- **AI insights endpoints**: 50 requests per minute per user
- **Report generation**: 10 requests per minute per user

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641024000
```

## 📊 Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Pagination response format:
```json
{
  "data": ["array of items"],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🔍 Filtering & Search

Many endpoints support filtering and search:

### Common Query Parameters
- `search`: Text search across relevant fields
- `sort`: Sort field (prefix with `-` for descending)
- `fields`: Comma-separated list of fields to return
- `dateFrom`/`dateTo`: Date range filters

### Examples
```http
GET /api/customers?search=acme&sort=-healthScore&fields=name,healthScore
GET /api/alerts?severity=high&status=open&dateFrom=2024-01-01
```

## 🚀 SDKs & Examples

### JavaScript/Node.js Example
```javascript
const axios = require('axios');

class CustomerHealthAPI {
  constructor(baseURL, token) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getCustomers(params = {}) {
    const response = await this.client.get('/customers', { params });
    return response.data;
  }

  async getDashboardInsights() {
    const response = await this.client.get('/alerts/dashboard-insights');
    return response.data;
  }

  async generateReport(templateId, parameters) {
    const response = await this.client.post('/reports/generate', {
      templateId,
      parameters
    });
    return response.data;
  }
}

// Usage
const api = new CustomerHealthAPI('http://localhost:5000/api', 'your-token');
const insights = await api.getDashboardInsights();
```

### cURL Examples
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Get customers with health score filter
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/customers?healthScore[lte]=5&sort=-arr"

# Get dashboard insights
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/alerts/dashboard-insights

# Start impersonation
curl -X POST http://localhost:5000/api/impersonation/start \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetType":"customer","targetId":"CUSTOMER_ID","reason":"Support issue"}'
```

---

## 📚 Additional Resources

- [Authentication Guide](./README.md#authentication)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Rate Limiting Best Practices](./README.md#rate-limiting)
- [Webhook Security](./README.md#webhook-security)

For questions or issues, please create an issue in the repository or contact the development team.