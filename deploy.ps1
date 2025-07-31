# Hyperliquid Deployment Script (PowerShell)
# This script automates the deployment process for Windows

param(
    [string]$ServerIP = "155.138.229.220",
    [string]$ServerUser = "root",
    [string]$AppName = "hyperliquid-app"
)

Write-Host "🚀 Starting Hyperliquid Deployment..." -ForegroundColor Green

try {
    # Build the application
    Write-Host "📦 Building application..." -ForegroundColor Yellow
    npm run build
    
    # Create deployment package
    Write-Host "📁 Creating deployment package..." -ForegroundColor Yellow
    if (Test-Path "deployment") {
        Remove-Item -Recurse -Force deployment
    }
    New-Item -ItemType Directory -Name "deployment" | Out-Null
    Copy-Item -Recurse "dist\*" "deployment\"
    Copy-Item "package.json" "deployment\"
    Copy-Item "ecosystem.config.js" "deployment\"
    
    # Create archive
    Write-Host "🗜️ Creating archive..." -ForegroundColor Yellow
    if (Test-Path "hyperliquid-deployment.zip") {
        Remove-Item "hyperliquid-deployment.zip"
    }
    Compress-Archive -Path "deployment\*" -DestinationPath "hyperliquid-deployment.zip"
    
    # Upload to server
    Write-Host "⬆️ Uploading to server..." -ForegroundColor Yellow
    & scp "hyperliquid-deployment.zip" "${ServerUser}@${ServerIP}:/tmp/"
    
    # Deploy on server
    Write-Host "🔄 Deploying on server..." -ForegroundColor Yellow
    
    $sshCommands = @"
set -e

echo "Stopping current application..."
pm2 stop $AppName || true
pm2 delete $AppName || true

echo "Cleaning up old files..."
rm -rf /var/www/hyperliquid
rm -rf /tmp/hyperliquid-*
rm -rf /tmp/extracted

echo "Creating directories..."
mkdir -p /var/www/hyperliquid
mkdir -p /var/log/hyperliquid

echo "Extracting deployment..."
cd /tmp
unzip -o hyperliquid-deployment.zip -d extracted/

echo "Copying files..."
cp -r extracted/* /var/www/hyperliquid/

echo "Setting permissions..."
chown -R www-data:www-data /var/www/hyperliquid
chmod -R 755 /var/www/hyperliquid

echo "Installing dependencies..."
cd /var/www/hyperliquid

# Handle ecosystem config
if [ -f "ecosystem.config.js" ]; then
    mv ecosystem.config.js ecosystem.config.cjs
fi

npm install --production

echo "Starting application..."
pm2 start ecosystem.config.cjs
pm2 save

echo "Cleaning up..."
rm -rf /tmp/extracted
rm -f /tmp/hyperliquid-deployment.zip

echo "✅ Deployment completed successfully!"
pm2 list
"@
    
    & ssh "${ServerUser}@${ServerIP}" $sshCommands
    
    Write-Host "🎉 Deployment finished! Your app is live at http://$ServerIP" -ForegroundColor Green
    
}
catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
