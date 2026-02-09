#!/bin/bash

# 502 Bad Gateway Troubleshooting Script
# Run this on your production server

echo "╔════════════════════════════════════════════╗"
echo "║   502 Bad Gateway Troubleshooting         ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Step 1: Check Docker containers
echo "🔍 Step 1: Checking Docker containers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose ps
echo ""

# Step 2: Check if container is running
CONTAINER_STATUS=$(docker-compose ps -q whatsapp-api 2>/dev/null)
if [ -z "$CONTAINER_STATUS" ]; then
    echo "❌ Container is NOT running!"
    echo ""
    echo "🔧 Attempting to start container..."
    docker-compose up -d --build
    echo ""
    echo "Waiting 5 seconds for container to start..."
    sleep 5
    docker-compose ps
fi
echo ""

# Step 3: Check container logs
echo "🔍 Step 2: Checking container logs (last 30 lines)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose logs --tail=30 whatsapp-api
echo ""

# Step 4: Check if app is listening on port 3000
echo "🔍 Step 3: Checking if app is listening on port 3000..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v netstat >/dev/null 2>&1; then
    netstat -tlnp | grep :3000 || echo "❌ Nothing listening on port 3000"
elif command -v ss >/dev/null 2>&1; then
    ss -tlnp | grep :3000 || echo "❌ Nothing listening on port 3000"
else
    docker exec whatsapp-api netstat -tln | grep :3000 2>/dev/null || echo "⚠️  Cannot check ports"
fi
echo ""

# Step 5: Test locally on server
echo "🔍 Step 4: Testing app locally from server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEALTH_CHECK=$(curl -s http://localhost:3000/health 2>&1 || echo "FAILED")
if echo "$HEALTH_CHECK" | grep -q "healthy"; then
    echo "✅ App is responding locally!"
    echo "$HEALTH_CHECK" | head -3
else
    echo "❌ App is NOT responding locally"
    echo "Response: $HEALTH_CHECK"
fi
echo ""

# Step 6: Check nginx configuration
echo "🔍 Step 5: Checking nginx configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors:"
    sudo nginx -t
fi
echo ""

# Step 7: Recommendations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Quick Fixes:"
echo ""

CONTAINER_RUNNING=$(docker-compose ps -q whatsapp-api 2>/dev/null)
if [ -z "$CONTAINER_RUNNING" ]; then
    echo "1. Start the container:"
    echo "   docker-compose up -d --build"
    echo ""
fi

if echo "$HEALTH_CHECK" | grep -q "FAILED"; then
    echo "2. Check container logs for errors:"
    echo "   docker-compose logs --tail=100 whatsapp-api"
    echo ""
    echo "3. Check for syntax errors in code:"
    echo "   docker exec whatsapp-api node -c /app/server.js"
    echo "   docker exec whatsapp-api node -c /app/controllers/messageController.js"
    echo ""
fi

echo "4. Restart everything:"
echo "   docker-compose down"
echo "   docker-compose up -d --build"
echo "   docker-compose logs -f"
echo ""

echo "5. If still failing, check firewall:"
echo "   sudo ufw status"
echo "   sudo ufw allow 3000/tcp"
echo ""

echo "6. Reload nginx:"
echo "   sudo systemctl reload nginx"
echo ""
