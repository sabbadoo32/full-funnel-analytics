/**
 * Debug endpoint for Full Funnel Analytics API
 * This endpoint returns information about environment variables and MongoDB connection
 * for debugging deployment issues.
 */

const mongoose = require('mongoose');
const { headers } = require('../config/cors');

exports.handler = async (event, context) => {
  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Validate API key for security
    const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'] || '';
    const openaiApiKey = process.env.OPENAI_API_KEY || '';
    const legacyApiKey = process.env.API_KEY || '';
    
    // Standardize on OPENAI_API_KEY as the primary authentication method
    // while maintaining backward compatibility with other keys
    const isValidKey = (
      // Primary authentication method
      (openaiApiKey && apiKey === openaiApiKey) || 
      // Legacy authentication methods for backward compatibility
      (legacyApiKey && apiKey === legacyApiKey)
    );
    
    if (!apiKey || !isValidKey) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized: Invalid API key' })
      };
    }

    // Test MongoDB connection
    let mongoTest = "Not tested";
    let mongoError = null;
    let collections = [];

    if (process.env.MONGO_URI) {
      try {
        await mongoose.connect(process.env.MONGO_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000
        });
        
        // Get collections
        const collectionsResult = await mongoose.connection.db.listCollections().toArray();
        collections = collectionsResult.map(c => c.name);
        mongoTest = `Connection successful. Found ${collections.length} collections`;
        
        // Close connection
        await mongoose.connection.close();
      } catch (err) {
        mongoError = err.message;
        mongoTest = "Connection failed";
      }
    } else {
      mongoTest = "MONGO_URI not set";
    }

    // Return debug info
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Debug info",
        openaiKeyExists: !!openaiApiKey,
        openaiKeyLength: openaiApiKey ? openaiApiKey.length : 0,
        openaiKeyFirstChars: openaiApiKey ? openaiApiKey.substring(0, 10) + '...' : 'none',
        fullFunnelApiKeyExists: !!fullFunnelApiKey,
        fullFunnelApiKeyLength: fullFunnelApiKey ? fullFunnelApiKey.length : 0,
        fullFunnelApiKeyFirstChars: fullFunnelApiKey ? fullFunnelApiKey.substring(0, 10) + '...' : 'none',
        apiKeyExists: !!legacyApiKey,
        apiKeyLength: legacyApiKey ? legacyApiKey.length : 0,
        apiKeyFirstChars: legacyApiKey ? legacyApiKey.substring(0, 10) + '...' : 'none',
        mongoUriExists: !!process.env.MONGO_URI,
        mongoUriFirstChars: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 15) + '...' : 'none',
        mongoTest,
        mongoError,
        path: event.path
      })
    };
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
