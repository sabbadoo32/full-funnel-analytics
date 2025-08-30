const mongoose = require('mongoose');
require('dotenv').config();

async function checkSchema() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    // Get one document from each collection
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const colName = collection.name;
      console.log(`\nCollection: ${colName}`);
      
      // Get one document to check schema
      const doc = await db.collection(colName).findOne({});
      if (doc) {
        console.log('Sample fields:', Object.keys(doc));
        
        // Check for nested objects
        const nestedFields = {};
        for (const [key, value] of Object.entries(doc)) {
          if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            nestedFields[key] = Object.keys(value);
          }
        }
        
        if (Object.keys(nestedFields).length > 0) {
          console.log('Nested fields:', nestedFields);
        }
      } else {
        console.log('No documents found');
      }
    }
    
    // Get counts by data type if possible
    try {
      const pipeline = [
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ];
      
      const types = await db.collection('full_funnel').aggregate(pipeline).toArray();
      console.log('\nDocument types and counts:', types);
      
    } catch (err) {
      console.log('Could not get type counts:', err.message);
    }
    
    mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkSchema();
