# Manual Deployment Guide for Hyperliquid

## Files Created:
✅ `hyperliquid-manual-deployment.zip` - Your application package
✅ `deploy-server.sh` - Server deployment script

## Manual Deployment Steps:

### Step 1: Upload Files to Server
Upload these files to your server at `155.138.229.220`:

1. **Upload the zip file:**
   ```bash
   scp hyperliquid-manual-deployment.zip root@155.138.229.220:/tmp/
   ```

2. **Upload the deployment script:**
   ```bash
   scp deploy-server.sh root@155.138.229.220:/tmp/
   ```

### Step 2: Execute Deployment on Server
SSH into your server and run the deployment:

```bash
# Connect to server
ssh root@155.138.229.220

# Make script executable and run it
chmod +x /tmp/deploy-server.sh
/tmp/deploy-server.sh
```

### Step 3: Verify Deployment
After deployment, check:

1. **PM2 Status:**
   ```bash
   pm2 list
   pm2 logs hyperliquid-app
   ```

2. **Application URL:**
   ```
   http://155.138.229.220
   ```

3. **Server Health:**
   ```bash
   curl -I http://localhost:3000
   ```

## Troubleshooting:

### If deployment fails:
1. Check PM2 logs: `pm2 logs hyperliquid-app`
2. Check server logs: `tail -f /var/log/hyperliquid/*.log`
3. Restart PM2: `pm2 restart hyperliquid-app`

### If application doesn't start:
1. Check dependencies: `cd /var/www/hyperliquid && npm install`
2. Check PM2 config: `cat /var/www/hyperliquid/ecosystem.config.cjs`
3. Manual start: `cd /var/www/hyperliquid && npm start`

## Quick Commands:

```bash
# Stop application
pm2 stop hyperliquid-app

# Start application
pm2 start hyperliquid-app

# Restart application
pm2 restart hyperliquid-app

# View logs
pm2 logs hyperliquid-app

# Check status
pm2 list
```

## Your Application Features:
✅ Entry Position Control with Fill or Cancel
✅ Entry Limit Chaser
✅ Stop Loss Limit Chaser (with seconds-based timeframe)
✅ Basket Orders
✅ Price distance controls
✅ Multiple account support
✅ Real-time trading interface

Ready for deployment! 🚀
