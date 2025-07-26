# Quick Fix Deployment Script
# This script uses direct SSH commands to avoid line ending issues

Write-Host "=== Hyperliquid Quick Fix Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Get server details
$serverHost = Read-Host "Enter server IP address (default: 155.138.229.220)"
if ([string]::IsNullOrWhiteSpace($serverHost)) {
    $serverHost = "155.138.229.220"
}

$serverUser = Read-Host "Enter server username (default: root)"
if ([string]::IsNullOrWhiteSpace($serverUser)) {
    $serverUser = "root"
}

Write-Host ""
Write-Host "Building application..." -ForegroundColor Yellow

# Build the application
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Creating deployment package..." -ForegroundColor Yellow

# Create deployment package
if (Test-Path "deployment") {
    Remove-Item -Recurse -Force "deployment"
}
mkdir "deployment"

# Copy files to deployment folder
Copy-Item -Recurse "dist\*" "deployment\"
Copy-Item "package.json" "deployment\"
Copy-Item "ecosystem.config.cjs" "deployment\"

# Create zip file
$zipPath = "hyperliquid-quick-fix.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory("deployment", $zipPath)

Write-Host "Deployment package created: $zipPath" -ForegroundColor Green

Write-Host ""
Write-Host "Uploading to server..." -ForegroundColor Yellow

# Upload using SCP
& scp -o StrictHostKeyChecking=no $zipPath "${serverUser}@${serverHost}:/tmp/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Upload failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Deploying via direct SSH commands..." -ForegroundColor Yellow

# Execute deployment commands directly via SSH (one command at a time)
Write-Host "Step 1: Stopping current application..." -ForegroundColor Gray
& ssh -o StrictHostKeyChecking=no "${serverUser}@${serverHost}" "pm2 stop hyperliquid-app || true; pm2 delete hyperliquid-app || true"

Write-Host "Step 2: Cleaning up old files..." -ForegroundColor Gray
& ssh -o StrictHostKeyChecking=no "${serverUser}@${serverHost}" "rm -rf /var/www/hyperliquid; rm -rf /tmp/hyperliquid-*; rm -rf /tmp/extracted"

Write-Host "Step 3: Creating directories..." -ForegroundColor Gray
& ssh -o StrictHostKeyChecking=no "${serverUser}@${serverHost}" "mkdir -p /var/www/hyperliquid; mkdir -p /var/log/hyperliquid"

Write-Host "Step 4: Extracting deployment..." -ForegroundColor Gray
& ssh -o StrictHostKeyChecking=no "${serverUser}@${serverHost}" "cd /tmp && unzip -o hyperliquid-quick-fix.zip -d extracted/"

Write-Host "Step 5: Copying files..." -ForegroundColor Gray
& ssh -o StrictHostKeyChecking=no "${serverUser}@${serverHost}" "cp -r /tmp/extracted/* /var/www/hyperliquid/"

Write-Host "Step 6: Setting permissions..." -ForegroundColor Gray
& ssh -o StrictHostKeyChecking=no "${serverUser}@${serverHost}" "chown -R www-data:www-data /var/www/hyperliquid; chmod -R 755 /var/www/hyperliquid"

Write-Host "Step 7: Installing dependencies..." -ForegroundColor Gray
& ssh -o StrictHostKeyChecking=no "${serverUser}@${serverHost}" "cd /var/www/hyperliquid && npm install --production"

Write-Host "Step 8: Starting application..." -ForegroundColor Gray
& ssh -o StrictHostKeyChecking=no "${serverUser}@${serverHost}" "cd /var/www/hyperliquid && pm2 start ecosystem.config.cjs && pm2 save"

Write-Host "Step 9: Checking status..." -ForegroundColor Gray
& ssh -o StrictHostKeyChecking=no "${serverUser}@${serverHost}" "pm2 list"

Write-Host "Step 10: Testing application..." -ForegroundColor Gray
& ssh -o StrictHostKeyChecking=no "${serverUser}@${serverHost}" "curl -I http://localhost:3000"

Write-Host "Step 11: Cleanup..." -ForegroundColor Gray
& ssh -o StrictHostKeyChecking=no "${serverUser}@${serverHost}" "rm -rf /tmp/extracted; rm -f /tmp/hyperliquid-quick-fix.zip"

Write-Host ""
Write-Host "=== DEPLOYMENT COMPLETED ===" -ForegroundColor Green
Write-Host "Your application should now be live at: http://$serverHost" -ForegroundColor Green
Write-Host ""

# Clean up local files
Remove-Item $zipPath -ErrorAction SilentlyContinue
Remove-Item -Recurse "deployment" -ErrorAction SilentlyContinue

Write-Host "Quick fix deployment process completed." -ForegroundColor Cyan
