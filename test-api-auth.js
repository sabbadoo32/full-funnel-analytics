/**
 * Enhanced API Authentication Test Script
 * 
 * This script tests the Full Funnel Analytics API authentication by making
 * requests with different API key scenarios to verify proper behavior.
 */

const axios = require('axios');
require('dotenv').config();

/**
 * Enhanced error handler for API requests
 * Specifically detects and handles ClientResponseError and network-related errors
 */
function handleApiError(error, testName) {
  // Check for ClientResponseError or network-related errors
  if (error.name === 'ClientResponseError' || 
      error.message?.includes('network') || 
      error.message?.includes('timeout') || 
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('ETIMEDOUT')) {
    
    console.log(`❌ ${testName}: Network or ClientResponseError detected`);
    console.log('Error details:', {
      name: error.name,
      message: error.message,
      type: error.constructor.name,
      status: error.response?.status || 'unknown',
      headers: error.response?.headers || 'none',
      code: error.code || 'none'
    });
    console.log('This may be due to network issues or API rate limits.');
    return true; // Error was handled
  }
  return false; // Error was not handled by this function
}

// Choose which API endpoint to test against
const API_ENDPOINT = 'customgpt'; // Options: 'local', 'remote', 'direct', 'customgpt'

// API endpoints
const REMOTE_API_URL = 'https://fullfunnelmu.netlify.app/api/chat/query';
const LOCAL_API_URL = 'http://localhost:8888/.netlify/functions/api';
const DIRECT_API_URL = 'https://fullfunnelmu.netlify.app/.netlify/functions/api';
const CUSTOMGPT_API_URL = 'https://fullfunnelmu.netlify.app/api/chat/query';

// Set the API URL based on the configuration
let API_URL;
switch(API_ENDPOINT) {
  case 'local':
    API_URL = LOCAL_API_URL;
    break;
  case 'remote':
    API_URL = REMOTE_API_URL;
    break;
  case 'direct':
    API_URL = DIRECT_API_URL;
    break;
  case 'customgpt':
    API_URL = CUSTOMGPT_API_URL;
    break;
  default:
    API_URL = CUSTOMGPT_API_URL;
}

console.log(`Testing against API endpoint: ${API_URL}`);


// Get API keys from environment
const openaiApiKey = process.env.OPENAI_API_KEY;
const legacyApiKey = process.env.API_KEY;

// Check if we have at least one API key
if (!openaiApiKey && !legacyApiKey) {
  console.error('Error: Neither OPENAI_API_KEY nor API_KEY environment variable is set.');
  console.error('Please set one of them in your .env file or export it in your terminal.');
  process.exit(1);
}

// Display available keys for debugging
console.log('Available API Keys:');
console.log(`OPENAI_API_KEY: ${openaiApiKey ? '✓ Set' : '✗ Not set'} (primary authentication method)`);
console.log(`API_KEY: ${legacyApiKey ? '✓ Set' : '✗ Not set'} (legacy authentication method)`);

// Test payload
const payload = {
  message: "API authentication test",
  filters: { city: "Chicago" }
};

