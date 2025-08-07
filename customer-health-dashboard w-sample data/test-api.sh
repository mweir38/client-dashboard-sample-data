#!/bin/bash

# Customer Health Dashboard API Testing Script
# Usage: ./test-api.sh [base_url] [admin_email] [admin_password]

BASE_URL=${1:-"http://localhost:5000/api"}
ADMIN_EMAIL=${2:-"admin@example.com"}
ADMIN_PASSWORD=${3:-"password123"}

echo "🚀 Customer Health Dashboard API Testing"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo "Admin Email: $ADMIN_EMAIL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to make API calls and check status
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local headers=$4
    local data=$5
    
    echo -e "${BLUE}Testing:${NC} $description"
    echo -e "${YELLOW}$method${NC} $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" $headers -d "$data" -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" $headers)
    fi
    
    # Split response and status code
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    
    if [[ $status_code -ge 200 && $status_code -lt 300 ]]; then
        echo -e "${GREEN}✓ Success ($status_code)${NC}"
        if command -v jq &> /dev/null; then
            echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
        else
            echo "$response_body"
        fi
    else
        echo -e "${RED}✗ Failed ($status_code)${NC}"
        echo "$response_body"
    fi
    echo ""
}

# Step 1: Health Check
echo -e "${BLUE}🏥 Health Check${NC}"
echo "================="
test_endpoint "GET" "/health" "Server health check"

# Step 2: Authentication
echo -e "${BLUE}🔐 Authentication${NC}"
echo "=================="
auth_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

if command -v jq &> /dev/null; then
    TOKEN=$(echo "$auth_response" | jq -r '.token // empty')
else
    TOKEN=$(echo "$auth_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✓ Authentication successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
    AUTH_HEADER="-H \"Authorization: Bearer $TOKEN\""
else
    echo -e "${RED}✗ Authentication failed${NC}"
    echo "Response: $auth_response"
    echo ""
    echo "Please ensure:"
    echo "1. Server is running on $BASE_URL"
    echo "2. Database is seeded with admin user"
    echo "3. Credentials are correct"
    exit 1
fi
echo ""

# Step 3: User Management
echo -e "${BLUE}👥 User Management${NC}"
echo "=================="
test_endpoint "GET" "/auth/me" "Get current user info" "$AUTH_HEADER"
test_endpoint "GET" "/users" "Get all users (admin only)" "$AUTH_HEADER"

# Step 4: Customer Management
echo -e "${BLUE}🏢 Customer Management${NC}"
echo "======================"
test_endpoint "GET" "/customers" "Get all customers" "$AUTH_HEADER"
test_endpoint "GET" "/customers?limit=2" "Get customers with pagination" "$AUTH_HEADER"

# Get first customer ID for detailed tests
customers_response=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/customers?limit=1")
if command -v jq &> /dev/null; then
    CUSTOMER_ID=$(echo "$customers_response" | jq -r '.customers[0].id // .customers[0]._id // empty' 2>/dev/null)
else
    CUSTOMER_ID=$(echo "$customers_response" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -n "$CUSTOMER_ID" ]; then
    echo -e "${GREEN}Found customer ID:${NC} $CUSTOMER_ID"
    test_endpoint "GET" "/customers/$CUSTOMER_ID/tickets" "Get customer tickets" "$AUTH_HEADER"
    test_endpoint "GET" "/customers/$CUSTOMER_ID/jira-tickets" "Get customer Jira issues" "$AUTH_HEADER"
    test_endpoint "GET" "/customers/$CUSTOMER_ID/calculate-renewal" "Calculate renewal likelihood" "$AUTH_HEADER"
fi

# Step 5: Smart Alerts & Analytics
echo -e "${BLUE}🚨 Smart Alerts & Analytics${NC}"
echo "============================="
test_endpoint "GET" "/alerts/dashboard-insights" "Get dashboard insights with analytics" "$AUTH_HEADER"
test_endpoint "GET" "/alerts" "Get all alerts with prioritization" "$AUTH_HEADER"

# Step 6: Reporting
echo -e "${BLUE}📊 Reporting Engine${NC}"
echo "=================="
test_endpoint "GET" "/reports/templates" "Get report templates" "$AUTH_HEADER"
test_endpoint "GET" "/reports" "Get user reports" "$AUTH_HEADER"

# Step 7: Impersonation
echo -e "${BLUE}🔄 Impersonation${NC}"
echo "================"
test_endpoint "GET" "/impersonation/available-targets" "Get impersonation targets (admin only)" "$AUTH_HEADER"
test_endpoint "GET" "/impersonation/history" "Get impersonation history (admin only)" "$AUTH_HEADER"

# Step 8: AI Insights (if available)
echo -e "${BLUE}🤖 AI Insights${NC}"
echo "==============="
if [ -n "$CUSTOMER_ID" ]; then
    test_endpoint "GET" "/ai-insights/customer/$CUSTOMER_ID" "Get customer AI insights (admin only)" "$AUTH_HEADER"
fi
test_endpoint "GET" "/ai-insights/portfolio" "Get portfolio AI insights (admin only)" "$AUTH_HEADER"

# Step 9: Performance Test
echo -e "${BLUE}⚡ Performance Test${NC}"
echo "==================="
echo "Testing response times for key endpoints..."

start_time=$(date +%s%N)
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/customers" > /dev/null
end_time=$(date +%s%N)
duration=$(((end_time - start_time) / 1000000))
echo -e "${GREEN}Customers endpoint:${NC} ${duration}ms"

start_time=$(date +%s%N)
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/alerts/dashboard-insights" > /dev/null
end_time=$(date +%s%N)
duration=$(((end_time - start_time) / 1000000))
echo -e "${GREEN}Dashboard insights:${NC} ${duration}ms"

echo ""
echo -e "${GREEN}🎉 API Testing Complete!${NC}"
echo ""
echo "📚 Additional Resources:"
echo "- API Documentation: ./API_DOCUMENTATION.md"
echo "- Troubleshooting Guide: ./TROUBLESHOOTING.md"
echo "- README: ./README.md"
echo ""
echo "💡 Tips:"
echo "- Install 'jq' for better JSON formatting: brew install jq (macOS) or apt-get install jq (Ubuntu)"
echo "- Use Postman collection for interactive testing"
echo "- Check server logs if any tests fail: tail -f server/logs/app.log"
echo "- Verify environment variables are set correctly"