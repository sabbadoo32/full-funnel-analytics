const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const { OpenAI } = require('openai');
const cors = require('cors');
const app = express();

// CORS configuration for Netlify Functions
const corsHandler = (req, res, next) => {
  // Allow requests from GitHub Pages and potential Google Sites domains
  const allowedOrigins = ['https://sabbadoo32.github.io'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  next();
};

// Apply CORS and JSON parsing middleware
app.use(corsHandler);
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Campaign model
const Campaign = mongoose.model('Campaign', {
  name: String,
  startDate: Date,
  endDate: Date,
  budget: Number,
  platform: String,
  status: String,
  impressions: Number,
  clicks: Number,
  conversions: Number,
  spend: Number,
  revenue: Number
});

// Chat route
app.post('/chat/query', async (req, res) => {
  try {
    const { message } = req.body;

    // Get instructions and columns list
    const instructions = process.env.FUNNEL_INSTRUCTIONS || '';
    const columnsList = process.env.FUNNEL_COLUMNS || '[]';

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content: `Available columns: ${columnsList}\n\nUser query: ${message}` }
      ]
    });

    // Parse OpenAI response
    const response = completion.choices[0].message.content;
    let query;
    try {
      query = JSON.parse(response);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return res.status(400).json({ error: 'Invalid query format from AI' });
    }

    // Validate query is an object
    if (typeof query !== 'object' || query === null) {
      return res.status(400).json({ error: 'Invalid query format: not an object' });
    }

    // Execute MongoDB query
    const results = await Campaign.find(query);

    // Generate visualization
    const visualization = {
      data: [{
        x: results.map(r => r.name),
        y: results.map(r => r.revenue),
        type: 'bar'
      }],
      layout: {
        title: 'Campaign Performance',
        xaxis: { title: 'Campaign' },
        yaxis: { title: 'Revenue' }
      }
    };

    res.json({
      answer: `Found ${results.length} campaigns matching your query.`,
      visualization
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the serverless handler
module.exports.handler = serverless(app);
