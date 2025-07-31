# Secure Deployment Guide for Hyperliquid

This guide provides secure deployment options without storing credentials in GitHub.

## Option 1: Interactive PowerShell Deployment

The safest and easiest way to deploy:

```powershell
# Run the interactive deployment script
./interactive-deploy.ps1
```

This script will:
1. Prompt you for server credentials securely
2. Build the application
3. Create deployment package
4. Upload and deploy to your server
5. Start the application with PM2

## Option 2: Manual Deployment

### Step 1: Build Locally
```powershell
npm run build
```

### Step 2: Create Deployment Package
```powershell
# Create deployment folder
Remove-Item -Recurse -Force deployment -ErrorAction SilentlyContinue
mkdir deployment

# Copy files
Copy-Item -Recurse dist\* deployment\
Copy-Item package.json deployment\
Copy-Item ecosystem.config.cjs deployment\

# Create zip (or use any zip tool)
Compress-Archive -Path deployment\* -DestinationPath hyperliquid-manual.zip
```

### Step 3: Upload to Server
Upload `hyperliquid-manual.zip` to your server's `/tmp/` directory using:
- SCP: `scp hyperliquid-manual.zip user@155.138.229.220:/tmp/`
- SFTP client (FileZilla, WinSCP, etc.)
- Any file transfer method you prefer

### Step 4: Deploy on Server
SSH into your server and run:

```bash
# Go to uploaded files
cd /tmp

# Stop current app
pm2 stop hyperliquid-app || true
pm2 delete hyperliquid-app || true

# Clean up old files
rm -rf /var/www/hyperliquid
mkdir -p /var/www/hyperliquid

# Extract and copy
unzip -o hyperliquid-manual.zip -d extracted/
cp -r extracted/* /var/www/hyperliquid/

# Set permissions
chown -R www-data:www-data /var/www/hyperliquid
chmod -R 755 /var/www/hyperliquid

# Install and start
cd /var/www/hyperliquid
npm install --production
pm2 start ecosystem.config.cjs
pm2 save

# Check status
pm2 list
curl -I http://localhost:3000

# Cleanup
rm -rf /tmp/extracted /tmp/hyperliquid-manual.zip
```

## Option 3: GitHub Actions Build Only

The GitHub Actions workflow now only builds and tests your code. It creates build artifacts that you can download and deploy manually.

### After each push:
1. Check the GitHub Actions tab
2. Download the build artifact
3. Use Option 1 or 2 above to deploy

## Security Benefits

✅ **No credentials stored in GitHub**  
✅ **You control when deployments happen**  
✅ **Credentials are entered securely**  
✅ **Full control over deployment process**  
✅ **Can review changes before deploying**  

## Current Application Status

Your application is running at: **http://155.138.229.220**

To check if it's running:
```bash
curl -I http://155.138.229.220
pm2 list
```

## Troubleshooting

If deployment fails:
1. Check server connectivity: `ping 155.138.229.220`
2. Verify SSH access: `ssh user@155.138.229.220`
3. Check server logs: `pm2 logs hyperliquid-app`
4. Verify port 3000 is available: `netstat -tulpn | grep 3000`

## Next Steps

When you're ready to deploy:
1. Make your code changes
2. Test locally: `npm run dev`
3. Run: `./interactive-deploy.ps1`
4. Follow the prompts
5. Your app will be live!
