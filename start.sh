#!/bin/bash

# WhatsApp API Docker Startup Script

set -e

echo "=========================================="
echo "WhatsApp API - Docker Deployment"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from template..."
    cp .env.production .env
    echo ""
    echo "✅ .env file created!"
    echo "🔧 Please edit .env and add your actual values:"
    echo ""
    cat .env
    echo ""
    echo "After editing .env, run this script again."
    exit 1
fi

# Check if serviceAccountKey.json exists
if [ ! -f backend/serviceAccountKey.json ]; then
    echo "⚠️  Firebase service account key not found!"
    echo "📄 Please place your serviceAccountKey.json in backend/ directory"
    echo ""
    echo "You can download it from:"
    echo "https://console.firebase.google.com/project/whatsapp-api-40dc2/settings/serviceaccounts/adminsdk"
    echo ""
    exit 1
fi

echo "✅ Configuration files found"
echo ""

# Ask user what to do
echo "Select an option:"
echo "1) Start services"
echo "2) Stop services"
echo "3) Restart services"
echo "4) View logs"
echo "5) Build and start"
echo "6) Clean up and rebuild"
echo ""
read -p "Enter option (1-6): " option

case $option in
    1)
        echo "🚀 Starting services..."
        docker-compose up -d
        echo ""
        echo "✅ Services started!"
        ;;
    2)
        echo "🛑 Stopping services..."
        docker-compose down
        echo ""
        echo "✅ Services stopped!"
        ;;
    3)
        echo "🔄 Restarting services..."
        docker-compose restart
        echo ""
        echo "✅ Services restarted!"
        ;;
    4)
        echo "📋 Viewing logs (Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    5)
        echo "🔨 Building and starting services..."
        docker-compose up -d --build
        echo ""
        echo "✅ Services built and started!"
        ;;
    6)
        echo "🧹 Cleaning up..."
        docker-compose down -v
        docker system prune -f
        echo ""
        echo "🔨 Rebuilding..."
        docker-compose up -d --build
        echo ""
        echo "✅ Clean rebuild complete!"
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Service Status:"
echo "=========================================="
docker-compose ps

echo ""
echo "=========================================="

if [ "$option" != "2" ] && [ "$option" != "4" ]; then
    echo ""
    echo "📊 Health Check:"
    sleep 3
    
    if curl -s http://localhost/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy!"
        echo ""
        echo "🌐 API Endpoints:"
        echo "   Health: http://localhost/health"
        echo "   Send Message: http://localhost/api/messages/send"
        echo "   Get Status: http://localhost/api/messages/status/:messageId"
        echo "   Statistics: http://localhost/api/stats"
    else
        echo "⚠️  Backend not responding yet. Check logs with:"
        echo "   docker-compose logs -f"
    fi
fi

echo ""
echo "=========================================="
echo "Quick Commands:"
echo "=========================================="
echo "View logs:        docker-compose logs -f"
echo "Stop:             docker-compose down"
echo "Restart:          docker-compose restart"
echo "Shell (backend):  docker exec -it whatsapp-api-backend sh"
echo "Shell (nginx):    docker exec -it whatsapp-api-nginx sh"
echo ""
