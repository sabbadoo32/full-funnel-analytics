const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const campaignSchema = new mongoose.Schema({}, { strict: false });
const Campaign = mongoose.model('Campaign', campaignSchema, 'full_funnel');

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('MU API is running!');
});

// -----------------------------------------------------
// Dynamic Query Endpoint
// -----------------------------------------------------
app.post('/campaigns/query', async (req, res) => {
  try {
    const { filter = {}, groupBy, aggregations = {} } = req.body;

    const pipeline = [];

    // Apply filter if present
    if (Object.keys(filter).length > 0) {
      pipeline.push({ $match: filter });
    }

    // Build aggregation stage
    const groupStage = {
      _id: groupBy ? `$${groupBy}` : null,
    };

    for (const [key, agg] of Object.entries(aggregations)) {
      const [operator, field] = Object.entries(agg)[0];
      groupStage[key] = { [operator]: `$${field}` };
    }

    pipeline.push({ $group: groupStage });

    const result = await Campaign.aggregate(pipeline).exec();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error running dynamic query' });
  }
});