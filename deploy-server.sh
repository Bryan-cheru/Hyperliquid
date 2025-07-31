#!/bin/bash
echo "Starting Hyperliquid deployment..."

# Stop current application
pm2 stop hyperliquid-app || true
pm2 delete hyperliquid-app || true

# Clean up old files
rm -rf /var/www/hyperliquid
rm -rf /tmp/hyperliquid-*
rm -rf /tmp/extracted

# Create directories
mkdir -p /var/www/hyperliquid
mkdir -p /var/log/hyperliquid

# Extract deployment
cd /tmp
unzip -o hyperliquid-manual-deployment.zip -d extracted/

# Copy files to web directory
cp -r extracted/* /var/www/hyperliquid/

# Set permissions
chown -R www-data:www-data /var/www/hyperliquid
chmod -R 755 /var/www/hyperliquid

# Install dependencies and start
cd /var/www/hyperliquid
npm install --production
pm2 start ecosystem.config.cjs
pm2 save

# Cleanup
rm -rf /tmp/extracted
rm -f /tmp/hyperliquid-manual-deployment.zip

echo "Deployment completed successfully!"
echo "Application should be running at: http://your-server-ip"

# Check status
echo "PM2 Status:"
pm2 list

echo "Server Status:"
curl -I http://localhost:3000 || echo "Server might still be starting up..."
