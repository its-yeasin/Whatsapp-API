#!/bin/bash

# Nginx Setup Script for WhatsApp API
# Run this on your server after deploying the Docker container

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔧 Setting up Nginx for WhatsApp API..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    apt update
    apt install -y nginx
fi

# Copy nginx configuration
echo "📝 Setting up Nginx configuration..."
cp nginx.conf /etc/nginx/sites-available/whatsapp-api

# Create symbolic link
if [ -L /etc/nginx/sites-enabled/whatsapp-api ]; then
    echo "🔗 Removing existing symbolic link..."
    rm /etc/nginx/sites-enabled/whatsapp-api
fi

ln -s /etc/nginx/sites-available/whatsapp-api /etc/nginx/sites-enabled/

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
if nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid!${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed!${NC}"
    exit 1
fi

# Ask about SSL certificate
echo ""
echo -e "${YELLOW}SSL Certificate Setup:${NC}"
echo "1) I have Cloudflare Origin Certificate"
echo "2) Use Let's Encrypt (Certbot)"
echo "3) Skip SSL setup for now"
read -p "Choose option (1-3): " ssl_option

case $ssl_option in
    1)
        echo ""
        echo "📜 Please create the SSL certificate files:"
        echo "  Certificate: /etc/ssl/certs/whatsapp.itsyeasin.com.pem"
        echo "  Private Key: /etc/ssl/private/whatsapp.itsyeasin.com.key"
        echo ""
        echo "From Cloudflare Dashboard:"
        echo "  1. Go to SSL/TLS > Origin Server"
        echo "  2. Create Certificate"
        echo "  3. Download and save both files to the paths above"
        echo ""
        read -p "Press Enter when ready to continue..."
        
        if [ -f /etc/ssl/certs/whatsapp.itsyeasin.com.pem ] && [ -f /etc/ssl/private/whatsapp.itsyeasin.com.key ]; then
            chmod 600 /etc/ssl/private/whatsapp.itsyeasin.com.key
            echo -e "${GREEN}✅ SSL certificates configured!${NC}"
        else
            echo -e "${RED}❌ SSL certificate files not found!${NC}"
            exit 1
        fi
        ;;
    2)
        echo "📦 Installing Certbot..."
        apt install -y certbot python3-certbot-nginx
        
        echo "🔐 Obtaining SSL certificate..."
        certbot --nginx -d whatsapp.itsyeasin.com
        
        # Update nginx config to use Let's Encrypt paths
        sed -i 's|/etc/ssl/certs/whatsapp.itsyeasin.com.pem|/etc/letsencrypt/live/whatsapp.itsyeasin.com/fullchain.pem|g' /etc/nginx/sites-available/whatsapp-api
        sed -i 's|/etc/ssl/private/whatsapp.itsyeasin.com.key|/etc/letsencrypt/live/whatsapp.itsyeasin.com/privkey.pem|g' /etc/nginx/sites-available/whatsapp-api
        
        echo -e "${GREEN}✅ Let's Encrypt SSL configured!${NC}"
        ;;
    3)
        echo -e "${YELLOW}⚠️  Skipping SSL setup. HTTPS will not work until configured!${NC}"
        ;;
esac

# Configure firewall
if command -v ufw &> /dev/null; then
    echo "🔥 Configuring firewall..."
    ufw allow 'Nginx Full'
    ufw allow 'OpenSSH'
    echo -e "${GREEN}✅ Firewall configured!${NC}"
fi

# Reload Nginx
echo "🔄 Reloading Nginx..."
systemctl reload nginx

echo ""
echo -e "${GREEN}✨ Nginx setup completed successfully!${NC}"
echo ""
echo "📊 Nginx status:"
systemctl status nginx --no-pager
echo ""
echo "🌐 Your API should now be accessible at:"
echo "  https://whatsapp.itsyeasin.com"
echo ""
echo "📝 Useful commands:"
echo "  Test config:     nginx -t"
echo "  Reload:          systemctl reload nginx"
echo "  Restart:         systemctl restart nginx"
echo "  View logs:       tail -f /var/log/nginx/whatsapp-api-error.log"
echo ""
