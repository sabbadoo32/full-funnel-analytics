/**
 * API Debug Endpoint Test
 * 
 * This script tests the debug endpoint of the Full Funnel Analytics API
 * to verify environment variables in the deployed environment.
 */

const axios = require('axios');
require('dotenv').config();

// API endpoint for debug
const API_URL = 'https://fullfunnelmu.netlify.app/api/debug';

// Add a test with the FULLFUNNEL_API_KEY as well
async function testWithFullFunnelKey() {
  try {
    console.log('\nSending request to debug endpoint with FULLFUNNEL_API_KEY...');
    const response = await axios.post(API_URL, {}, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': fullFunnelApiKey
      }
    });
    
    console.log(`✅ Success! Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error testing debug endpoint with FULLFUNNEL_API_KEY:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error details:', error.message);
    }
  }
}

// Get API keys from environment
const openaiApiKey = process.env.OPENAI_API_KEY;
const fullFunnelApiKey = process.env.FULLFUNNEL_API_KEY;

// Check if we have at least one API key
if (!openaiApiKey && !fullFunnelApiKey) {
  console.error('Error: Neither OPENAI_API_KEY nor FULLFUNNEL_API_KEY environment variable is set.');
  console.error('Please set one of them in your .env file or export it in your terminal.');
  process.exit(1);
}

console.log('🔍 Testing API Debug Endpoint\n');
console.log(`API Endpoint: ${API_URL}`);
console.log(`OPENAI_API_KEY: ${openaiApiKey ? '✓ Set' : '✗ Not set'}`);
console.log(`FULLFUNNEL_API_KEY: ${fullFunnelApiKey ? '✓ Set' : '✗ Not set'}\n`);

// Run the test
async function runTest() {
  try {
    console.log('Sending request to debug endpoint with OPENAI_API_KEY...');
    const response = await axios.post(API_URL, {}, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': openaiApiKey
      }
    });
    
    console.log(`✅ Success! Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check if FULLFUNNEL_API_KEY is set in the deployed environment
    if (response.data.fullFunnelApiKeyExists) {
      console.log('\n✅ FULLFUNNEL_API_KEY is set in the deployed environment');
    } else {
      console.log('\n❌ FULLFUNNEL_API_KEY is NOT set in the deployed environment');
      console.log('This is likely why the FULLFUNNEL_API_KEY authentication is failing');
    }
    
    // Also test with FULLFUNNEL_API_KEY if available
    if (fullFunnelApiKey) {
      await testWithFullFunnelKey();
    }
    
  } catch (error) {
    console.error('❌ Error testing debug endpoint:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error details:', error.message);
    }
  }
}

// Run the test
runTest();
