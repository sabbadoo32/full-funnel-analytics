const { MongoClient } = require('mongodb');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI with API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Rate limiting setup
let lastRequestTime = 0;
const MIN_REQUEST_GAP = 1000; // Minimum 1 second between requests

// Model configuration
const MODEL = 'gpt-4';
const FALLBACK_MODEL = 'gpt-3.5-turbo';

// Helper for rate-limited OpenAI calls
async function callOpenAI(messages, model = MODEL) {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_GAP) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_GAP - timeSinceLastRequest));
  }
  
  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages
    });
    lastRequestTime = Date.now();
    return completion;
  } catch (error) {
    if (error.message?.includes('gpt-4') && model === MODEL) {
      console.warn('Falling back to GPT-3.5-turbo due to GPT-4 error:', error.message);
      return callOpenAI(messages, FALLBACK_MODEL);
    }
    throw error;
  }
}

// Helper to fetch campaign data
async function fetchCampaignData(db, query) {
  try {
    console.log('MongoDB Query:', JSON.stringify(query, null, 2));
    
    // Execute the query
    const data = await db.collection('campaigns').find(query).toArray();
    return data;
  } catch (error) {
    console.error('Error fetching campaign data:', error);
    throw new Error('Failed to fetch campaign data');
  }
}

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // Verify API key
  const apiKey = event.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized: Invalid API key' })
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const { message } = JSON.parse(event.body);
    
    if (!message?.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();

    // Read instructions and columns list
    let instructions, columnsList;
    try {
      // Try to read from project root first
      instructions = fs.readFileSync(path.join(__dirname, '../../full_funnel_instructions.txt'), 'utf8');
      columnsList = JSON.parse(fs.readFileSync(path.join(__dirname, '../../full_funnel_all_columns_master_list.json'), 'utf8'));
    } catch (error) {
      console.warn('Could not read files from project root, trying functions directory');
      try {
        // Try functions directory as fallback
        instructions = fs.readFileSync(path.join(__dirname, '../full_funnel_instructions.txt'), 'utf8');
        columnsList = JSON.parse(fs.readFileSync(path.join(__dirname, '../full_funnel_all_columns_master_list.json'), 'utf8'));
      } catch (innerError) {
        console.error('Failed to read instruction files:', innerError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Server configuration error' })
        };
      }
    }

    // First, ask GPT to analyze the query and identify any needed clarifications
    const clarificationCompletion = await callOpenAI([
      {
        role: "system",
        content: `You are a friendly, helpful marketing analytics expert for Michigan United (MU). Your goal is to help users understand their campaign performance and suggest improvements, even if they're not familiar with marketing terminology.

Available fields: ${JSON.stringify(columnsList, null, 2)}

If the query needs clarification, respond with a JSON object in this format:
{
  "needsClarification": true,
  "clarificationQuestions": [
    // Use friendly, practical questions like:
    "Would you like to focus on TV ads, social media, or all campaigns?",
    "Should we look at recent performance or a specific time period?",
    "Are you more interested in what's working well or where we might need improvements?"
  ],
  "missingFields": ["field1", "field2"],
  "context": "A friendly explanation of what would help provide better insights",
  "suggestions": [
    // Proactive suggestions based on common patterns, like:
    "I notice you're asking about campaign performance. I can also show you which channels are giving the best return on investment.",
    "Would you like to see how this compares to similar campaigns?",
    "I can highlight any unusual patterns or opportunities I spot in the data."
  ]
}

If the query is clear and complete, respond with:
{
  "needsClarification": false
}`
      },
      {
        role: "user",
        content: message
      }
    ]);

    let clarification;
    try {
      clarification = JSON.parse(clarificationCompletion.choices[0].message.content);
      if (clarification.needsClarification) {
        // Add helpful context to the response
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            needsClarification: true,
            questions: clarification.clarificationQuestions,
            missingFields: clarification.missingFields,
            context: clarification.context,
            suggestions: clarification.suggestions || [],
            tone: "friendly"
          })
        };
      }
    } catch (parseError) {
      console.error('Failed to parse clarification check:', parseError);
    }

    // If no clarification needed, proceed with analysis
    const analysisCompletion = await callOpenAI([
      {
        role: "system",
        content: `You are a marketing analytics expert for Michigan United (MU). You MUST respond in valid JSON format ONLY.

You have these instructions:
${instructions}

Analyze queries to determine:
1. What data is needed from MongoDB
2. What visualization would best represent this data
3. How to structure the MongoDB query

Available fields: ${JSON.stringify(columnsList, null, 2)}

You MUST respond with ONLY a JSON object in this exact format:
{
  "query": {"field": "value"}, // MongoDB query object
  "visualization": {
    "type": "line|bar|scatter|pie|3d-scatter",
    "x": "field for x-axis",
    "y": "field for y-axis",
    "z": "field for z-axis (if 3D)",
    "title": "chart title"
  },
  "explanation": "brief explanation of the analysis and insights"
}

DO NOT include any other text, markdown, or formatting. ONLY the JSON object.`
      },
      {
        role: "user",
        content: `Analyze this query and respond in JSON only: ${message}`
      }
    ]);

    let analysis;
    try {
      // First try to parse the JSON response
      const rawContent = analysisCompletion.choices[0].message.content;
      console.log('OpenAI Response:', rawContent);
      analysis = JSON.parse(rawContent);

      // Validate that we have a proper query object
      if (!analysis || typeof analysis !== 'object') {
        throw new Error('Analysis must be an object');
      }

      // Ensure query is a valid MongoDB query object
      if (!analysis.query || typeof analysis.query !== 'object') {
        console.error('Invalid query format:', analysis);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid query format',
            explanation: "I understand your question, but I'm having trouble formulating the database query. Could you try being more specific about what data you're looking for?"
          })
        };
      }

      // Validate visualization format if present
      if (analysis.visualization && typeof analysis.visualization !== 'object') {
        analysis.visualization = null;
      }

    } catch (parseError) {
      console.error('Failed to parse or validate OpenAI response:', analysisCompletion.choices[0].message.content);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to parse analysis',
          explanation: "I'm having trouble understanding your query. Could you try rephrasing it with specific metrics or time periods you're interested in?"
        })
      };
    }

    // Log and fetch the data based on the analysis
    console.log('Generated MongoDB query:', JSON.stringify(analysis.query, null, 2));
    
    let data = await fetchCampaignData(db, analysis.query);

    if (!data || data.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          explanation: "I couldn't find any data matching your query. Could you try rephrasing or specifying different criteria?",
          data: [],
          visualization: null
        })
      };
    }

    // Calculate budget metrics
    data = data.map(item => ({
      ...item,
      budgetVariance: (item.campaignBudgetAllocated || 0) - (item.campaignBudgetSpent || 0),
      budgetROI: item.campaignBudgetSpent ? (item.totalRevenue || 0) / item.campaignBudgetSpent : 0,
      budgetROAS: item.campaignBudgetSpent ? (item.totalRevenue || 0) / item.campaignBudgetSpent : 0
    }));

    // Format data for manager-friendly insights
    const managerInsights = {
      summary: {
        headline: "Quick Overview",
        keyMetrics: [
          `Budget Status: ${data.some(d => d.budgetVariance < 0) ? '⚠️ Some campaigns over budget' : '✅ All campaigns within budget'}`,
          `ROI Leaders: ${data.filter(d => d.budgetROI > 2).length} campaigns exceeding 2x ROI`,
          `Attention Needed: ${data.filter(d => d.budgetVariance < 0).length} campaigns need review`
        ],
        trends: analysis.explanation
      },
      actionItems: [
        // Generate actionable recommendations based on data
        ...data
          .filter(d => d.budgetVariance < 0)
          .map(d => `Review budget allocation for ${d.budgetCategory || 'campaign'}`),
        ...data
          .filter(d => d.budgetROI < 1)
          .map(d => `Evaluate performance strategy for low-ROI ${d.budgetCategory || 'campaign'}`)
      ]
    };

    // Close MongoDB connection
    await client.close();

    // Return everything with manager-friendly format
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: data,
        explanation: analysis.explanation,
        visualization: analysis.visualization,
        managerView: managerInsights
      })
    };

  } catch (error) {
    console.error('Error processing chat query:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error processing query',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    };
  }
};
