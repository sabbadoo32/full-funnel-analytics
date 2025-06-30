const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const campaignSchema = new mongoose.Schema({}, { strict: false });
const Campaign = mongoose.model('Campaign', campaignSchema, 'full_funnel'); // ← Your collection name

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('MU API is running!');
});

// 🔎 New: Field explorer route
app.get('/explore/fields', async (req, res) => {
  try {
    const cursor = Campaign.find().cursor();
    const fieldCounts = {};

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      const keys = Object.keys(doc.toObject());
      keys.forEach((key) => {
        fieldCounts[key] = (fieldCounts[key] || 0) + 1;
      });
    }

    res.json(fieldCounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error analyzing fields" });
  }
});

// Current summary route (only by Event Name)
app.get('/campaigns/summary', async (req, res) => {
  const { campaign_tag } = req.query;

  try {
    const campaign = await Campaign.findOne({
      'Event Name': campaign_tag,
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found for that tag" });
    }

    res.json(campaign);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
