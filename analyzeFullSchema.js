const mongoose = require('mongoose');
require('dotenv').config();

async function analyzeFullSchema() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    console.log('Analyzing full collection schema...');
    
    // Get all distinct field names using map-reduce
    const map = function() {
      function getFieldNames(obj, prefix) {
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            var field = prefix ? prefix + '.' + key : key;
            emit(field, 1);
            
            if (obj[key] !== null && typeof obj[key] === 'object') {
              getFieldNames(obj[key], field);
            }
          }
        }
      }
      getFieldNames(this, '');
    };
    
    const reduce = function(key, values) {
      return Array.sum(values);
    };
    
    console.log('Running map-reduce to analyze schema...');
    const result = await db.collection('full_funnel').mapReduce(map, reduce, {
      out: { inline: 1 },
      scope: { },
      verbose: true
    });
    
    // Get sample values for each field
    console.log('Sampling values for each field...');
    const fields = result.map(r => r._id);
    const fieldSamples = {};
    
    for (const field of fields) {
      const sample = await db.collection('full_funnel').aggregate([
        { $match: { [field]: { $exists: true } } },
        { $sample: { size: 1 } },
        { $project: { _id: 0, value: `$${field}` } }
      ]).toArray();
      
      if (sample.length > 0) {
        fieldSamples[field] = sample[0].value;
      }
    }
    
    // Get distinct values for important fields
    console.log('Getting distinct values for important fields...');
    const importantFields = ['type', 'event_type', 'category', 'source', 'tags'];
    const distinctValues = {};
    
    for (const field of importantFields) {
      try {
        const values = await db.collection('full_funnel').distinct(field);
        distinctValues[field] = values;
      } catch (err) {
        // Field might not exist or be queryable
      }
    }
    
    const analysis = {
      totalDocuments: await db.collection('full_funnel').countDocuments(),
      fieldCounts: result,
      fieldSamples,
      distinctValues
    };
    
    // Save to file
    const fs = require('fs');
    fs.writeFileSync('full_schema_analysis.json', JSON.stringify(analysis, null, 2));
    console.log('Full schema analysis complete. Results saved to full_schema_analysis.json');
    
    mongoose.connection.close();
  } catch (err) {
    console.error('Error analyzing schema:', err);
    process.exit(1);
  }
}

analyzeFullSchema();
