const { MongoClient } = require('mongodb');

exports.handler = async function(event, context) {
  console.log('Starting MongoDB connection test...');
  
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not set');
    }

    console.log('Attempting MongoDB connection...');
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });

    await client.connect();
    console.log('Connected successfully!');

    const admin = client.db().admin();
    const dbs = await admin.listDatabases();
    console.log('Available databases:', dbs.databases.map(db => db.name));

    await client.close();
    console.log('Connection closed.');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        databases: dbs.databases.map(db => db.name)
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      })
    };
  }

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
