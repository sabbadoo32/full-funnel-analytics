const { MongoClient } = require('mongodb');
const { OpenAI } = require('openai');

// Initialize OpenAI with API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const apiKey = event.headers['x-api-key'];
    console.log('API key validation:');
    console.log('- Provided key exists:', !!apiKey);
    console.log('- Expected key exists:', !!process.env.API_KEY);
    console.log('- Key match:', apiKey === process.env.API_KEY ? 'Yes' : 'No');
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized: Invalid API key' })
      };
    }
    
    console.log('API key validated successfully');

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
