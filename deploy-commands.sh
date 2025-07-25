#!/bin/bash
# Auto-generated deployment commands
cd /tmp
unzip -o hyperliquid-deployment.zip
pm2 stop hyperliquid-app || true
mkdir -p /var/www/hyperliquid
cp -r dist/* /var/www/hyperliquid/ 2>/dev/null || true
cp -r deployment/* /var/www/hyperliquid/ 2>/dev/null || true
cp package.json /var/www/hyperliquid/ 2>/dev/null || true
cp ecosystem.config.js /var/www/hyperliquid/ 2>/dev/null || true
chown -R www-data:www-data /var/www/hyperliquid
chmod -R 755 /var/www/hyperliquid
cd /var/www/hyperliquid
npm install --production
pm2 start ecosystem.config.js
pm2 save
systemctl reload nginx
echo "ðŸŽ‰ Deployment completed successfully!"
echo "ðŸŒ Application available at: http://155.138.229.220"
