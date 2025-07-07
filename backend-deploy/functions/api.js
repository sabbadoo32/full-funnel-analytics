const mongoose = require('mongoose');
const { OpenAI } = require('openai');
const { corsMiddleware } = require('./cors');

// Initialize OpenAI
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// MongoDB connection handling
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Campaign model
const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', {
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

// Base handler function
const baseHandler = async (event, context) => {
  // Set context.callbackWaitsForEmptyEventLoop to false to prevent function timeout
  context.callbackWaitsForEmptyEventLoop = false;

  // Connect to MongoDB
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Database connection failed' })
    };
  }
  // Only allow POST requests to /chat/query
  if (event.httpMethod !== 'POST' || !event.path.endsWith('/chat/query')) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' })
    };
  }

  try {
    const { message } = JSON.parse(event.body);

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
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid query format from AI' })
      };
    }

    // Validate query is an object
    if (typeof query !== 'object' || query === null) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid query format: not an object' })
      };
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        answer: `Found ${results.length} campaigns matching your query.`,
        visualization
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