// Test cases
async function runTests() {
  console.log('🔍 Running API Authentication Tests\n');
  
  // Test 1: Using OPENAI_API_KEY (primary authentication method)
  try {
    console.log('Test 1: Request with OPENAI_API_KEY');
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': openaiApiKey
      }
    });
    
    console.log(`✅ Success! Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
  } catch (error) {
    if (!handleApiError(error, 'Test 1')) {
      console.log(`❌ Failed! Status: ${error.response?.status || 'Unknown'}`);
      console.log('Error:', error.response?.data || error.message);
    }
  }
  
  console.log('\n-----------------------------------\n');
  
  // Test 2: Using legacy API_KEY (if available)
  if (legacyApiKey) {
    try {
      console.log('Test 2: Request with legacy API_KEY');
      const response = await axios.post(API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': legacyApiKey
        }
      });
      
      console.log(`✅ Success! Status: ${response.status}`);
      console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
    } catch (error) {
      if (!handleApiError(error, 'Test 2')) {
        console.log(`❌ Failed! Status: ${error.response?.status || 'Unknown'}`);
        console.log('Error:', error.response?.data || error.message);
      }
    }
    
    console.log('\n-----------------------------------\n');
  }
  
  // Test 3: Using default API key value
  try {
    console.log('Test 3: Request with default API key value');
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'full-funnel-api-key-default'
      }
    });
    
    console.log(`✅ Success! Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
  } catch (error) {
    if (!handleApiError(error, 'Test 3')) {
      console.log(`❌ Failed! Status: ${error.response?.status || 'Unknown'}`);
      console.log('Error:', error.response?.data || error.message);
    }
  }
  
  console.log('\n-----------------------------------\n');
  
  // Test 4: Invalid API Key
  try {
    console.log('Test 4: Request with invalid API key');
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'invalid-key-that-should-fail'
      }
    });
    
    console.log(`❓ Unexpected Success! Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✅ Expected failure! Status: ${error.response.status} (Unauthorized)`);
      console.log('Error:', error.response.data);
    } else if (!handleApiError(error, 'Test 4')) {
      console.log(`❌ Unexpected error! Status: ${error.response?.status || 'Unknown'}`);
      console.log('Error:', error.response?.data || error.message);
    }
  }
  
  console.log('\n-----------------------------------\n');
  
  // Test 5: No API Key
  try {
    console.log('Test 5: Request with no API key');
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❓ Unexpected Success! Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✅ Expected failure! Status: ${error.response.status} (Unauthorized)`);
      console.log('Error:', error.response.data);
    } else if (!handleApiError(error, 'Test 5')) {
      console.log(`❌ Unexpected error! Status: ${error.response?.status || 'Unknown'}`);
      console.log('Error:', error.response?.data || error.message);
    }
  }
  
  console.log('\n-----------------------------------\n');
  
  // Test 6: API Key with different case
  try {
    console.log('Test 6: Request with API key in different case (X-API-KEY)');
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': openaiApiKey
      }
    });
    
    console.log(`✅ Success! Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
  } catch (error) {
    if (!handleApiError(error, 'Test 6')) {
      console.log(`❌ Failed! Status: ${error.response?.status || 'Unknown'}`);
      console.log('Error:', error.response?.data || error.message);
    }
  }
  
  // Test 7: Using OPENAI_API_KEY with different request payload
  if (openaiApiKey) {
    console.log('\n-----------------------------------\n');
    try {
      console.log('Test 7: Request with OPENAI_API_KEY and different payload');
      const altPayload = { message: "Alternative API test", filters: { city: "New York" } };
      const response = await axios.post(API_URL, altPayload, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': openaiApiKey
        }
      });
      
      console.log(`✅ Success! Status: ${response.status}`);
      console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
    } catch (error) {
      if (!handleApiError(error, 'Test 7')) {
        console.log(`❌ Failed! Status: ${error.response?.status || 'Unknown'}`);
        console.log('Error:', error.response?.data || error.message);
      }
    }
  }
  
  // Test 8: Using hardcoded API key from CustomGPT setup
  console.log('\n-----------------------------------\n');
  try {
    const hardcodedKey = 'full-funnel-api-key-default';
    console.log(`Test 8: Request with hardcoded key: ${hardcodedKey}`);
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': hardcodedKey
      }
    });
    
    console.log(`✅ Success! Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
  } catch (error) {
    if (!handleApiError(error, 'Test 8')) {
      console.log(`❌ Failed! Status: ${error.response?.status || 'Unknown'}`);
      console.log('Error:', error.response?.data || error.message);
    }
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  if (handleApiError(error, 'Global error handler')) {
    console.error('This appears to be a network or ClientResponseError issue. Please check your network connection and API endpoint.');
  }
});
