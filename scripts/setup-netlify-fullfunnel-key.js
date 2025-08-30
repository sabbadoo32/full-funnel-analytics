/**
 * Setup FULLFUNNEL_API_KEY in Netlify Environment
 * 
 * This script generates the Netlify CLI command to set the FULLFUNNEL_API_KEY
 * environment variable in the Netlify deployment environment.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Check if FULLFUNNEL_API_KEY exists in local environment
const fullFunnelApiKey = process.env.FULLFUNNEL_API_KEY;

if (!fullFunnelApiKey) {
  console.error('❌ Error: FULLFUNNEL_API_KEY is not set in your local environment');
  console.error('Please set it in your .env file before running this script');
  process.exit(1);
}

console.log('✅ Found FULLFUNNEL_API_KEY in local environment');

// Generate Netlify CLI command
const netlifyCommand = `netlify env:set FULLFUNNEL_API_KEY "${fullFunnelApiKey}"`;

console.log('\nRun this command to set FULLFUNNEL_API_KEY in Netlify:');
console.log('----------------------------------------------');
console.log(netlifyCommand);
console.log('----------------------------------------------');

// Create a shell script for easy execution
const scriptPath = path.join(__dirname, 'set-netlify-fullfunnel-key.sh');
const scriptContent = `#!/bin/bash
# Script to set FULLFUNNEL_API_KEY in Netlify environment
# Generated on ${new Date().toISOString()}

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Set the environment variable
echo "🔑 Setting FULLFUNNEL_API_KEY in Netlify environment..."
${netlifyCommand}

echo "✅ Done! FULLFUNNEL_API_KEY has been set in Netlify environment"
echo "📝 Remember to redeploy your application for the changes to take effect"
`;

fs.writeFileSync(scriptPath, scriptContent);
fs.chmodSync(scriptPath, '755'); // Make executable

console.log(`\nA shell script has been created at: ${scriptPath}`);
console.log('You can run this script to set the environment variable in Netlify');
console.log('\nAlternatively, you can set it manually in the Netlify UI:');
console.log('1. Go to Site settings > Build & deploy > Environment');
console.log('2. Add FULLFUNNEL_API_KEY with the value from your .env file');
