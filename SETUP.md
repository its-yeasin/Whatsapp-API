# WhatsApp API Backend - Quick Setup Guide

## 🚀 Quick Start (3 Steps)

### 1️⃣ Install Dependencies

```bash
cd backend
npm install
```

### 2️⃣ Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click ⚙️ (Settings) → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download and rename file to `serviceAccountKey.json`
7. Move it to the `backend` folder

### 3️⃣ Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
nano .env  # or use your favorite editor
```

Update these values in `.env`:

```env
PORT=3000
NODE_ENV=development

# Get these from Firebase Console → Project Settings
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com

# Optional: Generate API key for security
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
API_KEY=your_generated_api_key_here
```

## ▶️ Start Server

**Development (with auto-reload):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Server will be ready at: `http://localhost:3000`

## ✅ Test It!

### Option 1: Browser

Visit: `http://localhost:3000/health`

Should see:

```json
{
  "success": true,
  "status": "healthy",
  "uptime": 5.123,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Option 2: cURL

```bash
# Send a test message
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "phoneNumber": "+1234567890",
    "message": "Hello from backend!"
  }'
```

### Option 3: VS Code REST Client

1. Install "REST Client" extension in VS Code
2. Open `test-api.http`
3. Update `@apiKey` variable
4. Click "Send Request" above any endpoint

## 📁 Project Structure

```
backend/
├── config/
│   └── firebase.js              # Firebase setup
├── controllers/
│   ├── messageController.js     # Message logic
│   └── statsController.js       # Statistics logic
├── middleware/
│   └── auth.js                  # Authentication
├── routes/
│   ├── messageRoutes.js         # Message endpoints
│   └── statsRoutes.js           # Stats endpoints
├── .env                         # Your config (create this)
├── .env.example                 # Config template
├── serviceAccountKey.json       # Firebase key (download this)
├── package.json
├── server.js                    # Main server
└── README.md                    # Full documentation
```

## 🔌 API Endpoints

Once running, you can use these endpoints:

| Method | Endpoint                  | Description            |
| ------ | ------------------------- | ---------------------- |
| POST   | `/api/messages/send`      | Send single message    |
| POST   | `/api/messages/send-bulk` | Send multiple messages |
| GET    | `/api/messages`           | Get all messages       |
| GET    | `/api/messages/:id`       | Get message status     |
| DELETE | `/api/messages/:id`       | Delete message         |
| POST   | `/api/messages/cleanup`   | Clean old messages     |
| GET    | `/api/stats`              | Get statistics         |
| GET    | `/api/stats/recent`       | Get recent stats       |

## 🔒 Security Tips

1. **Generate a strong API key:**

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Never commit these files:**
   - `.env`
   - `serviceAccountKey.json`

   (They're already in `.gitignore`)

3. **Use environment variables in production**

## 🐛 Troubleshooting

**Server won't start:**

- ✅ Check `serviceAccountKey.json` exists
- ✅ Verify `.env` has correct values
- ✅ Run `npm install` first

**Firebase connection error:**

- ✅ Check Firebase Realtime Database is enabled
- ✅ Verify `FIREBASE_DATABASE_URL` is correct
- ✅ Ensure service account key is valid

**API returns 401 Unauthorized:**

- ✅ Check if `API_KEY` is set in `.env`
- ✅ Include API key in request header: `X-API-Key: your_key`

**Messages not reaching extension:**

- ✅ Ensure extension is installed and running
- ✅ Verify both use the same Firebase project
- ✅ Check Firebase Console for the messages

## 📖 Next Steps

1. ✅ Read full documentation in [README.md](README.md)
2. ✅ Test endpoints using [test-api.http](test-api.http)
3. ✅ Integrate with your application
4. ✅ Deploy to production

## 🚀 Deployment

### Using PM2:

```bash
npm install -g pm2
pm2 start server.js --name whatsapp-api
```

### Using Docker:

```bash
docker build -t whatsapp-api .
docker run -p 3000:3000 --env-file .env whatsapp-api
```

## 💡 Integration Example

```javascript
// Send message from your app
async function sendWhatsApp(phone, message) {
  const response = await fetch("http://localhost:3000/api/messages/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.API_KEY,
    },
    body: JSON.stringify({ phoneNumber: phone, message }),
  });

  return await response.json();
}

// Usage
await sendWhatsApp("+1234567890", "Hello!");
```

## 📞 Support

Having issues? Check:

1. Server logs in terminal
2. Firebase Console logs
3. Full [README.md](README.md) documentation

Happy messaging! 🎉
