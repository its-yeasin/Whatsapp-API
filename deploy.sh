#!/bin/bash

# WhatsApp API Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Starting WhatsApp API Deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}❗ Please edit .env file with your actual values before continuing!${NC}"
    exit 1
fi

# Check if serviceAccountKey.json exists
if [ ! -f serviceAccountKey.json ]; then
    echo -e "${RED}❌ serviceAccountKey.json not found!${NC}"
    echo "Please add your Firebase service account key file."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Build and start containers
echo "🔨 Building Docker image..."
docker-compose build

echo "🚀 Starting containers..."
docker-compose up -d

# Wait for container to be healthy
echo "⏳ Waiting for container to be healthy..."
sleep 5

# Check container status
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Container is running!${NC}"
    
    # Test health endpoint
    echo "🏥 Testing health endpoint..."
    sleep 3
    PORT=${PORT:-3019}
    if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check failed. Check logs with: docker-compose logs${NC}"
    fi
else
    echo -e "${RED}❌ Container failed to start!${NC}"
    echo "Check logs with: docker-compose logs"
    exit 1
fi

echo ""
echo -e "${GREEN}✨ Deployment completed successfully!${NC}"
echo ""
echo "📊 Container status:"
docker-compose ps
echo ""
echo "📝 Useful commands:"
echo "  View logs:       docker-compose logs -f"
echo "  Restart:         docker-compose restart"
echo "  Stop:            docker-compose stop"
echo "  Remove:          docker-compose down"
echo ""
echo "🌐 API endpoints:"
echo "  Health:          http://localhost:${PORT:-3019}/health"
echo "  Send Message:    http://localhost:${PORT:-3019}/api/messages/send"
echo ""
