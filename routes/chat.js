const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const Campaign = require('../models/campaigns');

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

// Helper for rate-limited OpenAI calls
async function callOpenAI(messages, preferredModel = MODELS.primary) {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_GAP) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_GAP - timeSinceLastRequest));
  }
  
  try {
    const completion = await openai.chat.completions.create({
      model: preferredModel,
      messages: messages
    });
    lastRequestTime = Date.now();
    return completion;
  } catch (error) {
    // If GPT-4 fails and we're not already using fallback, try GPT-3.5
    if (error.status === 429 && preferredModel === MODELS.primary) {
      console.log('Falling back to GPT-3.5-turbo due to rate limit');
      return callOpenAI(messages, MODELS.fallback);
    }
    throw error;
  }
}

// Read instructions and columns list once at startup
const instructions = fs.readFileSync(path.join(__dirname, '../full_funnel_instructions.txt'), 'utf8');
const columnsList = JSON.parse(fs.readFileSync(path.join(__dirname, '../full_funnel_all_columns_master_list.json'), 'utf8'));

// Helper to fetch campaign data
async function fetchCampaignData(query) {
  try {
    return await Campaign.find(query).lean();
  } catch (error) {
    console.error('Error fetching campaign data:', error);
    throw new Error('Failed to fetch campaign data');
  }
}

// Helper to generate Plotly visualization
async function generateVisualization(data, analysisVisualization) {
  try {
    // Default layout settings
    const defaultLayout = {
      autosize: true,
      margin: { t: 50, r: 30, l: 50, b: 50 },
      showlegend: true,
      hovermode: 'closest'
    };

    // Create visualization based on type
    let plotData = [];
    switch (analysisVisualization.type) {
      case 'bar':
        plotData = [{
          type: 'bar',
          x: data.map(d => d[analysisVisualization.x]),
          y: data.map(d => d[analysisVisualization.y]),
          name: analysisVisualization.y
        }];
        break;

      case 'line':
        plotData = [{
          type: 'scatter',
          mode: 'lines+markers',
          x: data.map(d => d[analysisVisualization.x]),
          y: data.map(d => d[analysisVisualization.y]),
          name: analysisVisualization.y
        }];
        break;

      case 'pie':
        plotData = [{
          type: 'pie',
          labels: data.map(d => d[analysisVisualization.x]),
          values: data.map(d => d[analysisVisualization.y]),
          hole: 0.4
        }];
        break;

      case '3d-scatter':
        plotData = [{
          type: 'scatter3d',
          mode: 'markers',
          x: data.map(d => d[analysisVisualization.x]),
          y: data.map(d => d[analysisVisualization.y]),
          z: data.map(d => d[analysisVisualization.z]),
          marker: {
            size: 5,
            opacity: 0.8
          }
        }];
        break;

      default:
        plotData = [{
          type: 'scatter',
          mode: 'markers',
          x: data.map(d => d[analysisVisualization.x]),
          y: data.map(d => d[analysisVisualization.y]),
          name: analysisVisualization.y
        }];
    }

    return {
      data: plotData,
      layout: {
        ...defaultLayout,
        title: analysisVisualization.title
      }
    };
  } catch (error) {
    console.error('Error generating visualization:', error);
    throw new Error('Failed to generate visualization');
  }
}

// Process natural language query and generate visualization
router.post('/query', async (req, res) => {
  const { message } = req.body;
  
  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // First, ask GPT to analyze the query and determine data needs
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
      analysis = JSON.parse(rawContent);

      // Validate that we have a proper query object
      if (!analysis || typeof analysis !== 'object') {
        throw new Error('Analysis must be an object');
      }

      // Ensure query is a valid MongoDB query object
      if (!analysis.query || typeof analysis.query !== 'object') {
        console.error('Invalid query format:', analysis);
        return res.status(400).json({
          error: 'Invalid query format',
          explanation: "I understand your question, but I'm having trouble formulating the database query. Could you try being more specific about what data you're looking for?"
        });
      }

      // Validate visualization format if present
      if (analysis.visualization && typeof analysis.visualization !== 'object') {
        analysis.visualization = null;
      }

    } catch (parseError) {
      console.error('Failed to parse or validate OpenAI response:', analysisCompletion.choices[0].message.content);
      return res.status(500).json({
        error: 'Failed to parse analysis',
        explanation: "I'm having trouble understanding your query. Could you try rephrasing it with specific metrics or time periods you're interested in?"
      });
    }

    // Fetch the data based on the analysis
    const data = await fetchCampaignData(analysis.query);

    if (!data || data.length === 0) {
      return res.json({
        explanation: "I couldn't find any data matching your query. Could you try rephrasing or specifying different criteria?",
        data: [],
        visualization: null
      });
    }

    // Generate the visualization
    const visualization = await generateVisualization(data, analysis.visualization);

    // Return everything the frontend needs
    res.json({
      data: data,
      visualization: visualization,
      explanation: analysis.explanation
    });

  } catch (error) {
    console.error('Error processing chat query:', error);
    res.status(500).json({
      error: 'Error processing query',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
module.exports = router;
