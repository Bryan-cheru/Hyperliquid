@echo off
echo 🚀 HYPERLIQUID SSH DEPLOYMENT COMMANDS
echo =====================================
echo.
echo STEP 1: SSH to server
echo ssh root@155.138.229.220
echo.
echo STEP 2: Clean old installation (run these on server)
echo pm2 stop all
echo pm2 delete hyperliquid-app
echo rm -rf /var/www/hyperliquid
echo rm -rf /tmp/hyperliquid-*
echo.
echo STEP 3: Upload files (run from local Windows)
echo scp hyperliquid-deployment.zip root@155.138.229.220:/tmp/
echo scp clean-deploy.sh root@155.138.229.220:/tmp/
echo.
echo STEP 4: Deploy on server
echo cd /tmp
echo chmod +x clean-deploy.sh
echo bash clean-deploy.sh
echo.
echo STEP 5: Verify
echo curl -I http://155.138.229.220
echo.
echo 🎯 Ready to execute these commands!
pause
