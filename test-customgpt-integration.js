/**
 * CustomGPT API Integration Test
 * 
 * This script tests the integration between CustomGPT and the Full Funnel Analytics API
 * with enhanced error handling for ClientResponseError and network-related errors.
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
      code: error.code || 'none',
      url: error.config?.url || 'unknown',
      method: error.config?.method || 'unknown',
      requestHeaders: error.config?.headers || 'none',
      data: error.response?.data || 'none'
    });
    
    // Provide specific guidance based on status code
    if (error.response?.status === 401) {
      console.log('🔑 Authentication failed. Please check your API key.');
    } else if (error.response?.status === 403) {
      console.log('🔒 Authorization failed. Your API key may not have the required permissions.');
    } else if (error.response?.status === 404) {
      console.log('🔍 API endpoint not found. Please verify the URL path.');
    } else if (error.response?.status === 429) {
      console.log('⏱️ Rate limit exceeded. Please try again later.');
    } else if (error.response?.status >= 500) {
      console.log('🔧 Server error. The API may be experiencing issues.');
    } else {
      console.log('This may be due to network issues or API configuration.');
    }
    
    return true; // Error was handled
  }
  return false; // Error was not handled by this function
}

// API endpoint for CustomGPT integration
const API_URL = 'https://fullfunnelmu.netlify.app/.netlify/functions/api/chat/query';

// Get API key from environment
const openaiApiKey = process.env.OPENAI_API_KEY;

// Check if we have the OpenAI API key
if (!openaiApiKey) {
  console.error('Error: OPENAI_API_KEY environment variable is not set.');
  console.error('Please set it in your .env file or export it in your terminal.');
  process.exit(1);
}

// Verify API endpoint is accessible
async function checkApiEndpoint() {
  try {
    console.log(`🔍 Checking API endpoint: ${API_URL}`);
    const response = await axios.options(API_URL, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    console.log(`✅ API endpoint is accessible. Status: ${response.status}`);
    return true;
  } catch (error) {
    console.error(`❌ API endpoint check failed: ${error.message}`);
    console.error('Please verify the API endpoint URL and network connectivity.');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Headers:`, error.response.headers);
    }
    return false;
  }
}

console.log('🔍 Testing CustomGPT API Integration\n');
console.log(`API Endpoint: ${API_URL}`);
console.log(`OPENAI_API_KEY: ${openaiApiKey ? '✓ Set' : '✗ Not set'}\n`);

// Test payloads
const testQueries = [
  {
    name: "Basic Analytics Query",
    payload: {
      message: "Show me email performance metrics for July 2025",
      filters: { dateRange: { start: "2025-07-01", end: "2025-07-31" } }
    }
  },
  {
    name: "Persona Analysis Query",
    payload: {
      message: "Create customer personas based on campaign data",
      filters: {}
    }
  },
  {
    name: "Filtered Query",
    payload: {
      message: "Show conversion rates for Chicago events",
      filters: { city: "Chicago" }
    }
  }
];

// Run the tests
async function runTests() {
  // First check if the API endpoint is accessible
  const isEndpointAccessible = await checkApiEndpoint();
  if (!isEndpointAccessible) {
    console.error('❌ Cannot proceed with tests due to API endpoint issues.');
    return;
  }
  for (const test of testQueries) {
    console.log(`\n🧪 Test: ${test.name}`);
    console.log(`Query: "${test.payload.message}"`);
    
    try {
      // Test with OPENAI_API_KEY (primary key for CustomGPT integration)
      console.log('\n1️⃣ Testing with OPENAI_API_KEY:');
      const openaiResponse = await axios.post(API_URL, test.payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
          'x-api-key': openaiApiKey
        },
        timeout: 15000, // 15 second timeout
        validateStatus: function (status) {
          return status < 500; // Resolve only if status code is less than 500
        }
      });
      
      console.log(`✅ Success! Status: ${openaiResponse.status}`);
      console.log('Response preview:', JSON.stringify(openaiResponse.data, null, 2).substring(0, 200) + '...');
      
      // Check if response contains expected fields
      const hasExpectedFields = openaiResponse.data && 
                               (openaiResponse.data.message || openaiResponse.data.query);
      
      if (hasExpectedFields) {
        console.log('✅ Response contains expected fields');
      } else {
        console.log('⚠️ Response is missing expected fields');
      }
      
    } catch (error) {
      if (!handleApiError(error, 'OPENAI_API_KEY test')) {
        console.log(`❌ Failed! Status: ${error.response?.status || 'Unknown'}`);
        console.log('Error:', error.response?.data || error.message);
      }
    }
    
    // Test with different header combinations to diagnose issues
    try {
      console.log('\n2️⃣ Testing with Authorization header only:');
      const authResponse = await axios.post(API_URL, test.payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        timeout: 15000, // 15 second timeout
        validateStatus: function (status) {
          return status < 500; // Resolve only if status code is less than 500
        }
      });
      
      console.log(`✅ Success! Status: ${authResponse.status}`);
      console.log('Response preview:', JSON.stringify(authResponse.data, null, 2).substring(0, 200) + '...');
    } catch (error) {
      if (!handleApiError(error, 'Authorization header test')) {
        console.log(`❌ Failed! Status: ${error.response?.status || 'Unknown'}`);
        console.log('Error:', error.response?.data || error.message);
      }
    }
    
    console.log('\n-----------------------------------');
  }
}

// Run the tests and handle any unhandled errors
runTests().catch(error => {
  console.error('\n❌ Unhandled error in test execution:');
  if (!handleApiError(error, 'Global error handler')) {
    console.error(error);
  }
  console.log('\nPlease check your network connection and API endpoint configuration.');
});
