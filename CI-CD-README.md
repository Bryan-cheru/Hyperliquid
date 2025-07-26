# 🚀 Hyperliquid CI/CD Deployment Guide

This project includes automated deployment using GitHub Actions and manual deployment scripts.

## 🔧 Setup Instructions

### 1. GitHub Actions (Automated CI/CD)

To enable automatic deployment when you push to GitHub:

#### Step 1: Add Repository Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `SERVER_HOST`: `155.138.229.220`
- `SERVER_USER`: `root`
- `SERVER_PASSWORD`: `[your server password]`

#### Step 2: Push to Repository
The deployment will automatically trigger when you push to `main` or `order-split` branches.

### 2. Manual Deployment Scripts

#### For Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

#### For Windows (PowerShell):
```powershell
.\deploy.ps1
```

## 📋 What the CI/CD Pipeline Does

1. **Test Phase:**
   - Installs dependencies
   - Runs tests (if available)
   - Builds the application

2. **Deploy Phase:**
   - Creates deployment package
   - Uploads to server
   - Stops old application
   - Installs new version
   - Starts application with PM2

## 🔍 Monitoring

After deployment, you can check your application:
- **Website**: http://155.138.229.220
- **PM2 Status**: `pm2 list`
- **Logs**: `pm2 logs hyperliquid-app`

## 🛠️ Manual Deployment Commands

If you prefer to deploy manually:

```bash
# Build locally
npm run build

# Upload and deploy
scp hyperliquid-deployment.zip root@155.138.229.220:/tmp/
ssh root@155.138.229.220

# On server:
cd /tmp
unzip -o hyperliquid-deployment.zip -d extracted/
pm2 stop hyperliquid-app || true
rm -rf /var/www/hyperliquid
mkdir -p /var/www/hyperliquid
cp -r extracted/* /var/www/hyperliquid/
cd /var/www/hyperliquid
mv ecosystem.config.js ecosystem.config.cjs
npm install --production
pm2 start ecosystem.config.cjs
pm2 save
```

## 🔄 Rollback

To rollback to a previous version:
```bash
ssh root@155.138.229.220
pm2 stop hyperliquid-app
# Restore previous backup
pm2 start ecosystem.config.cjs
```

## 📝 Environment Variables

The ecosystem.config.cjs includes:
- `NODE_ENV=production`
- `PORT=3000`
- `MONGODB_URI`
- `VITE_API_URL`
- `VITE_TESTNET_URL`

## 🚨 Troubleshooting

- **Check PM2 status**: `pm2 list`
- **View logs**: `pm2 logs hyperliquid-app`
- **Restart app**: `pm2 restart hyperliquid-app`
- **Server status**: `curl -I http://155.138.229.220`
