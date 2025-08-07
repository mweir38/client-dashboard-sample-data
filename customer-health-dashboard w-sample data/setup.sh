#!/bin/bash

# Customer Health Dashboard Setup Script
# This script automates the initial setup and configuration

echo "🚀 Customer Health Dashboard Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status messages
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "success" ]; then
        echo -e "${GREEN}✓${NC} $message"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}✗${NC} $message"
    elif [ "$status" = "info" ]; then
        echo -e "${BLUE}ℹ${NC} $message"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
    fi
}

# Check prerequisites
echo -e "${BLUE}📋 Checking Prerequisites${NC}"
echo "========================="

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status "success" "Node.js $NODE_VERSION is installed"
else
    print_status "error" "Node.js is not installed. Please install Node.js v16 or higher"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status "success" "npm $NPM_VERSION is installed"
else
    print_status "error" "npm is not installed"
    exit 1
fi

# Check MongoDB
if command_exists mongod || command_exists mongo; then
    print_status "success" "MongoDB is installed"
    
    # Try to connect to MongoDB
    if mongo --eval "db.adminCommand('ismaster')" >/dev/null 2>&1; then
        print_status "success" "MongoDB is running and accessible"
    else
        print_status "warning" "MongoDB is installed but not running or not accessible"
        echo "  Please start MongoDB: sudo systemctl start mongod"
    fi
else
    print_status "warning" "MongoDB not found. You can use MongoDB Atlas instead"
    echo "  Install MongoDB: https://docs.mongodb.com/manual/installation/"
fi

# Check Git
if command_exists git; then
    print_status "success" "Git is installed"
else
    print_status "warning" "Git is not installed (optional)"
fi

echo ""

# Install dependencies
echo -e "${BLUE}📦 Installing Dependencies${NC}"
echo "=========================="

# Install backend dependencies
echo "Installing backend dependencies..."
cd server
if npm install; then
    print_status "success" "Backend dependencies installed"
else
    print_status "error" "Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../client
if npm install; then
    print_status "success" "Frontend dependencies installed"
else
    print_status "error" "Failed to install frontend dependencies"
    exit 1
fi

cd ..

echo ""

# Environment configuration
echo -e "${BLUE}⚙️ Environment Configuration${NC}"
echo "============================="

ENV_FILE="server/.env"

if [ ! -f "$ENV_FILE" ]; then
    print_status "info" "Creating environment configuration file..."
    
    cat > "$ENV_FILE" << 'EOF'
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/customer-health-dashboard
# For MongoDB Atlas, use:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/customer-health-dashboard

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-characters

# AI Integration (Required for AI Insights)
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your-openai-api-key-here

# Third-Party API Keys (Optional - for real integrations)
# Jira Configuration
JIRA_API_TOKEN=your-jira-api-token
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com

# Zendesk Configuration
ZENDESK_API_TOKEN=your-zendesk-api-token
ZENDESK_SUBDOMAIN=your-zendesk-subdomain
ZENDESK_EMAIL=your-email@company.com

# HubSpot Configuration
HUBSPOT_API_KEY=your-hubspot-api-key

# Server Configuration
NODE_ENV=development
PORT=5000
EOF

    print_status "success" "Environment file created at $ENV_FILE"
    echo ""
    print_status "warning" "IMPORTANT: Please update the following in $ENV_FILE:"
    echo "  1. Set a secure JWT_SECRET (minimum 32 characters)"
    echo "  2. Add your OpenAI API key for AI insights"
    echo "  3. Configure third-party API keys if needed"
    echo "  4. Update MongoDB URI if using Atlas or custom settings"
else
    print_status "info" "Environment file already exists at $ENV_FILE"
fi

echo ""

# Database initialization
echo -e "${BLUE}🗄️ Database Initialization${NC}"
echo "=========================="

cd server

# Check if we can connect to MongoDB
if mongo --eval "db.adminCommand('ismaster')" >/dev/null 2>&1; then
    print_status "info" "Initializing database with default users..."
    
    if node seed.js; then
        print_status "success" "Database initialized successfully"
        echo ""
        echo -e "${GREEN}Default Users Created:${NC}"
        echo "  📧 Admin: admin@example.com / password123"
        echo "  📧 User: user@example.com / password123"
        echo "  📧 Client: client@acme.com / password123"
    else
        print_status "error" "Failed to initialize database"
        echo "  Please check your MongoDB connection and try again"
    fi
