#!/bin/bash
set -e

echo "=== SIMPLE DEPLOYMENT ==="

# Stop existing processes
pm2 stop all || true
pm2 delete all || true

# Clean directories
rm -rf /var/www/hyperliquid
mkdir -p /var/www/hyperliquid
mkdir -p /var/log/hyperliquid

echo "Directories cleaned and created"

# Check if zip exists
echo "Checking for deployment file..."
ls -la /tmp/hyperliquid*

echo "Done with setup. Ready for manual file copy."
