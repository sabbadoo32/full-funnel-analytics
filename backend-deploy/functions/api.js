const mongoose = require('mongoose');
const { OpenAI } = require('openai');
const { corsMiddleware } = require('./cors');
const Campaign = require('./models/campaigns');

// Initialize OpenAI with rate limiting
if (!process.env.API_KEY) {
  console.error('API_KEY is not set in environment variables');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.API_KEY });

// Rate limiting setup
let lastRequestTime = 0;
const MIN_REQUEST_GAP = 1000; // Minimum 1 second between requests

// Model configuration
const MODELS = {
  primary: 'gpt-4',
  fallback: 'gpt-3.5-turbo'
};

// Read instructions and columns list from config files
const fs = require('fs');
const path = require('path');

let instructions, columnsList;

try {
  const instructionsPath = path.join(__dirname, 'config/funnel-instructions.txt');
  const columnsPath = path.join(__dirname, 'config/funnel-columns.json');
  
  console.log('Config paths:', {
    instructionsPath,
    columnsPath,
    __dirname,
    exists: {
      instructions: fs.existsSync(instructionsPath),
      columns: fs.existsSync(columnsPath)
    }
  });

  instructions = fs.readFileSync(instructionsPath, 'utf8');
  console.log('Instructions loaded:', instructions.substring(0, 100) + '...');

  const columnsContent = fs.readFileSync(columnsPath, 'utf8');
  console.log('Columns content loaded:', columnsContent.substring(0, 100) + '...');
  
  columnsList = JSON.parse(columnsContent);
  console.log('Columns parsed successfully');
} catch (error) {
  console.error('Error loading config files:', error);
  throw error;
}

// Helper for rate-limited OpenAI calls
async function callOpenAI(messages, preferredModel = MODELS.primary) {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_GAP) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_GAP - timeSinceLastRequest));
  }

  try {
    const response = await openai.chat.completions.create({
      model: preferredModel,
      messages: messages,
      temperature: 0.7
    });
    lastRequestTime = Date.now();
    return response;
  } catch (error) {
    if (error.message?.includes('gpt-4') && preferredModel === MODELS.primary) {
      console.warn('Falling back to GPT-3.5-turbo due to GPT-4 error:', error.message);
      return callOpenAI(messages, MODELS.fallback);
    }
    throw error;
  }
}

// Helper to fetch campaign data
async function fetchCampaignData(query) {
  try {
    const data = await Campaign.find(query).lean();
    return data;
  } catch (error) {
    console.error('Error fetching campaign data:', error);
    throw error;
  }
}

// Helper to generate Plotly visualization
async function generateVisualization(data, analysisVisualization) {
  try {
    const messages = [
      { role: 'system', content: 'You are a data visualization expert. Generate Plotly.js code based on the data and visualization request.' },
      { role: 'user', content: `Data: ${JSON.stringify(data)}\nVisualization request: ${analysisVisualization}\n\nGenerate ONLY the Plotly.js code as a JavaScript object with data and layout properties.` }
    ];

    const response = await callOpenAI(messages);
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating visualization:', error);
    throw error;
  }
}

// Main handler function
async function handler(event, context) {
  // Apply CORS middleware
  const response = await corsMiddleware(event, context);
  if (response) return response;

  // Connect to MongoDB if not connected
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
    } catch (error) {
      console.error('MongoDB connection error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database connection failed' })
      };
    }
  }

  try {
    const path = event.path;
    const method = event.httpMethod;

    // GET /api/campaigns/summary endpoint
    if (method === 'GET' && path.endsWith('/api/campaigns/summary')) {
      const { campaign_tag, date } = event.queryStringParameters || {};

      if (!campaign_tag || !date) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing required query params: campaign_tag, date' })
        };
      }

      const campaign = await Campaign.findOne({
        "Campaign Tag": campaign_tag,
        Date: date
      }).lean();

      if (!campaign) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Campaign not found for that tag and date' })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(campaign)
      };
    }

    // POST /api/chat/query endpoint
    if (method === 'POST' && path.endsWith('/api/chat/query')) {
      const { message } = JSON.parse(event.body);

      if (!message) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Message is required' })
        };
      }

      // Generate MongoDB query from natural language
      const queryMessages = [
        { role: 'system', content: `You are a MongoDB query generator. Use these instructions to understand the data and columns: ${instructions}\n\nAvailable columns: ${JSON.stringify(columnsList)}` },
        { role: 'user', content: `Generate a MongoDB query object for: ${message}` }
      ];

      const queryResponse = await callOpenAI(queryMessages);
      const queryObject = JSON.parse(queryResponse.choices[0].message.content);

      // Fetch data using the generated query
      const data = await fetchCampaignData(queryObject);

      // Generate analysis messages
      const analysisMessages = [
        { role: 'system', content: 'You are a marketing analytics expert. Analyze the data and suggest visualizations.' },
        { role: 'user', content: `Query: ${message}\n\nData: ${JSON.stringify(data)}\n\nProvide a natural language analysis and suggest a visualization approach.` }
      ];

      const analysisResponse = await callOpenAI(analysisMessages);
      const analysis = analysisResponse.choices[0].message.content;

      // Generate visualization
      const visualization = await generateVisualization(data, analysis);

      return {
        statusCode: 200,
        body: JSON.stringify({
          data,
          analysis,
          visualization
        })
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' })
    };

  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

// Export the handler for Netlify Functions
exports.handler = handler;
