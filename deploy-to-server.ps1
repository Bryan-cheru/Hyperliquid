# Hyperliquid Deployment Script
# Run this script to deploy to your server

param(
    [Parameter(Mandatory=$true)]
    [string]$Password
)

$serverIP = "155.138.229.220"
$username = "root"

Write-Host "🚀 Starting Hyperliquid deployment to $serverIP..." -ForegroundColor Green

# Create secure credentials
$securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($username, $securePassword)

try {
    # Method 1: Try with plink (PuTTY) if available
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        Write-Host "🧹 STEP 1: Cleaning server first..." -ForegroundColor Red
        
        # First clean everything
        $cleanupCommands = @(
            "pm2 stop all || true",
            "pm2 delete hyperliquid-app || true", 
            "rm -rf /var/www/hyperliquid",
            "rm -rf /tmp/hyperliquid-*",
            "rm -rf /tmp/dist",
            "rm -rf /tmp/deployment",
            "mkdir -p /var/www/hyperliquid",
            "mkdir -p /var/log/hyperliquid"
        )
        
        foreach ($command in $cleanupCommands) {
            Write-Host "▶️ Cleanup: $command" -ForegroundColor Red
            & plink -pw $Password "$username@$serverIP" $command
        }
        
        Write-Host "📤 STEP 2: Uploading fresh build..." -ForegroundColor Yellow
        & pscp -pw $Password hyperliquid-deployment.zip "$username@$serverIP":/tmp/
        
        # Execute deployment commands with complete cleanup
        $deployCommands = @(
            "cd /tmp",
            "rm -rf hyperliquid-deployment.zip",
            "pm2 stop all || true",
            "pm2 delete hyperliquid-app || true",
            "rm -rf /var/www/hyperliquid",
            "rm -rf /tmp/hyperliquid-*",
            "rm -rf /tmp/dist",
            "rm -rf /tmp/deployment"
        )
        
        Write-Host "🧹 Cleaning server..." -ForegroundColor Red
        foreach ($command in $deployCommands) {
            Write-Host "▶️ Cleanup: $command" -ForegroundColor Red
            & plink -pw $Password "$username@$serverIP" $command
        }
        
        Write-Host "📤 Uploading fresh build..." -ForegroundColor Yellow
        & pscp -pw $Password hyperliquid-deployment.zip "$username@$serverIP":/tmp/
        
        $installCommands = @(
            "cd /tmp",
            "unzip -o hyperliquid-deployment.zip",
            "mkdir -p /var/www/hyperliquid",
            "mkdir -p /var/log/hyperliquid",
            "cp -r dist/* /var/www/hyperliquid/",
            "cp -r deployment/* /var/www/hyperliquid/",
            "cp package.json /var/www/hyperliquid/",
            "cp ecosystem.config.js /var/www/hyperliquid/",
            "chown -R www-data:www-data /var/www/hyperliquid",
            "chmod -R 755 /var/www/hyperliquid",
            "cd /var/www/hyperliquid",
            "rm -rf node_modules",
            "npm cache clean --force",
            "npm install --production",
            "pm2 start ecosystem.config.js",
            "pm2 save",
            "systemctl reload nginx",
            "sleep 3",
            "curl -I http://localhost:3000 || echo 'Starting up...'"
        )
        
        Write-Host "🚀 Installing fresh build..." -ForegroundColor Green
        foreach ($command in $installCommands) {
            Write-Host "▶️ Installing: $command" -ForegroundColor Green
            & plink -pw $Password "$username@$serverIP" $command
        }
        
    } else {
        Write-Host "❌ PuTTY not found. Please install PuTTY or use manual deployment." -ForegroundColor Red
        Write-Host "Download PuTTY from: https://www.putty.org/" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Access your app at: http://$serverIP" -ForegroundColor Cyan
