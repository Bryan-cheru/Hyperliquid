# 🚀 LIVE SSH DEPLOYMENT SESSION

## Step 1: Connect to Server
```bash
ssh root@155.138.229.220
```

## Step 2: Stop Current Application
```bash
pm2 stop all
pm2 delete hyperliquid-app || true
pm2 list  # Should show no processes
```

## Step 3: Complete Cleanup (Remove Old Files)
```bash
# Remove old application completely
rm -rf /var/www/hyperliquid
rm -rf /tmp/hyperliquid-*
rm -rf /tmp/dist
rm -rf /tmp/deployment

# Verify cleanup
ls -la /var/www/
ls -la /tmp/hyperliquid* || echo "✅ Old files removed"
```

## Step 4: Upload New Files (From Local Machine)
```bash
# On your local machine (new terminal):
scp hyperliquid-deployment.zip root@155.138.229.220:/tmp/
scp clean-deploy.sh root@155.138.229.220:/tmp/
```

## Step 5: Extract and Deploy (Back on Server)
```bash
cd /tmp
chmod +x clean-deploy.sh
unzip -o hyperliquid-deployment.zip
ls -la  # Verify files extracted
```

## Step 6: Fresh Installation
```bash
# Create fresh directories
mkdir -p /var/www/hyperliquid
mkdir -p /var/log/hyperliquid

# Copy new files
cp -r dist/* /var/www/hyperliquid/
cp -r deployment/* /var/www/hyperliquid/
cp package.json /var/www/hyperliquid/
cp ecosystem.config.js /var/www/hyperliquid/

# Set permissions
chown -R www-data:www-data /var/www/hyperliquid
chmod -R 755 /var/www/hyperliquid
```

## Step 7: Install Dependencies
```bash
cd /var/www/hyperliquid
rm -rf node_modules  # Clean slate
npm cache clean --force
npm install --production
```

## Step 8: Start Application
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 list  # Should show hyperliquid-app running
```

## Step 9: Verify Deployment
```bash
systemctl reload nginx
curl -I http://localhost:3000
curl -I http://155.138.229.220
```

## Step 10: Test Access
Visit: http://155.138.229.220
