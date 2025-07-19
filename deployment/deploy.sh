#!/bin/bash

# VPS Deployment Script for Hyperliquid Trading App
set -e

echo "🚀 Starting Hyperliquid deployment..."

# Variables
APP_DIR="/var/www/hyperliquid"
LOG_DIR="/var/log/hyperliquid"
BACKUP_DIR="/var/backups/hyperliquid"

# Create directories
mkdir -p $APP_DIR
mkdir -p $LOG_DIR
mkdir -p $BACKUP_DIR

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    apt-get install -y nodejs
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
fi

# Navigate to app directory
cd $APP_DIR

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build application
echo "🏗️ Building application..."
npm run build

# Create production environment
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://mongoadmin:t6AMn4hPFi8R@155.138.229.220:27017/defaultdb
VITE_API_URL=https://api.hyperliquid.xyz
VITE_TESTNET_URL=https://api.hyperliquid-testnet.xyz
VITE_APP_NAME=Hyperliquid Trading App
VITE_ENVIRONMENT=production
EOF

# Set permissions
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Configure PM2
pm2 delete hyperliquid-app 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Configure Nginx
cp nginx.conf /etc/nginx/sites-available/hyperliquid
ln -sf /etc/nginx/sites-available/hyperliquid /etc/nginx/sites-enabled/hyperliquid
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✅ Deployment completed!"
echo "🌐 Access your app at: http://155.138.229.220"
echo "📊 Monitor with: pm2 monit"
