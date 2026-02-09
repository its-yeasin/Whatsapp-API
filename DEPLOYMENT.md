# Deployment Guide for WhatsApp API

## Prerequisites

- Docker and Docker Compose installed on your server
- Domain `whatsapp.itsyeasin.com` pointing to your server via Cloudflare
- Nginx installed on your server
- SSL certificate (can use Let's Encrypt/Certbot or Cloudflare Origin Certificate)

## Deployment Steps

### 1. Prepare Your Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone and Configure

```bash
# Clone your repository
git clone https://github.com/its-yeasin/Whatsapp-API.git
cd Whatsapp-API

# Copy environment file
cp .env.example .env

# Edit .env with your actual values
nano .env
```

### 3. Build and Run Docker Container

```bash
# Build and start the container
docker-compose up -d

# Check if container is running
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Configure Nginx

```bash
# Install Nginx if not already installed
sudo apt install nginx -y

# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/whatsapp-api

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/whatsapp-api /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 5. SSL Certificate Setup

#### Option A: Using Cloudflare Origin Certificate (Recommended)

1. Generate Origin Certificate in Cloudflare Dashboard:
   - Go to SSL/TLS > Origin Server
   - Create Certificate
   - Choose "Generate private key and CSR with Cloudflare"
   - Set validity (up to 15 years)
   - Download both certificate and private key

2. Install certificate:

```bash
sudo mkdir -p /etc/ssl/certs /etc/ssl/private
sudo nano /etc/ssl/certs/whatsapp.itsyeasin.com.pem
# Paste the certificate content

sudo nano /etc/ssl/private/whatsapp.itsyeasin.com.key
# Paste the private key content

sudo chmod 600 /etc/ssl/private/whatsapp.itsyeasin.com.key
```

3. Update Cloudflare SSL/TLS settings:
   - Set SSL/TLS encryption mode to "Full (strict)"
   - Enable "Always Use HTTPS"
   - Enable "Automatic HTTPS Rewrites"

#### Option B: Using Let's Encrypt Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Update nginx.conf SSL paths to:
# ssl_certificate /etc/letsencrypt/live/whatsapp.itsyeasin.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/whatsapp.itsyeasin.com/privkey.pem;

# Get SSL certificate
sudo certbot --nginx -d whatsapp.itsyeasin.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 6. Firewall Configuration

```bash
# Allow necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 7. Cloudflare Configuration

1. **DNS Settings:**
   - Type: A
   - Name: whatsapp
   - IPv4 address: Your server IP
   - Proxy status: Proxied (orange cloud)

2. **SSL/TLS Settings:**
   - Encryption mode: Full (strict)
   - Minimum TLS Version: TLS 1.2
   - TLS 1.3: Enabled

3. **Security Settings:**
   - WAF: Enabled
   - Bot Fight Mode: Enabled (optional)
   - Rate Limiting: Configure if needed

4. **Performance:**
   - Auto Minify: Enable for JS, CSS, HTML
   - Brotli: Enabled

## Useful Commands

### Docker Management

```bash
# View logs
docker-compose logs -f whatsapp-api

# Restart container
docker-compose restart

# Stop container
docker-compose stop

# Start container
docker-compose start

# Rebuild and restart
docker-compose up -d --build

# Remove container
docker-compose down

# Remove container and volumes
docker-compose down -v
```

### Nginx Management

```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# Check nginx status
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/whatsapp-api-access.log
sudo tail -f /var/log/nginx/whatsapp-api-error.log
```

## Testing

```bash
# Test the API
curl https://whatsapp.itsyeasin.com/

# Test health endpoint
curl https://whatsapp.itsyeasin.com/health

# Test from external location
curl -I https://whatsapp.itsyeasin.com/
```

## Monitoring

### Setup Log Rotation

Create a logrotate config:

```bash
sudo nano /etc/logrotate.d/whatsapp-api
```

Add:

```
/var/log/nginx/whatsapp-api-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1
    endscript
}
```

## Updating the Application

```bash
cd /path/to/Whatsapp-API

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Clear old images
docker image prune -f
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs

# Check if port is already in use
sudo lsof -i :3000
```

### Nginx errors

```bash
# Check configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### SSL issues

```bash
# Verify certificate
openssl s_client -connect whatsapp.itsyeasin.com:443

# Check Cloudflare SSL mode
# Should be "Full (strict)" for origin certificates
```

### Can't connect to API

1. Check if Docker container is running: `docker-compose ps`
2. Check if Nginx is running: `sudo systemctl status nginx`
3. Check firewall: `sudo ufw status`
4. Check Cloudflare proxy status (should be orange cloud)
5. Verify DNS propagation: `nslookup whatsapp.itsyeasin.com`

## Security Best Practices

1. **Environment Variables**: Never commit `.env` file to git
2. **Service Account Key**: Keep `serviceAccountKey.json` secure
3. **API Keys**: Rotate regularly
4. **Updates**: Keep Docker images and system packages updated
5. **Monitoring**: Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
6. **Backups**: Regular backups of configuration and data
7. **Rate Limiting**: Configure appropriate limits in `.env`
8. **Cloudflare**: Use WAF rules to protect against attacks

## Support

For issues, please check:

- Application logs: `docker-compose logs -f`
- Nginx logs: `/var/log/nginx/whatsapp-api-error.log`
- System logs: `sudo journalctl -u nginx -f`
