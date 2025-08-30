#!/bin/bash
# Deployment script for Full Funnel Analytics API to Netlify

echo "🚀 Starting deployment to Netlify..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Navigate to the backend directory
cd backend-deploy

# Check if FULLFUNNEL_API_KEY is set in Netlify environment
echo "🔑 Checking API key configuration..."
NETLIFY_ENV=$(netlify env:list 2>/dev/null | grep FULLFUNNEL_API_KEY)

if [ -z "$NETLIFY_ENV" ]; then
    echo "⚠️  Warning: FULLFUNNEL_API_KEY not found in Netlify environment"
    echo "Please set it using: netlify env:set FULLFUNNEL_API_KEY your-api-key"
    
    # Check if it exists in local .env
    if [ -f "../.env" ] && grep -q "FULLFUNNEL_API_KEY" "../.env"; then
        echo "✅ Found FULLFUNNEL_API_KEY in local .env file"
        source "../.env"
        echo "Would you like to set this key in Netlify? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            netlify env:set FULLFUNNEL_API_KEY "$FULLFUNNEL_API_KEY"
            echo "✅ API key set in Netlify environment"
        fi
    fi
fi

# Deploy to Netlify
echo "📦 Deploying to Netlify..."
netlify deploy --prod

echo "🧪 Running API authentication test..."
cd ..
node test-api-auth.js

echo "✅ Deployment complete!"
echo "📝 Remember to update the CustomGPT action with the latest OpenAPI schema if needed."
