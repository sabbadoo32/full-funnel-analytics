// Script to generate Netlify environment variables
const fs = require('fs');
const path = require('path');

// Read the .env.production file
const envPath = path.join(__dirname, '..', '.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');

// Extract environment variables
const envVars = envContent
  .split('\n')
  .filter(line => line && !line.startsWith('#'))
  .map(line => line.split('=')[0])
  .filter(Boolean);

// Generate Netlify CLI command
const netlifyCommand = `# Set Netlify environment variables\n` +
  envVars.map(varName => `netlify env:set ${varName} "\${${varName}}"`).join('\n');

console.log('Run these commands in your Netlify site directory:');
console.log('----------------------------------------------');
console.log(netlifyCommand);
console.log('----------------------------------------------');
console.log('\nOr set them manually in the Netlify UI:');
console.log('1. Go to Site settings > Build & deploy > Environment');
console.log('2. Add each variable from the list above');
