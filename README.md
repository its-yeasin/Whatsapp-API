# WhatsApp API Backend Server

Node.js Express backend for the WhatsApp API Chrome Extension. Provides REST API endpoints to send messages through Firebase to your Chrome extension.

## Features

- 🚀 RESTful API for sending WhatsApp messages
- 🔥 Firebase Realtime Database integration
- 📊 Message status tracking and statistics
- 🔒 Optional API key authentication
- ⚡ Rate limiting protection
- 📦 Bulk message sending
- 🧹 Automatic message cleanup
- 🛡️ Input validation and error handling

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the file as `serviceAccountKey.json` in the `backend` folder

### 3. Environment Configuration

Create a `.env` file in the backend folder:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
PORT=3000
NODE_ENV=development
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com
API_KEY=your_secret_api_key_here
```

### 4. Start the Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

Server will start at: `http://localhost:3000`

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

If `API_KEY` is set in `.env`, include it in requests:

**Header:**

```
X-API-Key: your_secret_api_key_here
```

**Query Parameter:**

```
?apiKey=your_secret_api_key_here
```

---

### 📨 Send Single Message

**Endpoint:** `POST /api/messages/send`

**Request Body:**

```json
{
  "phoneNumber": "+1234567890",
  "message": "Hello from API!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Message queued successfully",
  "data": {
    "messageId": "-NvXyZ123456",
    "phoneNumber": "+1234567890",
    "status": "pending",
    "createdAt": 1234567890000
  }
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "phoneNumber": "+1234567890",
    "message": "Hello from API!"
  }'
```

---

### 📨 Send Bulk Messages

**Endpoint:** `POST /api/messages/send-bulk`

**Request Body:**

```json
{
  "messages": [
    {
      "phoneNumber": "+1234567890",
      "message": "Hello User 1!"
    },
    {
      "phoneNumber": "+9876543210",
      "message": "Hello User 2!"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "2 messages queued successfully",
  "data": {
    "total": 2,
    "messages": [
      {
        "messageId": "-NvXyZ123456",
        "phoneNumber": "+1234567890",
        "status": "queued"
      },
      {
        "messageId": "-NvXyZ123457",
        "phoneNumber": "+9876543210",
        "status": "queued"
      }
    ]
  }
}
```

---

### 📊 Get Message Status

**Endpoint:** `GET /api/messages/:messageId`

**Response:**

```json
{
  "success": true,
  "data": {
    "messageId": "-NvXyZ123456",
    "phoneNumber": "+1234567890",
    "message": "Hello!",
    "status": "sent",
    "createdAt": 1234567890000,
    "sentAt": 1234567891000
  }
}
```

---

### 📋 Get All Messages

**Endpoint:** `GET /api/messages`

**Query Parameters:**

- `status` (optional): Filter by status (pending, processing, sent, error)
- `limit` (optional): Max number of messages (default: 50)

**Example:**

```
GET /api/messages?status=sent&limit=20
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 15,
    "messages": [...]
  }
}
```

---

### 🗑️ Delete Message

**Endpoint:** `DELETE /api/messages/:messageId`

**Response:**

```json
{
  "success": true,
  "message": "Message deleted successfully",
  "data": {
    "messageId": "-NvXyZ123456"
  }
}
```

---

### 🧹 Cleanup Old Messages

**Endpoint:** `POST /api/messages/cleanup`

**Request Body:**

```json
{
  "daysOld": 7
}
```

**Response:**

```json
{
  "success": true,
  "message": "Cleaned up 25 old messages",
  "data": {
    "deletedCount": 25,
    "daysOld": 7
  }
}
```

---

### 📊 Get Statistics

**Endpoint:** `GET /api/stats`

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 5,
    "processing": 2,
    "sent": 130,
    "error": 13,
    "byDate": {
      "2024-01-15": 50,
      "2024-01-16": 100
    },
    "bySource": {
      "api": 100,
      "api-bulk": 50
    }
  }
}
```

---

### 📊 Get Recent Statistics

**Endpoint:** `GET /api/stats/recent`

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 25,
    "pending": 2,
    "sent": 20,
    "error": 3,
    "hourly": {
      "9": 5,
      "10": 8,
      "11": 12
    }
  },
  "timeframe": "Last 24 hours"
}
```

---

## Project Structure

```
backend/
├── config/
│   └── firebase.js          # Firebase initialization
├── controllers/
│   ├── messageController.js # Message operations
│   └── statsController.js   # Statistics operations
├── middleware/
│   └── auth.js              # API key authentication
├── routes/
│   ├── messageRoutes.js     # Message endpoints
│   └── statsRoutes.js       # Statistics endpoints
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
├── server.js                # Main server file
└── README.md                # This file
```

## Environment Variables

| Variable                  | Required | Default     | Description                |
| ------------------------- | -------- | ----------- | -------------------------- |
| `PORT`                    | No       | 3000        | Server port                |
| `NODE_ENV`                | No       | development | Environment mode           |
| `FIREBASE_PROJECT_ID`     | Yes      | -           | Firebase project ID        |
| `FIREBASE_DATABASE_URL`   | Yes      | -           | Firebase database URL      |
| `API_KEY`                 | No       | -           | API key for authentication |
| `RATE_LIMIT_WINDOW_MS`    | No       | 900000      | Rate limit window (ms)     |
| `RATE_LIMIT_MAX_REQUESTS` | No       | 100         | Max requests per window    |

## Security

### API Key Generation

Generate a secure API key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add it to your `.env` file:

```env
API_KEY=your_generated_key_here
```

### Rate Limiting

Default: 100 requests per 15 minutes per IP

Customize in `.env`:

```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### CORS

Configure allowed origins in `server.js`:

```javascript
app.use(
  cors({
    origin: "https://yourdomain.com",
    methods: ["GET", "POST", "DELETE"],
  }),
);
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "errors": [...]  // Validation errors (if applicable)
}
```

## Integration Examples

### JavaScript (Fetch)

```javascript
async function sendWhatsAppMessage(phoneNumber, message) {
  const response = await fetch("http://localhost:3000/api/messages/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "your_api_key",
    },
    body: JSON.stringify({ phoneNumber, message }),
  });

  const data = await response.json();
  console.log(data);
}

sendWhatsAppMessage("+1234567890", "Hello!");
```

### Python (Requests)

```python
import requests

url = 'http://localhost:3000/api/messages/send'
headers = {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key'
}
data = {
    'phoneNumber': '+1234567890',
    'message': 'Hello from Python!'
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

### PHP (cURL)

```php
<?php
$url = 'http://localhost:3000/api/messages/send';
$data = [
    'phoneNumber' => '+1234567890',
    'message' => 'Hello from PHP!'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-API-Key: your_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response));
?>
```

## Deployment

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start server.js --name whatsapp-api

# Other commands
pm2 status
pm2 logs whatsapp-api
pm2 restart whatsapp-api
pm2 stop whatsapp-api
```

### Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t whatsapp-api .
docker run -p 3000:3000 --env-file .env whatsapp-api
```

## Troubleshooting

### Firebase connection error

- Verify `serviceAccountKey.json` exists
- Check `FIREBASE_DATABASE_URL` in `.env`
- Ensure Firebase Realtime Database is enabled

### API key not working

- Check if `API_KEY` is set in `.env`
- Verify header name is `X-API-Key`
- Ensure key matches exactly

### Rate limit errors

- Adjust limits in `.env`
- Wait for the time window to reset
- Consider implementing per-user limits

## Support

For issues or questions:

- Check the troubleshooting section
- Review server logs
- Open an issue on GitHub

## License

MIT License
