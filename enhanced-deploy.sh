#!/bin/bash

# Enhanced Hyperliquid Deployment Script with Cleanup
# This script will properly clean up old files before deploying new ones
set -e  # Exit on any error

echo "🚀 Enhanced Hyperliquid Deployment Script"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (sudo)"
    exit 1
fi

# Stop current application
echo "📤 Stopping current application..."
pm2 stop hyperliquid-app 2>/dev/null || echo "No application running"

# Create backup directory if it doesn't exist
echo "💾 Creating backup..."
mkdir -p /var/backups
if [ -d "/var/www/hyperliquid" ]; then
    backup_name="hyperliquid-$(date +%Y%m%d-%H%M%S)"
    cp -r /var/www/hyperliquid /var/backups/$backup_name
    echo "✅ Backup created: /var/backups/$backup_name"
else
    echo "ℹ️ No existing installation to backup"
fi

# Clean up old installation completely
echo "🧹 Cleaning up old installation..."
if [ -d "/var/www/hyperliquid" ]; then
    rm -rf /var/www/hyperliquid/*
    echo "✅ Old files removed"
fi

# Create fresh directories
echo "📁 Creating fresh directories..."
mkdir -p /var/www/hyperliquid
mkdir -p /var/log/hyperliquid

# Clean up any previous extraction in /tmp
echo "🧹 Cleaning up previous extractions..."
cd /tmp
rm -rf dist/ deployment/ package.json 2>/dev/null || true

# Check if deployment file exists
if [ ! -f "hyperliquid-deployment.zip" ]; then
    echo "❌ hyperliquid-deployment.zip not found in /tmp/"
    echo "📋 Please upload the file first"
    exit 1
fi

# Extract with error checking
echo "📂 Extracting fresh deployment..."
unzip -o hyperliquid-deployment.zip || {
    echo "❌ Failed to extract deployment package"
    exit 1
}

# Verify extraction
if [ ! -d "dist" ]; then
    echo "❌ Extraction failed - dist directory not found"
    exit 1
fi

echo "📋 Files extracted:"
ls -la dist/ 2>/dev/null || echo "No dist directory contents"
ls -la deployment/ 2>/dev/null || echo "No deployment directory"

# Copy files with better error handling
echo "📋 Copying application files..."
if [ -d "dist" ]; then
    cp -r dist/* /var/www/hyperliquid/
    echo "✅ Application files copied ($(ls -1 dist/ | wc -l) files)"
else
    echo "❌ No dist directory found"
    exit 1
fi

if [ -d "deployment" ]; then
    cp -r deployment/* /var/www/hyperliquid/
    echo "✅ Deployment files copied"
else
    echo "⚠️ No deployment directory found (optional)"
fi

if [ -f "package.json" ]; then
    cp package.json /var/www/hyperliquid/
    echo "✅ Package.json copied"
else
    echo "⚠️ No package.json found"
fi

# Set proper permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data /var/www/hyperliquid
chmod -R 755 /var/www/hyperliquid

# Verify files are in place
echo "🔍 Verifying deployment..."
echo "Files in /var/www/hyperliquid:"
ls -la /var/www/hyperliquid/

# Install dependencies if package.json exists
echo "📦 Installing dependencies..."
cd /var/www/hyperliquid
if [ -f "package.json" ]; then
    # Check if npm is installed
    if command -v npm &> /dev/null; then
        npm install --production --no-audit --no-fund || {
            echo "⚠️ npm install failed, but continuing..."
        }
    else
        echo "⚠️ npm not found, skipping dependency installation"
    fi
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2 || {
        echo "❌ Failed to install PM2"
        exit 1
    }
fi

# Start application
echo "▶️ Starting application..."
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js || {
        echo "⚠️ Failed to start with ecosystem.config.js, trying alternative..."
        pm2 start npm --name "hyperliquid-app" -- start
    }
else
    echo "⚠️ No ecosystem.config.js found, starting basic server..."
    pm2 start npm --name "hyperliquid-app" -- start
fi

pm2 save || echo "⚠️ Failed to save PM2 configuration"

# Restart web server if nginx is available
echo "🔄 Restarting web server..."
if command -v nginx &> /dev/null; then
    nginx -t && systemctl reload nginx || {
        echo "⚠️ Nginx reload failed, but application may still work"
    }
else
    echo "ℹ️ Nginx not found, skipping web server restart"
fi

# Get server IP
server_ip=$(curl -s ifconfig.me 2>/dev/null || echo "155.138.229.220")

echo ""
echo "✅ Enhanced Deployment completed successfully!"
echo "🌐 Access your updated app at:"
echo "   - HTTP: http://$server_ip"
echo "   - Direct: http://155.138.229.220"
echo ""
echo "🎯 New Features Deployed:"
echo "   ✅ Order Split Limits (Market: 30, Limit: 100)"
echo "   ✅ Enhanced Limit Chaser UI"
echo "   ✅ Long/Short Price Limit inputs"
echo "   ✅ Price Distance slider (0-5%)"
echo ""
echo "📊 Monitoring commands:"
echo "   - Check status: pm2 status"
echo "   - View logs: pm2 logs hyperliquid-app"
echo "   - Monitor: pm2 monit"
echo ""
