#!/bin/bash

# Complete Hyperliquid App Removal Script
# Removes all existing application files and services

echo "🗑️ Complete Hyperliquid App Removal"
echo "===================================="

# Stop and remove all PM2 processes
echo "⏹️ Stopping and removing PM2 processes..."
pm2 stop all 2>/dev/null || echo "No PM2 processes running"
pm2 delete all 2>/dev/null || echo "No PM2 processes to delete"
pm2 kill 2>/dev/null || echo "PM2 daemon already stopped"

# Clear PM2 startup
pm2 unstartup 2>/dev/null || echo "No PM2 startup to remove"

# Remove application directory completely
echo ""
echo "🧹 Removing application directory..."
if [ -d "/var/www/hyperliquid" ]; then
    rm -rf /var/www/hyperliquid
    echo "✅ /var/www/hyperliquid removed"
else
    echo "ℹ️ No application directory found"
fi

# Remove nginx configuration
echo ""
echo "🌐 Removing nginx configuration..."
if [ -f "/etc/nginx/sites-enabled/hyperliquid" ]; then
    rm -f /etc/nginx/sites-enabled/hyperliquid
    echo "✅ Nginx site disabled"
fi

if [ -f "/etc/nginx/sites-available/hyperliquid" ]; then
    rm -f /etc/nginx/sites-available/hyperliquid
    echo "✅ Nginx configuration removed"
fi

# Test and reload nginx
nginx -t && systemctl reload nginx 2>/dev/null || echo "⚠️ Nginx reload skipped"

# Remove log directories
echo ""
echo "📋 Cleaning log directories..."
if [ -d "/var/log/hyperliquid" ]; then
    rm -rf /var/log/hyperliquid
    echo "✅ Log directory removed"
fi

# Clean PM2 logs and config
echo ""
echo "🧽 Cleaning PM2 configuration..."
rm -rf /root/.pm2/logs/* 2>/dev/null || true
rm -f /root/.pm2/dump.pm2 2>/dev/null || true
rm -f /root/.pm2/module_conf.json 2>/dev/null || true
echo "✅ PM2 configuration cleaned"

# Remove all backups
echo ""
echo "🗂️ Removing all backups..."
if [ -d "/var/backups" ]; then
    rm -rf /var/backups/hyperliquid-backup-* 2>/dev/null || true
    echo "✅ All backups removed"
fi

# Clean temp files
echo ""
echo "🗑️ Removing temp deployment files..."
cd /tmp
rm -rf dist deployment assets 2>/dev/null || true
rm -f *.html *.js *.css *.svg *.json deploy.sh nginx.conf ecosystem.config.js 2>/dev/null || true
rm -f hyperliquid-deployment.zip 2>/dev/null || true
rm -f *-deploy.sh 2>/dev/null || true
echo "✅ Temp files cleaned"

# Check for any remaining processes
echo ""
echo "🔍 Checking for remaining processes..."
PROCS=$(ps aux | grep -i hyperliquid | grep -v grep | wc -l)
if [ "$PROCS" -gt 0 ]; then
    echo "⚠️ Found $PROCS remaining processes:"
    ps aux | grep -i hyperliquid | grep -v grep
    echo "Killing remaining processes..."
    pkill -f hyperliquid 2>/dev/null || true
else
    echo "✅ No remaining processes found"
fi

# Check ports
echo ""
echo "🌐 Checking ports..."
if netstat -tlnp | grep -q ":3000"; then
    echo "⚠️ Port 3000 still in use:"
    netstat -tlnp | grep ":3000"
    echo "Killing processes on port 3000..."
    fuser -k 3000/tcp 2>/dev/null || true
else
    echo "✅ Port 3000 is free"
fi

if netstat -tlnp | grep -q ":80"; then
    echo "ℹ️ Port 80 in use (nginx - normal):"
    netstat -tlnp | grep ":80"
else
    echo "ℹ️ Port 80 is free"
fi

# Final cleanup - memory and caches
echo ""
echo "💾 Final memory cleanup..."
sync
echo 1 > /proc/sys/vm/drop_caches
echo 2 > /proc/sys/vm/drop_caches
echo 3 > /proc/sys/vm/drop_caches

# Show final status
echo ""
echo "✅ COMPLETE REMOVAL FINISHED!"
echo "============================="
echo "🖥️ Final Server Status:"
echo "├─ PM2 Processes: $(pm2 list 2>/dev/null | grep -c online || echo '0')"
echo "├─ Hyperliquid Processes: $(ps aux | grep -i hyperliquid | grep -v grep | wc -l)"
echo "├─ Port 3000: $(netstat -tlnp | grep -q ':3000' && echo 'In Use' || echo 'Free')"
echo "├─ Application Directory: $([ -d '/var/www/hyperliquid' ] && echo 'Exists' || echo 'Removed')"
echo "├─ Nginx Config: $([ -f '/etc/nginx/sites-available/hyperliquid' ] && echo 'Exists' || echo 'Removed')"
echo "├─ Memory: $(free -h | awk 'NR==2{printf "Used: %s/%s (%.2f%%)", $3,$2,$3*100/$2}')"
echo "└─ Disk: $(df -h / | awk 'NR==2{printf "Used: %s/%s (%s)", $3,$2,$5}')"
echo ""
echo "🚀 Server is now completely clean and ready for fresh deployment!"
echo "💡 You can now deploy a completely new version of the application."
echo ""
