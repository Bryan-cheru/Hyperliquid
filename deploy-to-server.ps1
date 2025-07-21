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
        Write-Host "📤 Uploading files via PuTTY..." -ForegroundColor Yellow
        
        # Upload file
        & pscp -pw $Password hyperliquid-deployment.zip "$username@$serverIP":/tmp/
        
        # Execute deployment commands
        $deployCommands = @(
            "cd /tmp",
            "unzip -o hyperliquid-deployment.zip",
            "pm2 stop hyperliquid-app || true",
            "mkdir -p /var/www/hyperliquid",
            "cp -r dist/* /var/www/hyperliquid/",
            "cp -r deployment/* /var/www/hyperliquid/",
            "cp package.json /var/www/hyperliquid/",
            "chown -R www-data:www-data /var/www/hyperliquid",
            "chmod -R 755 /var/www/hyperliquid",
            "cd /var/www/hyperliquid",
            "npm install --production",
            "pm2 start ecosystem.config.js",
            "pm2 save",
            "systemctl reload nginx"
        )
        
        foreach ($command in $deployCommands) {
            Write-Host "▶️ Executing: $command" -ForegroundColor Cyan
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
