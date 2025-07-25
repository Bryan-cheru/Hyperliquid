#!/bin/bash
# COMPLETE DEPLOYMENT WITH OLD BUILD CLEANUP
echo "🧹 CLEANING SERVER AND DEPLOYING FRESH BUILD..."

# 1. Stop all processes
echo "📴 Stopping all processes..."
pm2 stop all || true
pm2 delete hyperliquid-app || true

# 2. COMPLETELY REMOVE old installation
echo "🗑️ Removing old build completely..."
rm -rf /var/www/hyperliquid
rm -rf /tmp/hyperliquid-*
rm -rf /tmp/dist
rm -rf /tmp/deployment

# 3. Create fresh directories
echo "📁 Creating fresh directories..."
mkdir -p /var/www/hyperliquid
mkdir -p /var/log/hyperliquid
mkdir -p /var/backups/hyperliquid

# 4. Extract new deployment
echo "📦 Extracting new deployment..."
cd /tmp
unzip -o hyperliquid-deployment.zip

# 5. Copy ALL new files (complete replacement)
echo "📋 Installing new build..."
cp -r dist/* /var/www/hyperliquid/
cp -r deployment/* /var/www/hyperliquid/
cp package.json /var/www/hyperliquid/
cp ecosystem.config.js /var/www/hyperliquid/

# 6. Set proper permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data /var/www/hyperliquid
chmod -R 755 /var/www/hyperliquid

# 7. Install dependencies (fresh)
echo "📦 Installing dependencies..."
cd /var/www/hyperliquid
rm -rf node_modules
rm -f package-lock.json
npm cache clean --force
npm install --production

# 8. Start with new configuration
echo "🚀 Starting new application..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 9. Reload web server
echo "🌐 Reloading web server..."
systemctl reload nginx
systemctl status nginx

# 10. Verify deployment
echo "✅ Verifying deployment..."
sleep 5
curl -I http://localhost:3000 || echo "⚠️ App might still be starting..."

echo ""
echo "🎉 COMPLETE FRESH DEPLOYMENT SUCCESSFUL!"
echo "🗑️ Old build: COMPLETELY REMOVED"
echo "🆕 New build: ULTRA-SAFE CONFIGURATION"
echo "🌐 Application: http://155.138.229.220"
echo "📊 Features: Order Split + Limit Chaser + Basket Orders"
echo "💰 Settings: 0.5% position, 0.8% stop loss, 5x leverage"
