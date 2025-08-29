const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    
    // Test the connection
    const db = client.db();
    await db.command({ ping: 1 });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Connected to MongoDB',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to connect to database',
        details: error.message
      })
    };
  }
};
