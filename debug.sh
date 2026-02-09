#!/bin/bash
# Debugging script for WhatsApp API Extension

echo "🔍 WhatsApp API Extension - Debugging Tool"
echo "==========================================="
echo ""

# Test 1: Check if backend server is running
echo "1️⃣ Testing Backend Server..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend server is running on port 3000"
else
    echo "❌ Backend server is NOT running!"
    echo "   → Start it with: npm run dev"
    exit 1
fi
echo ""

# Test 2: Check Firebase connectivity
echo "2️⃣ Testing Firebase Connection..."
echo "   Attempting to send test message to Firebase..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY:-test_key}" \
  -d '{
    "phoneNumber": "+1234567890",
    "message": "Test message from debug script"
  }')

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "✅ Message sent to Firebase successfully!"
    MESSAGE_ID=$(echo "$RESPONSE" | grep -o '"messageId":"[^"]*"' | cut -d'"' -f4)
    echo "   Message ID: $MESSAGE_ID"
else
    echo "❌ Failed to send message to Firebase"
    echo "   Response: $RESPONSE"
    exit 1
fi
echo ""

# Test 3: Check Firebase Database URL
echo "3️⃣ Checking Firebase Configuration..."
if [ -f .env ]; then
    DB_URL=$(grep FIREBASE_DATABASE_URL .env | cut -d'=' -f2)
    echo "   Database URL: $DB_URL"
    
    # Try to read from Firebase directly
    echo "   Testing direct Firebase access..."
    FIREBASE_TEST=$(curl -s "${DB_URL}/whatsapp_messages.json?limitToLast=1")
    if [ "$FIREBASE_TEST" != "null" ] && [ ! -z "$FIREBASE_TEST" ]; then
        echo "✅ Firebase database is accessible and has messages"
        echo "   Latest message: $(echo $FIREBASE_TEST | head -c 100)..."
    else
        echo "⚠️  Firebase database is empty or not accessible"
    fi
else
    echo "❌ .env file not found!"
fi
echo ""

echo "4️⃣ Next Steps to Check in Chrome:"
echo "   1. Open Chrome and go to: chrome://extensions/"
echo "   2. Find 'WhatsApp API Sender' extension"
echo "   3. Make sure it's ENABLED (blue toggle)"
echo "   4. Click 'Inspect views: service worker'"
echo "   5. Check Console for errors"
echo "   6. Look for: 'Firebase initialized successfully'"
echo ""

echo "5️⃣ Manual Test Commands:"
echo ""
echo "   # Send another test message:"
echo "   curl -X POST http://localhost:3000/api/messages/send \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'X-API-Key: your_api_key' \\"
echo "     -d '{\"phoneNumber\": \"+1234567890\", \"message\": \"Test from curl\"}'"
echo ""
echo "   # Check all messages:"
echo "   curl http://localhost:3000/api/messages"
echo ""
echo "   # Check specific message status:"
echo "   curl http://localhost:3000/api/messages/$MESSAGE_ID"
echo ""

echo "==========================================="
echo "Debug script completed!"
