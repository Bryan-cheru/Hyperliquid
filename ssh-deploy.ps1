# SSH Deployment PowerShell Script
param(
    [Parameter(Mandatory=$false)]
    [string]$ServerPassword
)

$serverIP = "155.138.229.220"
$username = "root"

Write-Host "🚀 HYPERLIQUID SSH DEPLOYMENT" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Server: $serverIP" -ForegroundColor White
Write-Host "User: $username" -ForegroundColor White
Write-Host ""

# Check if files exist
if (-not (Test-Path "hyperliquid-deployment.zip")) {
    Write-Host "❌ hyperliquid-deployment.zip not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "clean-deploy.sh")) {
    Write-Host "❌ clean-deploy.sh not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment files ready" -ForegroundColor Green
Write-Host ""

Write-Host "📋 DEPLOYMENT STEPS:" -ForegroundColor Yellow
Write-Host ""

Write-Host "STEP 1: Upload files to server" -ForegroundColor Cyan
if (Get-Command scp -ErrorAction SilentlyContinue) {
    Write-Host "🔄 Uploading deployment package..." -ForegroundColor Yellow
    scp hyperliquid-deployment.zip "$username@$serverIP`:/tmp/"
    
    Write-Host "🔄 Uploading deployment script..." -ForegroundColor Yellow
    scp clean-deploy.sh "$username@$serverIP`:/tmp/"
    
    Write-Host "✅ Files uploaded successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️ SCP not available. Manual upload required:" -ForegroundColor Yellow
    Write-Host "   scp hyperliquid-deployment.zip root@155.138.229.220:/tmp/" -ForegroundColor White
    Write-Host "   scp clean-deploy.sh root@155.138.229.220:/tmp/" -ForegroundColor White
}

Write-Host ""
Write-Host "STEP 2: SSH Commands to run on server" -ForegroundColor Cyan
Write-Host "📝 Copy and paste these commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "# Connect to server:" -ForegroundColor Gray
Write-Host "ssh root@155.138.229.220" -ForegroundColor White
Write-Host ""
Write-Host "# On the server, run:" -ForegroundColor Gray
Write-Host "cd /tmp" -ForegroundColor White
Write-Host "chmod +x clean-deploy.sh" -ForegroundColor White
Write-Host "bash clean-deploy.sh" -ForegroundColor White
Write-Host ""

Write-Host "🎯 EXPECTED RESULT:" -ForegroundColor Magenta
Write-Host "✅ Old build completely removed" -ForegroundColor Green
Write-Host "✅ Fresh installation with all new features" -ForegroundColor Green
Write-Host "✅ Ultra-safe configuration (0.5% position, 0.8% stop)" -ForegroundColor Green
Write-Host "✅ Order Split + Limit Chaser + Basket Orders" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access: http://155.138.229.220" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ready to proceed? Press Enter to continue or Ctrl+C to cancel..."
Read-Host
