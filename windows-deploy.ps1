# Windows SSH Deployment Script - No PuTTY required
$serverIP = "155.138.229.220"
$username = "root"

Write-Host "Automated Hyperliquid Deployment (Windows SSH)" -ForegroundColor Green
Write-Host "Server: $serverIP" -ForegroundColor Cyan

# Check if deployment file exists
if (-not (Test-Path "hyperliquid-deployment.zip")) {
    Write-Host "Error: hyperliquid-deployment.zip not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Deployment package ready" -ForegroundColor Green

# Use scp and ssh (built into Windows 10/11)
try {
    Write-Host "Step 1: Uploading deployment package..." -ForegroundColor Yellow
    & scp hyperliquid-deployment.zip "$username@$serverIP":/tmp/
    
    Write-Host "Step 2: Executing deployment on server..." -ForegroundColor Yellow
    $deployScript = @"
pm2 stop all || true
pm2 delete hyperliquid-app || true
rm -rf /var/www/hyperliquid
mkdir -p /var/www/hyperliquid
cd /tmp
unzip -o hyperliquid-deployment.zip
cp -r dist/* /var/www/hyperliquid/
cp -r deployment/* /var/www/hyperliquid/
cp package.json /var/www/hyperliquid/
cp ecosystem.config.js /var/www/hyperliquid/
cd /var/www/hyperliquid
npm install --production
pm2 start ecosystem.config.js
pm2 save
systemctl reload nginx
echo "Deployment completed successfully!"
"@
    
    # Execute the deployment script on server
    $deployScript | & ssh "$username@$serverIP" 'bash -s'
    
    Write-Host ""
    Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "Access: http://$serverIP" -ForegroundColor Cyan
    Write-Host "Features: Order Split + Limit Chaser + Ultra-safe config" -ForegroundColor Yellow
    
} catch {
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure you can SSH to the server: ssh $username@$serverIP" -ForegroundColor Yellow
}
