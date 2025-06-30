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
// Validation & exploration endpoints
// -----------------------------------------------------

// Total count of documents
app.get('/campaigns/count', async (req, res) => {
  const count = await Campaign.countDocuments();
  res.json({ totalDocuments: count });
});

// Earliest and latest Event Dates
app.get('/campaigns/date-range', async (req, res) => {
  const earliest = await Campaign.find().sort({ 'Event Date': 1 }).limit(1);
  const latest = await Campaign.find().sort({ 'Event Date': -1 }).limit(1);
  res.json({
    earliestEventDate: earliest[0]?.['Event Date'] || "N/A",
    latestEventDate: latest[0]?.['Event Date'] || "N/A"
  });
});

// Distinct Event Types
app.get('/campaigns/distinct-event-types', async (req, res) => {
  const types = await Campaign.distinct('Event Type');
  res.json({ eventTypes: types });
});

// -----------------------------------------------------
// Dynamic per-field summary endpoint
// -----------------------------------------------------

app.get('/campaigns/summary-field', async (req, res) => {
  const { field } = req.query;

  if (!field) {
    return res.status(400).json({ error: "Please provide a 'field' query parameter." });
  }

  try {
    const docs = await Campaign.find({ [field]: { $exists: true, $ne: null } });

    let total = 0;
    let countNonNull = 0;

    docs.forEach(doc => {
      const value = Number(doc[field]);
      if (!isNaN(value)) {
        total += value;
        countNonNull++;
      }
    });

    const average = countNonNull ? total / countNonNull : 0;

    res.json({
      field,
      total,
      average,
      countNonNull
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error summarizing field" });
  }
});
