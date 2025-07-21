const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://sebastianjames:d%402119ChartwellDrive@cluster0.gh4va.mongodb.net/full_funnel';

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('Successfully connected to MongoDB!');
    
    // Test database access
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('MongoDB connection error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
}

testConnection();
