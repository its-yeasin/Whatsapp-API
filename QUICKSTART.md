# Quick Start Guide

## 📦 Files Created

- **Dockerfile** - Container configuration for your WhatsApp API
- **docker-compose.yml** - Docker Compose orchestration file
- **.dockerignore** - Files to exclude from Docker image
- **nginx.conf** - Nginx reverse proxy configuration
- **.env.example** - Environment variables template
- **deploy.sh** - Quick deployment script (local/server)
- **setup-nginx.sh** - Nginx installation & configuration script (server only)
- **DEPLOYMENT.md** - Complete deployment documentation

## 🚀 Quick Deployment

### Local Testing

```bash
# 1. Create environment file
cp .env.example .env
# Edit .env with your values

# 2. Run deployment script
./deploy.sh

# 3. Test the API
curl http://localhost:3000/health
```

### Server Deployment

```bash
# 1. On your server, clone the repository
git clone https://github.com/its-yeasin/Whatsapp-API.git
cd Whatsapp-API

# 2. Set up environment
cp .env.example .env
nano .env  # Edit with your values

# 3. Deploy the Docker container
./deploy.sh

# 4. Set up Nginx (run as root)
sudo ./setup-nginx.sh

# 5. Configure Cloudflare
# - Point whatsapp.itsyeasin.com to your server IP
# - Enable proxy (orange cloud)
# - Set SSL/TLS mode to "Full (strict)"
```

## 🌐 Cloudflare Setup

### DNS Configuration

1. Log in to Cloudflare Dashboard
2. Select your domain: **itsyeasin.com**
3. Go to **DNS** > **Records**
4. Add A Record:
   - **Type:** A
   - **Name:** whatsapp
   - **IPv4 address:** Your server IP
   - **Proxy status:** Proxied (🟠 orange cloud)
   - **TTL:** Auto

### SSL/TLS Settings

1. Go to **SSL/TLS** > **Overview**
2. Set **Encryption mode** to: **Full (strict)**
3. Go to **SSL/TLS** > **Edge Certificates**
   - Enable **Always Use HTTPS**
   - Enable **Automatic HTTPS Rewrites**
   - Minimum TLS Version: **TLS 1.2** or higher

### Origin Certificate (Recommended)

1. Go to **SSL/TLS** > **Origin Server**
2. Click **Create Certificate**
3. Leave defaults and click **Next**
4. Copy the certificate and private key
5. On your server:

   ```bash
   sudo nano /etc/ssl/certs/whatsapp.itsyeasin.com.pem
   # Paste certificate

   sudo nano /etc/ssl/private/whatsapp.itsyeasin.com.key
   # Paste private key

   sudo chmod 600 /etc/ssl/private/whatsapp.itsyeasin.com.key
   ```

## ✅ Verification

After deployment, verify everything is working:

```bash
# Check if Docker container is running
docker-compose ps

# Check container logs
docker-compose logs -f

# Test health endpoint
curl https://whatsapp.itsyeasin.com/health

# Check SSL certificate
curl -I https://whatsapp.itsyeasin.com/
```

## 🔧 Common Commands

### Docker

```bash
docker-compose up -d          # Start containers
docker-compose down           # Stop containers
docker-compose logs -f        # View logs
docker-compose restart        # Restart containers
docker-compose ps             # List containers
```

### Nginx

```bash
sudo nginx -t                 # Test configuration
sudo systemctl reload nginx   # Reload config
sudo systemctl restart nginx  # Restart service
sudo systemctl status nginx   # Check status
```

## 📝 Environment Variables

Required variables in `.env`:

```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://whatsapp.itsyeasin.com
FIREBASE_PROJECT_ID=your-project-id
API_KEY=your-secret-api-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🆘 Troubleshooting

### Container won't start

```bash
docker-compose logs          # Check logs
docker-compose down && docker-compose up -d --build  # Rebuild
```

### Can't access via domain

1. Check DNS propagation: `nslookup whatsapp.itsyeasin.com`
2. Check Nginx: `sudo nginx -t`
3. Check firewall: `sudo ufw status`
4. Check if container is running: `docker-compose ps`

### SSL errors

1. Verify Cloudflare SSL mode is "Full (strict)"
2. Check certificate files exist
3. Test certificate: `openssl s_client -connect whatsapp.itsyeasin.com:443`

## 📚 Additional Resources

For detailed information, see [DEPLOYMENT.md](DEPLOYMENT.md)

## 🔐 Security Checklist

- [ ] Change default API_KEY in `.env`
- [ ] Set appropriate CORS_ORIGIN
- [ ] Enable Cloudflare WAF
- [ ] Configure rate limiting
- [ ] Set up monitoring/alerts
- [ ] Regular security updates
- [ ] Backup configuration files
- [ ] Secure serviceAccountKey.json

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose logs` and `/var/log/nginx/whatsapp-api-error.log`
2. Review [DEPLOYMENT.md](DEPLOYMENT.md) for detailed troubleshooting
3. Verify all environment variables are set correctly
