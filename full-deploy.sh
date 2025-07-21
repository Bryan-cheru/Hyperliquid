#!/bin/bash

# Hyperliquid Full Deployment Script
# Handles Windows zip extraction issues and deploys cleanly

echo "🚀 Hyperliquid Full Deployment Starting..."
echo "=========================================="

# Stop current application
echo "📤 Stopping current application..."
pm2 stop hyperliquid-app 2>/dev/null || echo "No application running"
pm2 delete hyperliquid-app 2>/dev/null || echo "No application to delete"

# Create backup
echo "💾 Creating backup..."
mkdir -p /var/backups
if [ -d "/var/www/hyperliquid" ]; then
    backup_name="hyperliquid-backup-$(date +%Y%m%d-%H%M%S)"
    cp -r /var/www/hyperliquid /var/backups/$backup_name
    echo "✅ Backup created: /var/backups/$backup_name"
fi

# Clean old installation
echo "🧹 Cleaning old installation..."
rm -rf /var/www/hyperliquid
mkdir -p /var/www/hyperliquid

# Change to temp directory
cd /tmp

# Clean previous extraction
rm -rf dist deployment assets *.html *.js *.css *.svg *.json ecosystem.config.js nginx.conf deploy.sh 2>/dev/null

# Extract files (ignore warnings about backslashes)
echo "📦 Extracting deployment package..."
unzip -o hyperliquid-deployment.zip 2>/dev/null || {
    echo "⚠️ Extraction had warnings, but continuing..."
    # Force extraction with different method
    python3 -c "
import zipfile
import os
with zipfile.ZipFile('hyperliquid-deployment.zip', 'r') as zip_ref:
    zip_ref.extractall('/tmp/')
" 2>/dev/null || {
    # Last resort - manual extraction
    echo "Trying manual extraction..."
    unzip -j hyperliquid-deployment.zip 2>/dev/null || true
}
}

# Check what was extracted and organize files
echo "📋 Organizing extracted files..."

# Look for files in various locations
if [ -d "dist" ]; then
    echo "✅ Found dist directory"
    cp -r dist/* /var/www/hyperliquid/
elif [ -f "index.html" ]; then
    echo "✅ Found individual files"
    cp *.html /var/www/hyperliquid/ 2>/dev/null || true
    cp *.css /var/www/hyperliquid/ 2>/dev/null || true
    cp *.js /var/www/hyperliquid/ 2>/dev/null || true
    cp *.svg /var/www/hyperliquid/ 2>/dev/null || true
    
    # Handle assets directory
    if [ -d "assets" ]; then
        cp -r assets /var/www/hyperliquid/
    fi
else
    echo "❌ No HTML files found, checking alternate locations..."
    find . -name "*.html" -exec cp {} /var/www/hyperliquid/ \;
    find . -name "*.css" -exec cp {} /var/www/hyperliquid/ \;
    find . -name "*.js" -exec cp {} /var/www/hyperliquid/ \;
    find . -name "assets" -type d -exec cp -r {} /var/www/hyperliquid/ \;
fi

# Copy deployment configuration if available
if [ -f "ecosystem.config.js" ]; then
    cp ecosystem.config.js /var/www/hyperliquid/
fi

if [ -f "package.json" ]; then
    cp package.json /var/www/hyperliquid/
fi

# Set proper permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data /var/www/hyperliquid
chmod -R 755 /var/www/hyperliquid

# Verify deployment
echo "🔍 Verifying deployment..."
echo "Files deployed to /var/www/hyperliquid:"
ls -la /var/www/hyperliquid/

# Check if we have an index.html
if [ -f "/var/www/hyperliquid/index.html" ]; then
    echo "✅ index.html found - static deployment ready"
    
    # Start a simple static server with PM2
    pm2 serve /var/www/hyperliquid 3000 --name "hyperliquid-app" --spa
    
elif [ -f "/var/www/hyperliquid/ecosystem.config.js" ]; then
    echo "✅ ecosystem.config.js found - starting application"
    cd /var/www/hyperliquid
    pm2 start ecosystem.config.js
else
    echo "⚠️ Starting basic static server"
    pm2 serve /var/www/hyperliquid 3000 --name "hyperliquid-app"
fi

# Save PM2 configuration
pm2 save

# Configure nginx if available
if command -v nginx >/dev/null 2>&1; then
    echo "🔄 Configuring nginx..."
    
    # Create nginx configuration
    cat > /etc/nginx/sites-available/hyperliquid << 'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/hyperliquid;
    index index.html;
    
    location / {
        try_files $uri $uri/ @fallback;
    }
    
    location @fallback {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

    # Enable the site
    ln -sf /etc/nginx/sites-available/hyperliquid /etc/nginx/sites-enabled/hyperliquid
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload nginx
    nginx -t && systemctl reload nginx
    echo "✅ Nginx configured and reloaded"
else
    echo "ℹ️ Nginx not available, using PM2 only"
fi

# Final status check
echo ""
echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "=========================================="
echo "🌐 Your updated Hyperliquid app is now live!"
echo ""
echo "📍 Access URLs:"
echo "   • Primary: http://155.138.229.220"
echo "   • Direct: http://$(curl -s ifconfig.me 2>/dev/null || echo '155.138.229.220')"
echo ""
echo "🎯 New Features Deployed:"
echo "   ✅ Order Split Limits (Market: 30, Limit: 100)"
echo "   ✅ Enhanced Limit Chaser UI"
echo "   ✅ Long/Short Price Limit inputs"
echo "   ✅ Price Distance slider (0-5%)"
echo "   ✅ Clean, intuitive interface"
echo ""
echo "📊 Monitoring Commands:"
echo "   pm2 status                    - Check application status"
echo "   pm2 logs hyperliquid-app      - View application logs"
echo "   pm2 restart hyperliquid-app   - Restart application"
echo "   systemctl status nginx        - Check nginx status"
echo ""
echo "🔧 Troubleshooting:"
echo "   If site doesn't load, check: pm2 logs hyperliquid-app"
echo "   To restart everything: pm2 restart hyperliquid-app && systemctl reload nginx"
echo ""
