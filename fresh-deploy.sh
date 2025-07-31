#!/bin/bash
set -e

echo "=== FRESH HYPERLIQUID DEPLOYMENT ==="

# Stop any existing processes
echo "Stopping existing processes..."
pm2 stop all || true
pm2 delete all || true

# Clean up completely
echo "Cleaning up old files..."
rm -rf /var/www/hyperliquid
rm -rf /tmp/hyperliquid-*
rm -rf /tmp/extracted
mkdir -p /var/www/hyperliquid
mkdir -p /var/log/hyperliquid

# Extract fresh deployment
echo "Extracting fresh deployment..."
cd /tmp
if [ -f "hyperliquid-fresh-deployment.zip" ]; then
    unzip -o hyperliquid-fresh-deployment.zip -d extracted/
    echo "Files extracted successfully"
    ls -la extracted/
else
    echo "ERROR: hyperliquid-fresh-deployment.zip not found!"
    exit 1
fi

# Copy files
echo "Copying files to web directory..."
cp -r extracted/* /var/www/hyperliquid/
chown -R www-data:www-data /var/www/hyperliquid
chmod -R 755 /var/www/hyperliquid

# Install dependencies
echo "Installing dependencies..."
cd /var/www/hyperliquid
npm install --omit=dev

# Start application
echo "Starting application with PM2..."
pm2 start ecosystem.config.cjs
pm2 save

# Clean up temp files
echo "Cleaning up..."
rm -rf /tmp/extracted
rm -f /tmp/hyperliquid-fresh-deployment.zip

echo "=== DEPLOYMENT COMPLETED ==="
echo "Application URL: http://155.138.229.220"
pm2 list

# Test the application
echo "Testing application..."
sleep 5
curl -f http://localhost:3000 || echo "Application starting up..."
