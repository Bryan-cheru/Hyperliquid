#!/bin/bash

# Simple deployment receiver script
# Place this on your server and run it

echo "🚀 Hyperliquid Deployment Script"
echo "================================"

# Stop current application
echo "📤 Stopping current application..."
pm2 stop hyperliquid-app 2>/dev/null || echo "No application running"

# Create backup
echo "💾 Creating backup..."
if [ -d "/var/www/hyperliquid" ]; then
    cp -r /var/www/hyperliquid /var/backups/hyperliquid-$(date +%Y%m%d-%H%M%S)
    echo "✅ Backup created"
fi

# Create directories
echo "📁 Creating directories..."
mkdir -p /var/www/hyperliquid
mkdir -p /var/log/hyperliquid

# Extract deployment
echo "📦 Extracting deployment..."
cd /tmp
if [ -f "hyperliquid-deployment.zip" ]; then
    unzip -o hyperliquid-deployment.zip
    
    # Copy files
    echo "📋 Copying files..."
    cp -r dist/* /var/www/hyperliquid/ 2>/dev/null || echo "No dist files"
    cp -r deployment/* /var/www/hyperliquid/ 2>/dev/null || echo "No deployment files"
    cp package.json /var/www/hyperliquid/ 2>/dev/null || echo "No package.json"
    
    # Set permissions
    echo "🔐 Setting permissions..."
    chown -R www-data:www-data /var/www/hyperliquid
    chmod -R 755 /var/www/hyperliquid
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    cd /var/www/hyperliquid
    npm install --production
    
    # Start application
    echo "▶️ Starting application..."
    pm2 start ecosystem.config.js
    pm2 save
    
    # Restart web server
    echo "🔄 Restarting web server..."
    systemctl reload nginx
    
    echo "✅ Deployment completed!"
    echo "🌐 Access your app at: http://$(curl -s ifconfig.me)"
    
else
    echo "❌ hyperliquid-deployment.zip not found in /tmp/"
    echo "Please upload the file first"
fi
