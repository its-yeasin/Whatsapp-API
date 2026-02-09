#!/bin/bash

# Port cleanup and Docker deployment script
# Stops any process using port 3000 and deploys fresh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PORT=3000

echo "🔍 Checking port $PORT..."

# Check if port is in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port $PORT is already in use${NC}"
    
    # Find what's using the port
    echo ""
    echo "Processes using port $PORT:"
    lsof -i :$PORT || true
    
    echo ""
    read -p "Do you want to stop these processes? (y/N): " stop_processes
    
    if [[ $stop_processes =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🛑 Stopping processes on port $PORT...${NC}"
        
        # Try to stop node processes
        pkill -f "node.*server.js" 2>/dev/null || true
        pkill -f "npm.*start" 2>/dev/null || true
        
        # Kill any remaining processes on the port
        lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
        
        sleep 2
        
        if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${RED}❌ Failed to free port $PORT${NC}"
            exit 1
        else
            echo -e "${GREEN}✅ Port $PORT is now free${NC}"
        fi
    else
        echo -e "${RED}❌ Cannot proceed while port $PORT is in use${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Port $PORT is available${NC}"
fi

echo ""
echo "🐳 Starting Docker deployment..."
echo ""

# Run the deploy script
./deploy.sh
