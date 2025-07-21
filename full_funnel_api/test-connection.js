require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to MongoDB!');
    
    // Test database access
    console.log('Checking campaigns collection...');
    const campaigns = await Campaign.find().limit(1);
    console.log(`Found ${campaigns.length} campaign(s)`);
    if (campaigns.length > 0) {
      console.log('Sample campaign data:', JSON.stringify(campaigns[0], null, 2));
    }
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
}

testConnection();
