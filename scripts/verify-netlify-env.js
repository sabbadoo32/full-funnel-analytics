/**
 * Netlify Environment Variable Verification Script
 * 
 * This script verifies that the required environment variables are set in Netlify
 * and provides guidance on how to set them if they are missing.
 */

const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Required environment variables
const requiredVars = [
  'OPENAI_API_KEY',
  'MONGO_URI'
];

console.log(`${colors.cyan}=== Netlify Environment Variable Verification ===${colors.reset}\n`);

// Check if Netlify CLI is installed
try {
  execSync('netlify --version', { stdio: 'ignore' });
  console.log(`${colors.green}✓ Netlify CLI is installed${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}✗ Netlify CLI is not installed${colors.reset}`);
  console.log(`${colors.yellow}Please install it with: npm install -g netlify-cli${colors.reset}`);
  process.exit(1);
}

// Check if user is logged in to Netlify
try {
  const netlifyStatus = execSync('netlify status', { encoding: 'utf8' });
  if (netlifyStatus.includes('Not logged in')) {
    console.log(`${colors.red}✗ Not logged in to Netlify${colors.reset}`);
    console.log(`${colors.yellow}Please log in with: netlify login${colors.reset}`);
    process.exit(1);
  }
  console.log(`${colors.green}✓ Logged in to Netlify${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}✗ Error checking Netlify login status${colors.reset}`);
  console.log(`${colors.yellow}Please log in with: netlify login${colors.reset}`);
  process.exit(1);
}

// Get Netlify site ID
let siteId;
try {
  const netlifyStatus = execSync('netlify status', { encoding: 'utf8' });
  const siteIdMatch = netlifyStatus.match(/Site ID:\s+([a-zA-Z0-9-]+)/);
  if (siteIdMatch && siteIdMatch[1]) {
    siteId = siteIdMatch[1];
    console.log(`${colors.green}✓ Found Netlify site ID: ${siteId}${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Could not find Netlify site ID${colors.reset}`);
    console.log(`${colors.yellow}Please link your site with: netlify link${colors.reset}`);
    process.exit(1);
  }
} catch (error) {
  console.log(`${colors.red}✗ Error getting Netlify site ID${colors.reset}`);
  console.log(`${colors.yellow}Please link your site with: netlify link${colors.reset}`);
  process.exit(1);
}

// Get Netlify environment variables
let netlifyEnv;
try {
  netlifyEnv = JSON.parse(execSync(`netlify env:list --json`, { encoding: 'utf8' }));
  console.log(`${colors.green}✓ Retrieved Netlify environment variables${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}✗ Error retrieving Netlify environment variables${colors.reset}`);
  console.log(`${colors.yellow}Error: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Check if required environment variables are set in Netlify
console.log(`\n${colors.cyan}Checking required environment variables:${colors.reset}`);

const missingVars = [];
const localVars = {};

// Check local environment variables first
requiredVars.forEach(varName => {
  if (process.env[varName]) {
    localVars[varName] = process.env[varName];
    console.log(`${colors.green}✓ ${varName} is set locally${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ ${varName} is not set locally${colors.reset}`);
  }
});

// Check Netlify environment variables
requiredVars.forEach(varName => {
  const envVar = netlifyEnv.find(v => v.key === varName);
  if (envVar) {
    console.log(`${colors.green}✓ ${varName} is set in Netlify${colors.reset}`);
    
    // Check if local and Netlify values match
    if (localVars[varName]) {
      // We can't compare exact values since Netlify masks them, but we can check if they exist
      console.log(`${colors.green}  Both local and Netlify environments have ${varName}${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ ${varName} is not set in Netlify${colors.reset}`);
    missingVars.push(varName);
  }
});

// Set missing environment variables in Netlify
if (missingVars.length > 0) {
  console.log(`\n${colors.yellow}Setting missing environment variables in Netlify:${colors.reset}`);
  
  missingVars.forEach(varName => {
    if (localVars[varName]) {
      try {
        console.log(`${colors.cyan}Setting ${varName} in Netlify...${colors.reset}`);
        execSync(`netlify env:set ${varName} "${localVars[varName]}"`, { stdio: 'inherit' });
        console.log(`${colors.green}✓ Successfully set ${varName} in Netlify${colors.reset}`);
      } catch (error) {
        console.log(`${colors.red}✗ Error setting ${varName} in Netlify${colors.reset}`);
        console.log(`${colors.yellow}Error: ${error.message}${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}✗ Cannot set ${varName} in Netlify because it's not set locally${colors.reset}`);
    }
  });
  
  console.log(`\n${colors.yellow}Important: You need to redeploy your site for the environment variable changes to take effect.${colors.reset}`);
  console.log(`${colors.yellow}Run: netlify deploy --prod${colors.reset}`);
} else {
  console.log(`\n${colors.green}All required environment variables are set in Netlify!${colors.reset}`);
}

// Check CORS configuration
console.log(`\n${colors.cyan}Checking CORS configuration:${colors.reset}`);

try {
  const corsPath = './backend-deploy/functions/cors.js';
  const corsContent = fs.readFileSync(corsPath, 'utf8');
  
  if (corsContent.includes('Authorization')) {
    console.log(`${colors.green}✓ CORS configuration includes Authorization header${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ CORS configuration does not include Authorization header${colors.reset}`);
    console.log(`${colors.yellow}Please update ${corsPath} to include 'Authorization' in Access-Control-Allow-Headers${colors.reset}`);
  }
} catch (error) {
  console.log(`${colors.red}✗ Error checking CORS configuration${colors.reset}`);
  console.log(`${colors.yellow}Error: ${error.message}${colors.reset}`);
}

console.log(`\n${colors.cyan}=== Verification Complete ===${colors.reset}`);
