const { MongoClient } = require('mongodb');
const { OpenAI } = require('openai');

// Helper function for OpenAI API calls with enhanced error handling
async function callOpenAIWithErrorHandling(messages, model = 'gpt-4') {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return await openai.chat.completions.create({
      model: model,
      messages: messages
    });
  } catch (error) {
    // Log detailed error information
    console.error('OpenAI API error details:', {
      name: error.name,
      message: error.message,
      type: error.constructor.name,
      status: error.status || 'unknown',
      headers: error.headers || 'none',
      code: error.code || 'none'
    });
    
    // Handle ClientResponseError or network-related errors
    if (error.name === 'ClientResponseError' || 
        error.message?.includes('network') || 
        error.message?.includes('timeout') || 
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ETIMEDOUT')) {
      console.error('Network or ClientResponseError detected:', error.message);
      
      // Retry with fallback model
      if (model === 'gpt-4') {
        console.log('Retrying with gpt-3.5-turbo due to network error');
        return callOpenAIWithErrorHandling(messages, 'gpt-3.5-turbo');
      }
    }
    
    // Re-throw the error for the caller to handle
    throw error;
  }
}

// CORS headers for all responses
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  console.log('Function invoked with event:', {
    httpMethod: event.httpMethod,
    path: event.path,
    hasBody: !!event.body,
    hasApiKey: !!event.headers['x-api-key']
  });

  try {
    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
      console.log('Handling OPTIONS preflight request');
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }
    
    // Validate request method
    if (event.httpMethod !== 'POST') {
      console.log(`Invalid method: ${event.httpMethod}`);
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // Validate API key
    const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'] || '';
    const openaiApiKey = process.env.OPENAI_API_KEY || '';
    const legacyApiKey = process.env.API_KEY || '';
    const defaultApiKey = 'full-funnel-api-key-default';
    
    console.log('API key validation:');
    console.log('- Provided key exists:', !!apiKey);
    console.log('- OPENAI_API_KEY exists:', !!openaiApiKey);
    console.log('- API_KEY exists:', !!legacyApiKey);
    
    // Standardize on OPENAI_API_KEY as the primary authentication method
    // while maintaining backward compatibility with other keys
    const isValidKey = (
      // Primary authentication method
      (openaiApiKey && apiKey === openaiApiKey) || 
      // Legacy authentication methods for backward compatibility
      (legacyApiKey && apiKey === legacyApiKey) || 
      apiKey === defaultApiKey
    );
    
    console.log('- Key valid:', isValidKey ? 'Yes' : 'No');
    
    if (!apiKey || !isValidKey) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized: Invalid API key' })
      };
    }
    
    console.log('API key validated successfully');

    // Check if this is the chat/query endpoint
    const requestPath = event.path;
    
    // Debug endpoint to check environment variables
    if (requestPath.endsWith('/debug')) {
      let mongoTest = 'Not tested';
      let mongoError = null;
      
      // Test MongoDB connection
      if (process.env.MONGO_URI) {
        try {
          const client = new MongoClient(process.env.MONGO_URI);
          await client.connect();
          const db = client.db();
          const collections = await db.listCollections().toArray();
          mongoTest = `Connection successful. Found ${collections.length} collections`;
          await client.close();
        } catch (err) {
          mongoTest = 'Connection failed';
          mongoError = err.message;
        }
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Debug info',
          openaiKeyExists: !!process.env.OPENAI_API_KEY,
          openaiKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
          openaiKeyFirstChars: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'none',
          apiKeyExists: !!process.env.API_KEY,
          apiKeyLength: process.env.API_KEY ? process.env.API_KEY.length : 0,
          apiKeyFirstChars: process.env.API_KEY ? process.env.API_KEY.substring(0, 10) + '...' : 'none',
          defaultApiKey: 'full-funnel-api-key-default',
          mongoUriExists: !!process.env.MONGO_URI,
          mongoUriFirstChars: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + '...' : 'none',
          mongoTest: mongoTest,
          mongoError: mongoError,
          path: requestPath,
          nodeEnv: process.env.NODE_ENV
        })
      };
    }
    
    if (!requestPath.endsWith('/chat/query')) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Endpoint not found' })
      };
    }

    // Parse the request body with error handling
    let message;
    try {
      if (!event.body) {
        console.error('Request body is missing');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Request body is required' })
        };
      }
      
      console.log('Parsing request body...');
      const parsedBody = JSON.parse(event.body);
      message = parsedBody.message;
      
      console.log('Request body parsed successfully');
      console.log('Message exists:', !!message);
      
      if (!message?.trim()) {
        console.error('Message is empty or missing');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Message is required' })
        };
      }
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request body format', details: parseError.message })
      };
    }

    // Connect to MongoDB with comprehensive error handling and logging
    let client, db;
    try {
      // Log environment variables (safely)
      console.log('Environment check:');
      console.log('- MONGO_URI exists:', !!process.env.MONGO_URI);
      console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
      console.log('- OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
      console.log('- NODE_ENV:', process.env.NODE_ENV);
      
      // Log connection attempt
      const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('MongoDB URI is not defined in environment variables');
      }
      
      console.log('Attempting to connect to MongoDB...');
      console.log('URI format check:', uri.startsWith('mongodb') ? 'Valid prefix' : 'Invalid prefix');
      console.log('URI length check:', uri.length > 20 ? 'Sufficient length' : 'Suspiciously short');
      
      // Create client and connect
      client = new MongoClient(uri);
      
      console.log('MongoDB client created, attempting connection...');
      await client.connect();
      console.log('MongoDB connection successful');
      
      // Get database
      db = client.db();
      console.log('MongoDB database accessed successfully');
    } catch (dbError) {
      console.error('MongoDB connection error details:');
      console.error('- Error name:', dbError.name);
      console.error('- Error message:', dbError.message);
      console.error('- Error code:', dbError.code);
      console.error('- Error stack:', dbError.stack);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Database connection error',
          details: dbError.message,
          name: dbError.name,
          code: dbError.code
        })
      };
    }

    // Simple test query to verify database connection
    try {
      const collections = await db.listCollections().toArray();
      console.log(`Found ${collections.length} collections in database`);
      
      // Get a sample of data from the campaigns collection
      const campaignSample = await db.collection('campaigns').find({}).limit(1).toArray();
      console.log('Campaign sample:', JSON.stringify(campaignSample, null, 2));
      
      // Close MongoDB connection
      await client.close();
      
      // Return success response with sample data
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: "API connection successful",
          query: message,
          collections: collections.map(c => c.name),
          sampleData: campaignSample,
          status: "success"
        })
      };
      
    } catch (queryError) {
      console.error('Error querying database:', queryError);
      
      // Close MongoDB connection if it's open
      if (client) {
        await client.close();
      }
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Database query error',
          details: queryError.message
        })
      };
    }

  } catch (error) {
    console.error('Error processing chat query:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error processing query',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    };
  }
};