else
    print_status "warning" "Cannot connect to MongoDB"
    echo "  Database initialization skipped"
    echo "  Please ensure MongoDB is running and run: node seed.js"
fi

cd ..

echo ""

# Create helpful scripts
echo -e "${BLUE}📝 Creating Helper Scripts${NC}"
echo "========================="

# Start script
cat > start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Customer Health Dashboard"
echo "====================================="

# Function to check if port is in use
check_port() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Start backend
echo "Starting backend server on port 5000..."
cd server
if check_port 5000; then
    echo "⚠️  Port 5000 is already in use"
    echo "   Kill existing process: lsof -ti:5000 | xargs kill -9"
else
    npm start &
    BACKEND_PID=$!
    echo "✓ Backend started (PID: $BACKEND_PID)"
fi

# Start frontend
echo "Starting frontend server on port 3000..."
cd ../client
if check_port 3000; then
    echo "⚠️  Port 3000 is already in use"
    echo "   Kill existing process: lsof -ti:3000 | xargs kill -9"
else
    npm start &
    FRONTEND_PID=$!
    echo "✓ Frontend started (PID: $FRONTEND_PID)"
fi

echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📚 Documentation:"
echo "   API Docs: ./API_DOCUMENTATION.md"
echo "   Troubleshooting: ./TROUBLESHOOTING.md"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   Or use: pkill -f 'npm start'"

# Keep script running to show logs
wait
EOF

chmod +x start.sh
print_status "success" "Created start.sh script"

# Stop script
cat > stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Customer Health Dashboard"
echo "===================================="

# Kill Node.js processes
pkill -f "node server.js"
pkill -f "npm start"

# Kill specific ports
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5000 | xargs kill -9 2>/dev/null

echo "✓ All servers stopped"
EOF

chmod +x stop.sh
print_status "success" "Created stop.sh script"

# Development script
cat > dev.sh << 'EOF'
#!/bin/bash

echo "🔧 Starting Development Environment"
echo "=================================="

# Install any new dependencies
echo "Checking for dependency updates..."
cd server && npm install && cd ../client && npm install && cd ..

# Start with development settings
export NODE_ENV=development
export DEBUG=*

# Start both servers
./start.sh
EOF

chmod +x dev.sh
print_status "success" "Created dev.sh script"

echo ""

# Final instructions
echo -e "${BLUE}🎉 Setup Complete!${NC}"
echo "=================="
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. 📝 Configure environment variables in server/.env"
echo "2. 🚀 Start the application: ./start.sh"
echo "3. 🌐 Open browser: http://localhost:3000"
echo "4. 🔑 Login with: admin@example.com / password123"
echo ""
echo -e "${GREEN}Available Scripts:${NC}"
echo "• ./start.sh     - Start both frontend and backend"
echo "• ./stop.sh      - Stop all servers"
echo "• ./dev.sh       - Start in development mode"
echo "• ./test-api.sh  - Test API endpoints"
echo ""
echo -e "${GREEN}Documentation:${NC}"
echo "• README.md              - Complete project documentation"
echo "• API_DOCUMENTATION.md   - API reference and examples"
echo "• TROUBLESHOOTING.md     - Common issues and solutions"
echo ""
echo -e "${GREEN}Key Features:${NC}"
echo "• 🧠 Smart AI-powered insights and risk prediction"
echo "• 🚨 Intelligent alert system with dynamic thresholds"
echo "• 👥 User impersonation for support and testing"
echo "• 📊 Comprehensive reporting engine with PDF export"
echo "• 🔒 Role-based access control and security"
echo "• 🔗 Third-party integrations (Jira, Zendesk, HubSpot)"
echo ""
echo -e "${YELLOW}⚠️ Important Notes:${NC}"
echo "• Set a secure JWT_SECRET in production"
echo "• Configure OpenAI API key for AI insights"
echo "• Update default passwords in production"
echo "• Configure third-party integrations as needed"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"