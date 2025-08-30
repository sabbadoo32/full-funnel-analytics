#!/bin/bash
# Script to set OPENAI_API_KEY in Netlify environment
# Generated on $(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Check if OPENAI_API_KEY is set in local environment
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY not found in local environment"
    echo "Please set it first: export OPENAI_API_KEY=your_api_key"
    exit 1
fi

# Set the environment variable
echo "🔑 Setting OPENAI_API_KEY in Netlify environment..."
netlify env:set OPENAI_API_KEY "$OPENAI_API_KEY"

echo "✅ Done! OPENAI_API_KEY has been set in Netlify environment"
echo "📝 Remember to redeploy your application for the changes to take effect"
