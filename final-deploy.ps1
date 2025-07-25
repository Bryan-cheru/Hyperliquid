# Secure Deployment Script - Prompts for password
$serverIP = "155.138.229.220"
$username = "root"

Write-Host "Automated Hyperliquid Deployment" -ForegroundColor Green
Write-Host "Server: $serverIP" -ForegroundColor Cyan

# Prompt for password securely (hidden input)
$securePassword = Read-Host "Enter server password" -AsSecureString
$Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))

# Check if deployment file exists
if (-not (Test-Path "hyperliquid-deployment.zip")) {
    Write-Host "Error: hyperliquid-deployment.zip not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Deployment package ready" -ForegroundColor Green

# Check if PuTTY is available
if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
    Write-Host "Error: PuTTY not found! Install from https://www.putty.org/" -ForegroundColor Red
    exit 1
}

try {
    Write-Host "Step 1: Cleaning server..." -ForegroundColor Yellow
    & plink -batch -pw $Password "$username@$serverIP" "pm2 stop all || true"
    & plink -batch -pw $Password "$username@$serverIP" "pm2 delete hyperliquid-app || true"
    & plink -batch -pw $Password "$username@$serverIP" "rm -rf /var/www/hyperliquid"
    & plink -batch -pw $Password "$username@$serverIP" "mkdir -p /var/www/hyperliquid"
    
    Write-Host "Step 2: Uploading files..." -ForegroundColor Yellow
    & pscp -batch -pw $Password hyperliquid-deployment.zip "$username@$serverIP":/tmp/
    
    Write-Host "Step 3: Installing..." -ForegroundColor Yellow
    & plink -batch -pw $Password "$username@$serverIP" "cd /tmp && unzip -o hyperliquid-deployment.zip"
    & plink -batch -pw $Password "$username@$serverIP" "cp -r /tmp/dist/* /var/www/hyperliquid/"
    & plink -batch -pw $Password "$username@$serverIP" "cp -r /tmp/deployment/* /var/www/hyperliquid/"
    & plink -batch -pw $Password "$username@$serverIP" "cp /tmp/package.json /var/www/hyperliquid/"
    & plink -batch -pw $Password "$username@$serverIP" "cp /tmp/ecosystem.config.js /var/www/hyperliquid/"
    & plink -batch -pw $Password "$username@$serverIP" "cd /var/www/hyperliquid && npm install --production"
    & plink -batch -pw $Password "$username@$serverIP" "pm2 start ecosystem.config.js"
    & plink -batch -pw $Password "$username@$serverIP" "systemctl reload nginx"
    
    Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "Access: http://$serverIP" -ForegroundColor Cyan
    
} catch {
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
}
