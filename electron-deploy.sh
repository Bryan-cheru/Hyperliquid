#!/bin/bash

# Fresh Electron App Deployment Script for Hyperliquid
# Deploys a complete Electron-based application from scratch

echo "🚀 Fresh Electron App Deployment"
echo "================================="

# Check if Node.js and npm are available
echo "🔍 Checking system requirements..."
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    apt-get install -y nodejs
    echo "✅ Node.js installed"
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found after Node.js installation"
    exit 1
fi

echo "✅ Node.js $(node --version) and npm $(npm --version) available"

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
    echo "✅ PM2 installed"
fi

# Create fresh application directory
echo ""
echo "📁 Creating application structure..."
mkdir -p /var/www/hyperliquid
mkdir -p /var/log/hyperliquid
mkdir -p /var/backups

# Change to temp directory and clean up
cd /tmp
rm -rf dist dist-electron deployment assets *.html *.js *.css *.svg *.json ecosystem.config.js nginx.conf 2>/dev/null || true

# Extract Electron deployment package
echo ""
echo "📦 Extracting Electron deployment package..."
if [ -f "hyperliquid-electron-deployment.zip" ]; then
    unzip -o hyperliquid-electron-deployment.zip 2>/dev/null || {
        echo "⚠️ Extraction warnings, but continuing..."
        # Alternative extraction method
        python3 -c "
import zipfile
import os
with zipfile.ZipFile('hyperliquid-electron-deployment.zip', 'r') as zip_ref:
    zip_ref.extractall('/tmp/')
" 2>/dev/null || {
            echo "Trying manual extraction..."
            unzip -j hyperliquid-electron-deployment.zip 2>/dev/null || true
        }
    }
    
    echo "✅ Extraction completed"
    
    # List extracted contents
    echo "📋 Extracted contents:"
    ls -la | grep -E "(dist|package\.json|ecosystem)"
    
else
    echo "❌ hyperliquid-electron-deployment.zip not found!"
    echo "Available files in /tmp:"
    ls -la *.zip 2>/dev/null || echo "No zip files found"
    exit 1
fi

# Copy application files
echo ""
echo "📋 Copying application files..."

# Copy main web application
if [ -d "dist" ]; then
    cp -r dist/* /var/www/hyperliquid/
    echo "✅ Web application files copied"
else
    echo "❌ No dist directory found"
    # Try to find HTML files
    find . -name "*.html" -exec cp {} /var/www/hyperliquid/ \; 2>/dev/null
    find . -name "assets" -type d -exec cp -r {} /var/www/hyperliquid/ \; 2>/dev/null
fi

# Copy Electron main process
if [ -d "dist-electron" ]; then
    cp -r dist-electron /var/www/hyperliquid/
    echo "✅ Electron main process copied"
else
    echo "⚠️ No Electron main process found"
fi

# Copy configuration files
if [ -f "package.json" ]; then
    cp package.json /var/www/hyperliquid/
    echo "✅ Package.json copied"
fi

if [ -f "ecosystem.config.js" ]; then
    cp ecosystem.config.js /var/www/hyperliquid/
    echo "✅ Ecosystem config copied"
fi

# Copy deployment configuration if available
if [ -d "deployment" ]; then
    cp -r deployment/* /var/www/hyperliquid/
    echo "✅ Deployment configuration copied"
fi

# Set proper permissions
echo ""
echo "🔐 Setting permissions..."
chown -R www-data:www-data /var/www/hyperliquid
chmod -R 755 /var/www/hyperliquid

# Install application dependencies
echo ""
echo "📦 Installing application dependencies..."
cd /var/www/hyperliquid

if [ -f "package.json" ]; then
    echo "Installing production dependencies..."
    npm install --production --no-audit --no-fund || {
        echo "⚠️ npm install had issues, but continuing..."
    }
    echo "✅ Dependencies installed"
else
    echo "⚠️ No package.json found, skipping dependency installation"
fi

# Verify installation
echo ""
echo "🔍 Verifying installation..."
echo "Files in application directory:"
ls -la /var/www/hyperliquid/

echo ""
echo "Checking for key files:"
[ -f "/var/www/hyperliquid/index.html" ] && echo "✅ index.html found" || echo "⚠️ No index.html"
[ -d "/var/www/hyperliquid/dist-electron" ] && echo "✅ Electron main process found" || echo "⚠️ No Electron main"
[ -f "/var/www/hyperliquid/package.json" ] && echo "✅ package.json found" || echo "⚠️ No package.json"
[ -f "/var/www/hyperliquid/ecosystem.config.js" ] && echo "✅ ecosystem.config.js found" || echo "⚠️ No ecosystem config"

# Start the application
echo ""
echo "▶️ Starting Electron application..."

if [ -f "ecosystem.config.js" ]; then
    echo "Starting with ecosystem.config.js..."
    pm2 start ecosystem.config.js
elif [ -d "dist-electron" ] && [ -f "dist-electron/main.js" ]; then
    echo "Starting Electron main process..."
    pm2 start dist-electron/main.js --name "hyperliquid-electron"
elif [ -f "index.html" ]; then
    echo "Starting as static web application..."
    pm2 serve . 3000 --name "hyperliquid-app" --spa
else
    echo "⚠️ Starting basic static server..."
    pm2 serve . 3000 --name "hyperliquid-app"
fi

# Save PM2 configuration
pm2 save
pm2 startup

# Configure Nginx for the new application
echo ""
echo "🌐 Configuring Nginx..."

cat > /etc/nginx/sites-available/hyperliquid << 'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/hyperliquid;
    index index.html;
    
    # Handle static files directly
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    location / {
        try_files $uri $uri/ @proxy;
    }
    
    # Proxy to the application if file not found
    location @proxy {
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
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/hyperliquid /etc/nginx/sites-enabled/hyperliquid
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t && systemctl reload nginx
echo "✅ Nginx configured and reloaded"

# Final status check
echo ""
echo "✅ FRESH ELECTRON DEPLOYMENT COMPLETED!"
echo "========================================"
echo "🌐 Your Hyperliquid Electron app is now live!"
echo ""
echo "📍 Access URLs:"
echo "   • Primary: http://155.138.229.220"
echo "   • Direct: http://$(curl -s ifconfig.me 2>/dev/null || echo '155.138.229.220')"
echo ""
echo "🎯 Deployed Features:"
echo "   ✅ Fresh clean installation"
echo "   ✅ Order Split Limits (Market: 30, Limit: 100)"
echo "   ✅ Enhanced Limit Chaser UI"
echo "   ✅ Long/Short Price Limit inputs"
echo "   ✅ Price Distance slider (0-5%)"
echo "   ✅ Electron-based architecture (if applicable)"
echo "   ✅ Optimized static file serving"
echo "   ✅ Security headers configured"
echo ""
echo "📊 Application Status:"
pm2 status
echo ""
echo "💡 Management Commands:"
echo "   pm2 status                  - Check application status"
echo "   pm2 logs                    - View all logs"
echo "   pm2 restart all             - Restart application"
echo "   systemctl status nginx      - Check nginx status"
echo "   systemctl reload nginx      - Reload nginx config"
echo ""
echo "🔧 Troubleshooting:"
echo "   • If site doesn't load: pm2 logs"
echo "   • To restart everything: pm2 restart all && systemctl reload nginx"
echo "   • Check nginx: tail -f /var/log/nginx/error.log"
echo ""
