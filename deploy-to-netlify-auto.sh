#!/bin/bash
# Non-interactive deployment script for Full Funnel Analytics API to Netlify

echo "🚀 Starting automated deployment to Netlify..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Navigate to the backend directory
cd backend-deploy || exit 1

# Deploy to Netlify
echo "📦 Deploying to Netlify..."
netlify deploy --prod

# Return to root directory
cd ..

# Run API authentication test
echo "🧪 Running API authentication test..."
node test-api-auth.js

echo "✅ Deployment complete!"
echo "📝 Remember to update the CustomGPT action with the latest OpenAPI schema if needed."
