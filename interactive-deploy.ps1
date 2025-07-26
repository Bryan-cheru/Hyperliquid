# Interactive Deployment Script for Hyperliquid
# This script prompts for server credentials and deploys securely

Write-Host "=== Hyperliquid Interactive Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Get server details interactively
$serverHost = Read-Host "Enter server IP address (default: 155.138.229.220)"
if ([string]::IsNullOrWhiteSpace($serverHost)) {
    $serverHost = "155.138.229.220"
}

$serverUser = Read-Host "Enter server username (default: root)"
if ([string]::IsNullOrWhiteSpace($serverUser)) {
    $serverUser = "root"
}

$serverPassword = Read-Host "Enter server password" -AsSecureString
$serverPasswordText = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($serverPassword))

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
$zipPath = "hyperliquid-interactive-deployment.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory("deployment", $zipPath)

Write-Host "Deployment package created: $zipPath" -ForegroundColor Green

Write-Host ""
Write-Host "Uploading to server..." -ForegroundColor Yellow

# Upload using SCP (requires OpenSSH or PuTTY's pscp)
$scpCommand = "scp -o StrictHostKeyChecking=no $zipPath ${serverUser}@${serverHost}:/tmp/"
Write-Host "Running: $scpCommand" -ForegroundColor Gray

# Note: This will prompt for password
& scp -o StrictHostKeyChecking=no $zipPath "${serverUser}@${serverHost}:/tmp/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Upload failed! Make sure you have OpenSSH or SCP available." -ForegroundColor Red
    Write-Host "Alternative: You can manually upload $zipPath to your server's /tmp/ directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "Executing deployment commands on server..." -ForegroundColor Yellow

# Create deployment script for server
$deployScript = @"
#!/bin/bash
echo "Starting deployment..."

# Stop current application
pm2 stop hyperliquid-app || true
pm2 delete hyperliquid-app || true

# Clean up old files
rm -rf /var/www/hyperliquid
rm -rf /tmp/hyperliquid-*
rm -rf /tmp/extracted

# Create directories
mkdir -p /var/www/hyperliquid
mkdir -p /var/log/hyperliquid

# Extract deployment
cd /tmp
unzip -o hyperliquid-interactive-deployment.zip -d extracted/

# Copy files to web directory
cp -r extracted/* /var/www/hyperliquid/

# Set permissions
chown -R www-data:www-data /var/www/hyperliquid
chmod -R 755 /var/www/hyperliquid

# Install dependencies and start
cd /var/www/hyperliquid
npm install --production
pm2 start ecosystem.config.cjs
pm2 save

# Cleanup
rm -rf /tmp/extracted
rm -f /tmp/hyperliquid-interactive-deployment.zip

echo "Deployment completed successfully!"
echo "Application is running at: http://$serverHost"

# Check status
pm2 list
curl -I http://localhost:3000
"@

# Save deploy script temporarily
$deployScript | Out-File -FilePath "deploy-server.sh" -Encoding UTF8

# Upload and execute deploy script
Write-Host "Uploading deployment script..." -ForegroundColor Gray
& scp -o StrictHostKeyChecking=no "deploy-server.sh" "${serverUser}@${serverHost}:/tmp/"

Write-Host "Executing deployment on server..." -ForegroundColor Gray
& ssh -o StrictHostKeyChecking=no "${serverUser}@${serverHost}" "chmod +x /tmp/deploy-server.sh && /tmp/deploy-server.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== DEPLOYMENT SUCCESSFUL ===" -ForegroundColor Green
    Write-Host "Your application is now live at: http://$serverHost" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "=== DEPLOYMENT FAILED ===" -ForegroundColor Red
    Write-Host "Please check the server logs for more details." -ForegroundColor Red
}

# Clean up temporary files
Remove-Item "deploy-server.sh" -ErrorAction SilentlyContinue
Remove-Item $zipPath -ErrorAction SilentlyContinue
Remove-Item -Recurse "deployment" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Deployment process completed." -ForegroundColor Cyan
