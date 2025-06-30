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

// Count of documents missing Event Name or Event Date
app.get('/campaigns/missing-fields', async (req, res) => {
  const missingCount = await Campaign.countDocuments({
    $or: [
      { 'Event Name': { $exists: false } },
      { 'Event Date': { $exists: false } },
      { 'Event Name': "" },
      { 'Event Date': "" }
    ]
  });
  res.json({ missingCoreFields: missingCount });
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
// Channel totals endpoints
// -----------------------------------------------------

// Email totals
app.get('/campaigns/totals/email', async (req, res) => {
  const docs = await Campaign.find();

  let emailsSent = 0;
  let opened = 0;
  let clicked = 0;
  let converted = 0;

  docs.forEach(doc => {
    emailsSent += Number(doc['Emails Sent']) || 0;
    opened += Number(doc['Opened']) || 0;
    clicked += Number(doc['Clicked']) || 0;
    converted += Number(doc['Converted']) || 0;
  });

  res.json({
    emailsSent,
    opened,
    clicked,
    converted
  });
});

// Google Analytics totals
app.get('/campaigns/totals/ga', async (req, res) => {
  const docs = await Campaign.find();

  let sessions = 0;
  let pageViews = 0;
  let eventCount = 0;

  docs.forEach(doc => {
    sessions += Number(doc['GA Sessions']) || 0;
    pageViews += Number(doc['Page Views']) || 0;
    eventCount += Number(doc['Event count']) || 0;
  });

  res.json({
    sessions,
    pageViews,
    eventCount
  });
});

// Facebook totals
app.get('/campaigns/totals/facebook', async (req, res) => {
  const docs = await Campaign.find();

  let reach = 0;
  let reactions = 0;
  let comments = 0;
  let shares = 0;

  docs.forEach(doc => {
    reach += Number(doc['FB Reach']) || 0;
    reactions += Number(doc['Reactions']) || 0;
    comments += Number(doc['Comments']) || 0;
    shares += Number(doc['Shares']) || 0;
  });

  res.json({
    reach,
    reactions,
    comments,
    shares
  });
});

// Instagram totals
app.get('/campaigns/totals/instagram', async (req, res) => {
  const docs = await Campaign.find();

  let clicks = 0;
  let profileVisits = 0;
  let reach = 0;

  docs.forEach(doc => {
    clicks += Number(doc['IG Clicks']) || 0;
    profileVisits += Number(doc['Instagram profile visits']) || 0;
    reach += Number(doc['Instagram reach']) || 0;
  });

  res.json({
    clicks,
    profileVisits,
    reach
  });
});

// Mobilize totals
app.get('/campaigns/totals/mobilize', async (req, res) => {
  const docs = await Campaign.find();

  let rsvps = 0;

  docs.forEach(doc => {
    rsvps += Number(doc['Mobilize RSVPs']) || 0;
  });

  res.json({ rsvps });
});

// Impactive totals
app.get('/campaigns/totals/impactive', async (req, res) => {
  const docs = await Campaign.find();

  let p2pMessages = 0;
  let p2pResponses = 0;
  let f2fInitial = 0;

  docs.forEach(doc => {
    p2pMessages += Number(doc['p2p_initial_messages']) || 0;
    p2pResponses += Number(doc['p2p_responses']) || 0;
    f2fInitial += Number(doc['f2f_initial_messages_sent']) || 0;
  });

  res.json({
    p2pMessages,
    p2pResponses,
    f2fInitial
  });
});

// Connected TV totals
app.get('/campaigns/totals/ctv', async (req, res) => {
  const docs = await Campaign.find();

  let impressions = 0;
  let completedViews = 0;
  let costPerViewTotal = 0;
  let costPerViewCount = 0;

  docs.forEach(doc => {
    impressions += Number(doc['CTV Impressions']) || 0;
    completedViews += Number(doc['Completed View']) || 0;

    if (doc['Cost Per View']) {
      costPerViewTotal += Number(doc['Cost Per View']);
      costPerViewCount++;
    }
  });

  const avgCostPerView = costPerViewCount ? costPerViewTotal / costPerViewCount : 0;

  res.json({
    impressions,
    completedViews,
    avgCostPerView
  });
});
