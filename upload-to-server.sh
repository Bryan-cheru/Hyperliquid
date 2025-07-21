#!/bin/bash

# Upload script for Hyperliquid deployment
# Run this on your local machine to upload files to server

SERVER="155.138.229.220"
USERNAME="root"
DEPLOYMENT_FILE="hyperliquid-deployment.zip"
SCRIPT_FILE="server-deploy.sh"

echo "📤 Hyperliquid Upload Script"
echo "============================="

# Check if files exist
if [ ! -f "$DEPLOYMENT_FILE" ]; then
    echo "❌ $DEPLOYMENT_FILE not found!"
    echo "Please run 'npm run build' first"
    exit 1
fi

if [ ! -f "$SCRIPT_FILE" ]; then
    echo "❌ $SCRIPT_FILE not found!"
    exit 1
fi

echo "🔍 Files ready for upload:"
echo "  ✅ $DEPLOYMENT_FILE ($(du -h $DEPLOYMENT_FILE | cut -f1))"
echo "  ✅ $SCRIPT_FILE"
echo ""

# Upload files
echo "📤 Uploading deployment package..."
scp -o PreferredAuthentications=password -o PubkeyAuthentication=no "$DEPLOYMENT_FILE" "$USERNAME@$SERVER:/tmp/" || {
    echo "❌ Failed to upload deployment package"
    exit 1
}

echo "📤 Uploading deployment script..."
scp -o PreferredAuthentications=password -o PubkeyAuthentication=no "$SCRIPT_FILE" "$USERNAME@$SERVER:/tmp/" || {
    echo "❌ Failed to upload deployment script"
    exit 1
}

echo "✅ Files uploaded successfully!"
echo ""
echo "🚀 Now run the deployment on the server:"
echo "  ssh $USERNAME@$SERVER"
echo "  chmod +x /tmp/server-deploy.sh"
echo "  /tmp/server-deploy.sh"
echo ""
echo "Or run it directly:"
echo "  ssh $USERNAME@$SERVER 'chmod +x /tmp/server-deploy.sh && /tmp/server-deploy.sh'"
