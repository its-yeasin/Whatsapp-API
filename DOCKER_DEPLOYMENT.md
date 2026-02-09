# Docker Deployment Guide

This guide explains how to deploy the WhatsApp API backend using Docker.

## Prerequisites

- Docker installed ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed ([Install Docker Compose](https://docs.docker.com/compose/install/))
- Firebase service account key file (`serviceAccountKey.json`)
- Environment variables configured

## Quick Start

### 1. Prepare Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.production .env
```

Edit `.env` and add your actual values:

```env
NODE_ENV=production
PORT=3000
FIREBASE_PROJECT_ID=whatsapp-api-40dc2
FIREBASE_DATABASE_URL=https://whatsapp-api-40dc2-default-rtdb.asia-southeast1.firebasedatabase.app
API_KEY=your-secure-api-key-here
```

### 2. Ensure Service Account Key is in Place

Make sure `backend/serviceAccountKey.json` exists with your Firebase credentials.

### 3. Build and Run with Docker Compose

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

### 4. Verify Deployment

```bash
# Check health endpoint (through nginx)
curl http://localhost/health

# Test API (use your actual API key)
curl -X POST http://localhost/api/messages/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-here" \
  -d '{
    "phoneNumber": "1234567890",
    "message": "Test message from Docker"
  }'
```

The setup now includes:
- **Nginx** as reverse proxy on port 80/443
- **Node.js backend** accessible only through nginx
- Rate limiting (10 requests/second with burst of 20)
- Security headers
- Gzip compression
- Health check endpoint (no rate limiting)

## Manual Docker Commands

If you prefer not to use Docker Compose:

### Build the Image

```bash
cd backend
docker build -t whatsapp-api:latest .
```

### Run the Container

```bash
docker run -d \
  --name whatsapp-api-backend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e FIREBASE_PROJECT_ID=whatsapp-api-40dc2 \
  -e FIREBASE_DATABASE_URL=https://whatsapp-api-40dc2-default-rtdb.asia-southeast1.firebasedatabase.app \
  -e API_KEY=your-secure-api-key-here \
  -v $(pwd)/backend/serviceAccountKey.json:/app/serviceAccountKey.json:ro \
  --restart unless-stopped \
  whatsapp-api:latest
```

### View Logs

```bash
docker logs -f whatsapp-api-backend
```

### Stop and Remove Container

```bash
docker stop whatsapp-api-backend
docker rm whatsapp-api-backend
```

## Production Deployment

### Deploy to VPS/Cloud Server

1. **SSH into your server**

   ```bash
   ssh user@your-server-ip
   ```

2. **Install Docker and Docker Compose** (if not already installed)

   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo apt-get install docker-compose-plugin

   # Add user to docker group
   sudo usermod -aG docker $USER
   ```

3. **Clone your repository**

   ```bash
   git clone https://github.com/its-yeasin/Whatsapp-API.git
   cd Whatsapp-API
   ```

4. **Set up environment variables**

   ```bash
   nano .env  # or use vim, vi, etc.
   # Add your production values
   ```

5. **Upload service account key**

   ```bash
   # Upload via SCP from your local machine
   scp backend/serviceAccountKey.json user@your-server-ip:~/Whatsapp-API/backend/
   ```

6. **Start the service**

   ```bash
   docker-compose up -d
   ```

7. **Set up SSL with Let's Encrypt (for HTTPS)**
   
   The Docker setup already includes nginx. To enable SSL:

   ```bash
   # Stop the containers first
   docker-compose down
   
   # Install certbot
   sudo apt install certbot
   
   # Generate certificates (make sure port 80 is free)
   sudo certbot certonly --standalone -d your-domain.com
   
   # Create SSL directory
   mkdir -p nginx/ssl
   
   # Copy certificates
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
   sudo chmod 644 nginx/ssl/*.pem
   
   # Edit nginx/conf.d/default.conf
   # Uncomment the HTTPS server block and update server_name
   nano nginx/conf.d/default.conf
   
   # Restart services
   docker-compose up -d
   ```
   
   Set up auto-renewal:
   ```bash
   # Add to crontab
   sudo crontab -e
   # Add this line:
   0 0 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/your-domain.com/*.pem ~/Whatsapp-API/nginx/ssl/ && cd ~/Whatsapp-API && docker-compose restart nginx
   ```

### Deploy to Cloud Platforms

#### AWS ECS/Fargate

1. Push image to ECR:

   ```bash
   aws ecr create-repository --repository-name whatsapp-api
   docker tag whatsapp-api:latest <account-id>.dkr.ecr.<region>.amazonaws.com/whatsapp-api:latest
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/whatsapp-api:latest
   ```

2. Create ECS task definition with your environment variables
3. Deploy to ECS/Fargate

#### Google Cloud Run

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT-ID/whatsapp-api

# Deploy to Cloud Run
gcloud run deploy whatsapp-api \
  --image gcr.io/PROJECT-ID/whatsapp-api \
  --platform managed \
  --region us-central1 \
  --set-env-vars="NODE_ENV=production,FIREBASE_PROJECT_ID=whatsapp-api-40dc2,..." \
  --allow-unauthenticated
```

#### DigitalOcean App Platform

1. Connect your GitHub repository
2. Select Dockerfile deployment
3. Set environment variables in the dashboard
4. Deploy

## Monitoring and Maintenance

### View Container Status

```bash
docker-compose ps
```

### View Resource Usage

```bash
docker stats whatsapp-api-backend
```

### Update and Redeploy

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build

# Or without docker-compose
docker build -t whatsapp-api:latest ./backend
docker stop whatsapp-api-backend
docker rm whatsapp-api-backend
docker run -d [... same parameters as above ...]
```

### Backup Strategy

```bash
# Backup Firebase service account key
cp backend/serviceAccountKey.json ~/backups/serviceAccountKey-$(date +%Y%m%d).json

# Backup environment variables
cp .env ~/backups/.env-$(date +%Y%m%d)
```

### Logs Management

```bash
# View logs
docker-compose logs -f --tail=100

# Save logs to file
docker-compose logs > logs-$(date +%Y%m%d).txt
```

### Troubleshooting

#### Container won't start

```bash
# Check logs
docker-compose logs

# Check if port is already in use
sudo lsof -i :3000
```

#### Permission errors

```bash
# Ensure service account key has correct permissions
chmod 600 backend/serviceAccountKey.json
```

#### Out of disk space

```bash
# Remove unused images and containers
docker system prune -a

# Check disk usage
docker system df
```

## Security Best Practices

1. **Never commit sensitive files to Git**
   - `.env` is in `.gitignore`
   - `serviceAccountKey.json` is in `.gitignore`

2. **Use secrets management in production**
   - AWS Secrets Manager
   - Google Secret Manager
   - HashiCorp Vault

3. **Limit container resources**
   - Memory and CPU limits are set in `docker-compose.yml`

4. **Keep images updated**

   ```bash
   docker-compose pull
   docker-compose up -d
   ```

5. **Use non-root user** (already configured in Dockerfile)

6. **Enable firewall**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

## Scaling

### Horizontal Scaling with Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml whatsapp

# Scale service
docker service scale whatsapp_whatsapp-api=3
```

### Load Balancing with Nginx

Use Nginx upstream configuration to distribute requests across multiple containers.

## Support

For issues or questions:

- Check logs: `docker-compose logs -f`
- Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Open an issue on GitHub
