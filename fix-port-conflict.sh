#!/bin/bash

# Quick fix for port 3000 conflict
# Run this on your server when you get "port already allocated" error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Finding processes on port 3000...${NC}"
echo ""

# Show what's using port 3000
if command -v lsof &> /dev/null; then
    lsof -i :3000
elif command -v ss &> /dev/null; then
    ss -tulpn | grep :3000
elif command -v netstat &> /dev/null; then
    netstat -tulpn | grep :3000
fi

echo ""
echo -e "${YELLOW}Options:${NC}"
echo "1. Stop Node.js processes and restart Docker"
echo "2. Stop Docker containers only and restart"
echo "3. Stop everything on port 3000"
echo "4. Exit"
echo ""
read -p "Choose option (1-4): " option

case $option in
    1)
        echo -e "${YELLOW}🛑 Stopping Node.js processes...${NC}"
        pkill -f "node" || true
        pkill -f "npm" || true
        echo -e "${GREEN}✅ Node.js processes stopped${NC}"
        ;;
    2)
        echo -e "${YELLOW}🛑 Stopping Docker containers...${NC}"
        docker-compose down || true
        docker stop whatsapp-api 2>/dev/null || true
        docker rm whatsapp-api 2>/dev/null || true
        echo -e "${GREEN}✅ Docker containers stopped${NC}"
        ;;
    3)
        echo -e "${YELLOW}🛑 Stopping all processes on port 3000...${NC}"
        pkill -f "node" || true
        pkill -f "npm" || true
        docker-compose down || true
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✅ All processes stopped${NC}"
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
read -p "Start Docker container now? (y/N): " start_docker

if [[ $start_docker =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🐳 Starting Docker containers...${NC}"
    docker-compose up -d
    
    sleep 3
    
    echo ""
    echo -e "${GREEN}✅ Done!${NC}"
    echo ""
    docker-compose ps
fi
