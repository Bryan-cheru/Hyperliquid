#!/bin/bash

# Electron App Deployment Script for VPS
# This script sets up the server to run the Electron app via Xvfb (headless)

set -e

echo "🚀 Starting Electron App deployment..."

# Variables
APP_DIR="/var/www/hyperliquid"
LOG_DIR="/var/log/hyperliquid"
BACKUP_DIR="/var/backups/hyperliquid"

# Create directories
mkdir -p $APP_DIR
mkdir -p $LOG_DIR
mkdir -p $BACKUP_DIR

# Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# Install Node.js LTS
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    apt-get install -y nodejs
fi

# Install PM2
echo "📦 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Install X11 and Xvfb for headless Electron
echo "📦 Installing X11 and Xvfb..."
apt install -y xvfb x11-apps imagemagick

# Install additional dependencies for Electron
echo "📦 Installing Electron dependencies..."
apt install -y \
    libnss3-dev \
    libatk-bridge2.0-dev \
    libdrm2 \
    libxkbcommon-dev \
    libgtk-3-dev \
    libxss1 \
    libasound2-dev \
    libxtst6 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0

# Install Nginx for serving static files
echo "📦 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
fi

# Navigate to app directory
cd $APP_DIR

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build Electron app
echo "🏗️ Building Electron app..."
npm run build-electron

# Create production environment
cat > .env.production << 'EOF'
NODE_ENV=production
DISPLAY=:99
MONGODB_URI=mongodb://mongoadmin:t6AMn4hPFi8R@155.138.229.220:27017/defaultdb
VITE_API_URL=https://api.hyperliquid.xyz
VITE_TESTNET_URL=https://api.hyperliquid-testnet.xyz
VITE_APP_NAME=Hyperliquid Trading App
VITE_ENVIRONMENT=production
EOF

# Create Xvfb service for headless display
cat > /etc/systemd/system/xvfb.service << 'EOF'
[Unit]
Description=X Virtual Frame Buffer Service
After=network.target

[Service]
ExecStart=/usr/bin/Xvfb :99 -screen 0 1024x768x24
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

# Enable and start Xvfb
systemctl daemon-reload
systemctl enable xvfb
systemctl start xvfb

# Set permissions
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Configure PM2 for Electron
pm2 delete hyperliquid-electron 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 startup
pm2 startup systemd -u root --hp /root

# Configure Nginx to serve static files
cp nginx.conf /etc/nginx/sites-available/hyperliquid
ln -sf /etc/nginx/sites-available/hyperliquid /etc/nginx/sites-enabled/hyperliquid
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✅ Electron app deployment completed!"
echo "🖥️  Electron app running headless on display :99"
echo "🌐 Static files served at: http://155.138.229.220"
echo "📊 Monitor with: pm2 monit"
echo "🔍 Check Xvfb: systemctl status xvfb"
