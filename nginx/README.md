# Nginx Configuration

This directory contains Nginx configuration for the WhatsApp API backend.

## Structure

```
nginx/
├── nginx.conf           # Main nginx configuration
├── conf.d/
│   └── default.conf    # Server block configuration
└── ssl/                # SSL certificates (you need to add these)
    ├── cert.pem
    └── key.pem
```

## Features

- ✅ Reverse proxy to Node.js backend
- ✅ Rate limiting (10 req/s with burst of 20)
- ✅ Gzip compression
- ✅ Security headers
- ✅ Health check endpoint (bypasses rate limiting)
- ✅ SSL/TLS ready (HTTPS configuration included)
- ✅ HTTP/2 support
- ✅ Upstream keepalive connections

## Setup

### HTTP Only (Development)

The default configuration works out of the box for HTTP on port 80.

```bash
docker-compose up -d
```

### HTTPS (Production)

1. **Generate SSL certificates:**

   ```bash
   # Using Let's Encrypt
   docker-compose down
   sudo certbot certonly --standalone -d your-domain.com
   
   # Create SSL directory
   mkdir -p nginx/ssl
   
   # Copy certificates
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
   sudo chmod 644 nginx/ssl/*.pem
   ```

2. **Edit `conf.d/default.conf`:**
   
   - Uncomment the HTTPS server block
   - Update `server_name` to your domain
   - Uncomment the HTTP to HTTPS redirect block

3. **Restart nginx:**
   
   ```bash
   docker-compose up -d
   ```

## Rate Limiting

The API endpoints are rate-limited to prevent abuse:

- **Limit:** 10 requests per second per IP
- **Burst:** 20 requests
- **Status Code:** 429 (Too Many Requests)

The `/health` endpoint bypasses rate limiting.

## Security Headers

The following security headers are automatically added:

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: no-referrer-when-downgrade`
- `Strict-Transport-Security` (when HTTPS is enabled)

## Logs

Nginx logs are stored in a Docker volume:

```bash
# View access logs
docker exec whatsapp-api-nginx tail -f /var/log/nginx/access.log

# View error logs
docker exec whatsapp-api-nginx tail -f /var/log/nginx/error.log
```

## Customization

### Change Rate Limits

Edit `nginx.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
```

Then in `conf.d/default.conf`:

```nginx
limit_req zone=api_limit burst=40 nodelay;
```

### Add Custom Headers

Edit `conf.d/default.conf` and add headers in the `location` blocks:

```nginx
location /api/ {
    add_header Custom-Header "value" always;
    # ... rest of config
}
```

### Enable Additional Logging

In `conf.d/default.conf`:

```nginx
location /api/ {
    access_log /var/log/nginx/api-access.log;
    error_log /var/log/nginx/api-error.log;
    # ... rest of config
}
```

## Troubleshooting

### 502 Bad Gateway

- Check if backend is running: `docker-compose ps`
- Check backend logs: `docker-compose logs whatsapp-api`
- Verify network: `docker network inspect whatsapp-api_whatsapp-network`

### 429 Too Many Requests

- You're hitting the rate limit
- Wait a few seconds and try again
- Or adjust rate limits in nginx.conf

### SSL Certificate Errors

- Ensure certificates are in `nginx/ssl/` directory
- Check file permissions: `ls -la nginx/ssl/`
- Verify certificate paths in `conf.d/default.conf`
- Check nginx error logs: `docker-compose logs nginx`
