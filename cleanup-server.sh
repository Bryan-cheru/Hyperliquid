#!/bin/bash

# Server Cleanup Script for Hyperliquid
# Removes unnecessary files and frees up memory/disk space

echo "🧹 Starting Server Cleanup..."
echo "============================="

# Get initial disk usage
echo "📊 Initial disk usage:"
df -h /

echo ""
echo "🗑️ Cleaning up temporary files..."

# Clean /tmp directory (keep our deployment files)
cd /tmp
find . -name "*.log" -mtime +1 -delete 2>/dev/null || true
find . -name "*.tmp" -mtime +1 -delete 2>/dev/null || true
find . -name "core.*" -delete 2>/dev/null || true

# Keep only recent deployment files, remove old extractions
ls -la
echo "Removing old extraction files..."
rm -rf dist deployment assets 2>/dev/null || true
rm -f *.html *.js *.css *.svg deploy.sh nginx.conf 2>/dev/null || true
# Keep: hyperliquid-deployment.zip, full-deploy.sh, server-deploy.sh, enhanced-deploy.sh

echo "✅ /tmp cleaned"

# Clean old backups (keep only last 3)
echo ""
echo "🗂️ Managing backups..."
cd /var/backups
if [ -d "/var/backups" ]; then
    echo "Current backups:"
    ls -la hyperliquid-backup-* 2>/dev/null || echo "No backups found"
    
    # Keep only the 3 most recent backups
    ls -t hyperliquid-backup-* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true
    
    echo "Backups after cleanup:"
    ls -la hyperliquid-backup-* 2>/dev/null || echo "No backups found"
fi

# Clean system caches
echo ""
echo "🧽 Cleaning system caches..."

# Clean apt cache
apt-get clean 2>/dev/null || echo "apt-get not available"

# Clean npm cache
npm cache clean --force 2>/dev/null || echo "npm cache clean skipped"

# Clean PM2 logs
pm2 flush 2>/dev/null || echo "PM2 logs already clean"

# Clean old log files
echo ""
echo "📋 Cleaning old log files..."
find /var/log -name "*.log.*" -mtime +7 -delete 2>/dev/null || true
find /var/log -name "*.gz" -mtime +7 -delete 2>/dev/null || true

# Clean old kernels (keep current + 1)
echo ""
echo "🔧 Cleaning old kernels..."
apt-get autoremove --purge -y 2>/dev/null || echo "Kernel cleanup skipped"

# Clean orphaned packages
echo ""
echo "📦 Removing orphaned packages..."
apt-get autoremove -y 2>/dev/null || echo "Package cleanup skipped"

# Clean user caches
echo ""
echo "👤 Cleaning user caches..."
rm -rf /root/.cache/* 2>/dev/null || true
rm -rf /root/.npm/_cacache 2>/dev/null || true

# Clean Docker if installed
if command -v docker >/dev/null 2>&1; then
    echo ""
    echo "🐳 Cleaning Docker..."
    docker system prune -f 2>/dev/null || echo "Docker cleanup skipped"
fi

# Memory cleanup
echo ""
echo "💾 Freeing memory..."

# Drop caches
sync
echo 1 > /proc/sys/vm/drop_caches
echo 2 > /proc/sys/vm/drop_caches
echo 3 > /proc/sys/vm/drop_caches

# Show current memory usage
echo "Current memory usage:"
free -h

# Show disk usage after cleanup
echo ""
echo "📊 Disk usage after cleanup:"
df -h /

# Show space freed
echo ""
echo "📁 Directory sizes:"
du -sh /var/www/hyperliquid 2>/dev/null || echo "App directory: not found"
du -sh /var/backups 2>/dev/null || echo "Backups: none"
du -sh /tmp 2>/dev/null || echo "Temp: minimal"

echo ""
echo "✅ CLEANUP COMPLETED!"
echo "===================="
echo "🎯 Server optimized for Electron app deployment"
echo "💾 Memory and disk space freed up"
echo "🚀 Ready for next deployment phase"
echo ""

# Show final system status
echo "🖥️ System Status:"
echo "├─ CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "├─ Memory: $(free -h | awk 'NR==2{printf "Used: %s/%s (%.2f%%)", $3,$2,$3*100/$2}')"
echo "├─ Disk: $(df -h / | awk 'NR==2{printf "Used: %s/%s (%s)", $3,$2,$5}')"
echo "└─ PM2 Status:"
pm2 status 2>/dev/null | tail -n +4 || echo "   No PM2 processes"
echo ""
