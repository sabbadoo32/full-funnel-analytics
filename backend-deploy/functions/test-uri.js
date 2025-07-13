// Function to test MONGO_URI in Netlify environment
const mongoose = require('mongoose');

exports.handler = async function(event, context) {
  // Disable mongoose buffering to ensure errors are thrown immediately
  mongoose.set('bufferCommands', false);
  const uri = process.env.MONGO_URI;
  
  // Check if MONGO_URI is set
  if (!uri) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'MONGO_URI is not set',
        envVars: Object.keys(process.env).filter(key => !key.includes('AWS'))
      })
    };
  }

  // Basic validation
  const validation = {
    length: uri.length,
    startsWithProtocol: uri.startsWith('mongodb+srv://'),
    hasUsername: uri.includes('sebastianjames'),
    hasEncodedAt: uri.includes('%40'),
    hasHost: uri.includes('.mongodb.net'),
    hasDatabase: uri.endsWith('/full_funnel'),
    hasExtraSpaces: uri.trim() !== uri
  };

  // Compare with expected URI format from MongoDB Compass
  const expectedFormat = 'mongodb+srv://sebastianjames:d%402119ChartwellDrive@cluster0.gh4va.mongodb.net/';
  const comparison = {
    matchesFormat: uri.startsWith(expectedFormat),
    hasDatabase: uri.includes('/full_funnel'),
    hasQueryParams: uri.includes('?'),
    fullUri: uri  // Will be logged for debugging
  };

  // Attempt MongoDB connection
  let connectionResult = { success: false, error: null };
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      family: 4
    });
    connectionResult.success = true;
    await mongoose.connection.close();
  } catch (error) {
    connectionResult.error = {
      message: error.message,
      code: error.code,
      name: error.name
    };
    console.error('MongoDB connection error:', error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      validation,
      comparison,
      uriStart: uri.substring(0, 20) + '...',  // Show just the start for safety
      uriEnd: '...' + uri.substring(uri.length - 20)  // Show just the end for safety
    }, null, 2)
  };
};
