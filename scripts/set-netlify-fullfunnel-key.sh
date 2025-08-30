#!/bin/bash
# Script to set FULLFUNNEL_API_KEY in Netlify environment
# Generated on 2025-08-30T03:09:30.526Z

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Set the environment variable
echo "🔑 Setting FULLFUNNEL_API_KEY in Netlify environment..."
netlify env:set FULLFUNNEL_API_KEY "full-funnel-api-key-default"

echo "✅ Done! FULLFUNNEL_API_KEY has been set in Netlify environment"
echo "📝 Remember to redeploy your application for the changes to take effect"
