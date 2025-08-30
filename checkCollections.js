const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollections() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const collections = ['full_funnel', 'campaigns', 'events', 'analytics'];
    const results = {};
    
    for (const collection of collections) {
      console.log(`Checking collection: ${collection}`);
      
      // Get one document to check structure
      const doc = await db.collection(collection).findOne({});
      
      if (doc) {
        results[collection] = {
          count: await db.collection(collection).countDocuments(),
          fields: Object.keys(doc),
          sample: doc
        };
      } else {
        results[collection] = { count: 0, fields: [], sample: null };
      }
      
      // Get distinct values for key fields if they exist
      const keyFields = ['type', 'event_type', 'category', 'source'];
      results[collection].fieldValues = {};
      
      for (const field of keyFields) {
        if (results[collection].fields.includes(field)) {
          try {
            const values = await db.collection(collection).distinct(field);
            results[collection].fieldValues[field] = values;
          } catch (err) {
            // Field might not be queryable
          }
        }
      }
    }
    
    // Save results to file
    const fs = require('fs');
    fs.writeFileSync('collection_analysis.json', JSON.stringify(results, null, 2));
    console.log('Collection analysis complete. Results saved to collection_analysis.json');
    
    mongoose.connection.close();
  } catch (err) {
    console.error('Error analyzing collections:', err);
    process.exit(1);
  }
}

checkCollections();
