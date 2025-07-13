const mongoose = require('mongoose');

exports.handler = async function(event, context) {
  console.log('Starting MongoDB connection test...');
  
  try {
    // Print URI details (safely)
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not set');
    }

    // Basic URI validation
    const validation = {
      startsWithProtocol: uri.startsWith('mongodb+srv://'),
      hasUsername: uri.includes('sebastianjames'),
      hasEncodedAt: uri.includes('%40'),
      hasHost: uri.includes('.mongodb.net'),
      hasDatabase: uri.includes('/full_funnel'),
      hasQueryParams: uri.includes('?retryWrites=true'),
      totalLength: uri.length
    };

    console.log('URI validation:', validation);

    // Attempt connection
    console.log('Attempting MongoDB connection...');
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 5000,
        family: 4,
        retryWrites: true,
        w: 'majority'
      });
    } catch (connError) {
      console.error('MongoDB connection error:', connError.message);
      console.error('Error code:', connError.code);
      console.error('Error name:', connError.name);
      throw connError;
    }

    // List collections if connected
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('Connected successfully. Collections:', collectionNames);
    
    await mongoose.connection.close();
    console.log('Connection closed.');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        validation,
        collections: collectionNames,
        message: 'MongoDB connection successful'
      })
    };

  } catch (error) {
    console.error('Connection error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: {
          name: error.name,
          message: error.message,
          code: error.code
        },
        validation: validation
      })
    };
  }
};
