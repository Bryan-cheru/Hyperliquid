# Simple Automated Deployment Script
# No password parameter - will prompt securely

$serverIP = "155.138.229.220"
$username = "root"

Write-Host "🚀 AUTOMATED HYPERLIQUID DEPLOYMENT" -ForegroundColor Green
Write-Host "Server: $serverIP" -ForegroundColor Cyan

# Prompt for password securely
$securePassword = Read-Host "Enter server password" -AsSecureString
$Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))

# Check if deployment file exists
if (-not (Test-Path "hyperliquid-deployment.zip")) {
    Write-Host "❌ hyperliquid-deployment.zip not found!" -ForegroundColor Red
    Write-Host "Run 'npm run build' first, then create the package" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Deployment package ready" -ForegroundColor Green

# Check if PuTTY tools are available
if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
    Write-Host "❌ PuTTY not found!" -ForegroundColor Red
    Write-Host "Install PuTTY from: https://www.putty.org/" -ForegroundColor Yellow
    exit 1
}

try {
    Write-Host ""
    Write-Host "🧹 STEP 1: Cleaning old files..." -ForegroundColor Red
    
    # Stop processes and clean old files
    & plink -batch -pw $Password "$username@$serverIP" "pm2 stop all || true"
    & plink -batch -pw $Password "$username@$serverIP" "pm2 delete hyperliquid-app || true"
    & plink -batch -pw $Password "$username@$serverIP" "rm -rf /var/www/hyperliquid"
    & plink -batch -pw $Password "$username@$serverIP" "rm -rf /tmp/hyperliquid-*"
    & plink -batch -pw $Password "$username@$serverIP" "mkdir -p /var/www/hyperliquid"
    & plink -batch -pw $Password "$username@$serverIP" "mkdir -p /var/log/hyperliquid"
    
    Write-Host "✅ Server cleaned" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📤 STEP 2: Uploading new files..." -ForegroundColor Yellow
    
    # Upload deployment package
    & pscp -batch -pw $Password hyperliquid-deployment.zip "$username@$serverIP":/tmp/
    
    Write-Host "✅ Files uploaded" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🚀 STEP 3: Installing and starting..." -ForegroundColor Cyan
    
    # Extract and install
    & plink -batch -pw $Password "$username@$serverIP" "cd /tmp && unzip -o hyperliquid-deployment.zip"
    & plink -batch -pw $Password "$username@$serverIP" "cp -r /tmp/dist/* /var/www/hyperliquid/"
    & plink -batch -pw $Password "$username@$serverIP" "cp -r /tmp/deployment/* /var/www/hyperliquid/"
    & plink -batch -pw $Password "$username@$serverIP" "cp /tmp/package.json /var/www/hyperliquid/"
    & plink -batch -pw $Password "$username@$serverIP" "cp /tmp/ecosystem.config.js /var/www/hyperliquid/"
    & plink -batch -pw $Password "$username@$serverIP" "chown -R www-data:www-data /var/www/hyperliquid"
    & plink -batch -pw $Password "$username@$serverIP" "chmod -R 755 /var/www/hyperliquid"
    
    # Install dependencies and start
    & plink -batch -pw $Password "$username@$serverIP" "cd /var/www/hyperliquid && npm install --production"
    & plink -batch -pw $Password "$username@$serverIP" "cd /var/www/hyperliquid && pm2 start ecosystem.config.js"
    & plink -batch -pw $Password "$username@$serverIP" "pm2 save"
    & plink -batch -pw $Password "$username@$serverIP" "systemctl reload nginx"
    
    Write-Host ""
    Write-Host "🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "🌐 Access: http://$serverIP" -ForegroundColor Cyan
    Write-Host "💰 Ultra-safe configuration: 0.5% position, 0.8% stop loss" -ForegroundColor Magenta
    Write-Host "🚀 Features: Order Split + Limit Chaser + Basket Orders" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
