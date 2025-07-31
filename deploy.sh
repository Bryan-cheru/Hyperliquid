#!/bin/bash

# Hyperliquid Deployment Script
# This script automates the deployment process

set -e  # Exit on any error

echo "🚀 Starting Hyperliquid Deployment..."

# Configuration
SERVER_IP="155.138.229.220"
SERVER_USER="root"
APP_NAME="hyperliquid-app"
WEB_DIR="/var/www/hyperliquid"
LOG_DIR="/var/log/hyperliquid"

# Build the application
echo "📦 Building application..."
npm run build

# Create deployment package
echo "📁 Creating deployment package..."
rm -rf deployment
mkdir deployment
cp -r dist/* deployment/
cp package.json deployment/
cp ecosystem.config.js deployment/

# Create archive
echo "🗜️ Creating archive..."
cd deployment
zip -r ../hyperliquid-deployment.zip .
cd ..

# Upload to server
echo "⬆️ Uploading to server..."
scp hyperliquid-deployment.zip ${SERVER_USER}@${SERVER_IP}:/tmp/

# Deploy on server
echo "🔄 Deploying on server..."
ssh ${SERVER_USER}@${SERVER_IP} << EOF
    set -e
    
    echo "Stopping current application..."
    pm2 stop ${APP_NAME} || true
    pm2 delete ${APP_NAME} || true
    
    echo "Cleaning up old files..."
    rm -rf ${WEB_DIR}
    rm -rf /tmp/hyperliquid-*
    rm -rf /tmp/extracted
    
    echo "Creating directories..."
    mkdir -p ${WEB_DIR}
    mkdir -p ${LOG_DIR}
    
    echo "Extracting deployment..."
    cd /tmp
    unzip -o hyperliquid-deployment.zip -d extracted/
    
    echo "Copying files..."
    cp -r extracted/* ${WEB_DIR}/
    
    echo "Setting permissions..."
    chown -R www-data:www-data ${WEB_DIR}
    chmod -R 755 ${WEB_DIR}
    
    echo "Installing dependencies..."
    cd ${WEB_DIR}
    
    # Handle ecosystem config
    if [ -f "ecosystem.config.js" ]; then
        mv ecosystem.config.js ecosystem.config.cjs
    fi
    
    npm install --production
    
    echo "Starting application..."
    pm2 start ecosystem.config.cjs
    pm2 save
    
    echo "Cleaning up..."
    rm -rf /tmp/extracted
    rm -f /tmp/hyperliquid-deployment.zip
    
    echo "✅ Deployment completed successfully!"
    pm2 list
EOF

echo "🎉 Deployment finished! Your app is live at http://${SERVER_IP}"
