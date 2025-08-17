const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const Event = require('../models/campaigns');

// Initialize OpenAI with rate limiting
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Rate limiting setup
let lastRequestTime = 0;
const MIN_REQUEST_GAP = 1000; // Minimum 1 second between requests

// Model configuration - matching test script that worked 36 hours ago
const MODEL = 'gpt-4';

// Helper for rate-limited OpenAI calls
async function callOpenAI(messages) {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_GAP) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_GAP - timeSinceLastRequest));
  }
  
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: messages
  });
  lastRequestTime = Date.now();
  return completion;
}

// Read instructions and columns list once at startup
const instructions = fs.readFileSync(path.join(__dirname, '../full_funnel_instructions.txt'), 'utf8');
const columnsList = JSON.parse(fs.readFileSync(path.join(__dirname, '../full_funnel_all_columns_master_list.json'), 'utf8'));

// Helper for generating weekly summaries
async function generateWeeklySummary(startDate = new Date()) {
  const endDate = new Date(startDate);
  const startOfWeek = new Date(startDate);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const weeklyData = await Event.find({
    budgetStartDate: { $lte: endDate },
    budgetEndDate: { $gte: startOfWeek }
  }).lean();

  const prevWeekData = await Event.find({
    budgetStartDate: { $lte: startOfWeek },
    budgetEndDate: { $gte: new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000)}
  }).lean();

  // Calculate week-over-week changes
  const summary = {
    period: `${startOfWeek.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
    metrics: {
      totalSpend: weeklyData.reduce((sum, item) => sum + (item.campaignBudgetSpent || 0), 0),
      averageROI: weeklyData.reduce((sum, item) => sum + (item.budgetROI || 0), 0) / weeklyData.length,
      overBudgetCount: weeklyData.filter(item => (item.budgetVariance || 0) < 0).length
    },
    trends: {
      spendTrend: calculateTrend(weeklyData, prevWeekData, 'campaignBudgetSpent'),
      roiTrend: calculateTrend(weeklyData, prevWeekData, 'budgetROI')
    },
    topPerformers: weeklyData
      .sort((a, b) => (b.budgetROI || 0) - (a.budgetROI || 0))
      .slice(0, 3)
      .map(item => ({
        category: item.budgetCategory,
        roi: item.budgetROI,
        spent: item.campaignBudgetSpent
      }))
  };

  return summary;
}

// Helper for budget forecasting
async function generateBudgetForecast(months = 3) {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setMonth(today.getMonth() + months);

  // Get historical data for trend analysis
  const historicalData = await Event.find({
    budgetStartDate: { $lte: today },
    budgetEndDate: { $gte: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)}
  }).lean();

  // Calculate trends and patterns
  const spendingTrend = historicalData.reduce((sum, item) => sum + (item.budgetVariance || 0), 0) / historicalData.length;
  const roiTrend = historicalData.reduce((sum, item) => sum + (item.budgetROI || 0), 0) / historicalData.length;

  // Generate forecast
  const forecast = {
    period: `${today.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
    projections: {
      estimatedSpend: calculateProjectedSpend(historicalData, spendingTrend),
      projectedROI: roiTrend,
      riskAreas: identifyRiskAreas(historicalData),
      opportunities: identifyOpportunities(historicalData)
    },
    recommendations: generateRecommendations(historicalData, spendingTrend, roiTrend)
  };

  return forecast;
}

// Helper for trend calculation
function calculateTrend(currentData, previousData, metric) {
  const currentAvg = currentData.reduce((sum, item) => sum + (item[metric] || 0), 0) / currentData.length;
  const previousAvg = previousData.reduce((sum, item) => sum + (item[metric] || 0), 0) / previousData.length;
  const percentChange = ((currentAvg - previousAvg) / previousAvg) * 100;

  return {
    direction: percentChange > 0 ? 'up' : 'down',
    percentage: Math.abs(percentChange).toFixed(1),
    insight: generateTrendInsight(percentChange, metric)
  };
}

// Helper for budget calculations
async function calculateBudgetMetrics(data) {
  return data.map(item => ({
    ...item,
    budgetVariance: (item.campaignBudgetAllocated || 0) - (item.campaignBudgetSpent || 0),
    budgetROI: item.campaignBudgetSpent ? (item.totalRevenue || 0) / item.campaignBudgetSpent : 0,
    budgetROAS: item.campaignBudgetSpent ? (item.totalRevenue || 0) / item.campaignBudgetSpent : 0
  }));
}

// Helper for budget filtering
async function applyBudgetFilters(query) {
  const budgetQuery = {};

  // Handle budget range filters
  if (query.minBudget) {
    budgetQuery.campaignBudgetAllocated = { $gte: query.minBudget };
  }
  if (query.maxBudget) {
    budgetQuery.campaignBudgetAllocated = { ...budgetQuery.campaignBudgetAllocated, $lte: query.maxBudget };
  }

  // Handle budget category filters
  if (query.budgetCategory) {
    budgetQuery.budgetCategory = query.budgetCategory;
  }

  // Handle budget performance filters
  if (query.minROI) {
    budgetQuery.budgetROI = { $gte: query.minROI };
  }
  if (query.overBudget === true) {
    budgetQuery.budgetVariance = { $lt: 0 };
  }
  if (query.underBudget === true) {
    budgetQuery.budgetVariance = { $gt: 0 };
  }

  // Handle date range filters
  if (query.budgetStartDate) {
    budgetQuery.budgetStartDate = { $gte: new Date(query.budgetStartDate) };
  }
  if (query.budgetEndDate) {
    budgetQuery.budgetEndDate = { $lte: new Date(query.budgetEndDate) };
  }

  return budgetQuery;
}

// Helper to fetch campaign data
async function fetchCampaignData(query) {
  try {
    console.log('MongoDB Query:', JSON.stringify(query, null, 2));
    
    // First try a basic find to verify data access
    const basicFind = await Event.find({}).limit(1).lean();
    console.log('Basic find result:', JSON.stringify(basicFind, null, 2));
    
    // Then try the actual query
    return await Event.find(query).lean();
  } catch (error) {
    console.error('Error fetching event data:', error);
    throw new Error('Failed to fetch event data');
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
    // First, ask GPT to analyze the query and identify any needed clarifications
    const clarificationCompletion = await callOpenAI([
      {
        role: "system",
        content: `You are a friendly, helpful marketing analytics expert for Michigan United (MU). Your goal is to help users understand their campaign performance and suggest improvements, even if they're not familiar with marketing terminology.

When analyzing queries:

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
        return res.json({
          needsClarification: true,
          questions: clarification.clarificationQuestions,
          missingFields: clarification.missingFields,
          context: clarification.context,
          suggestions: clarification.suggestions || [],
          tone: "friendly"
        });
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

    // Log and fetch the data based on the analysis
    console.log('Generated MongoDB query:', JSON.stringify(analysis.query, null, 2));
    // Apply budget filters if present
    const budgetQuery = await applyBudgetFilters(analysis.query);
    const finalQuery = {
      ...analysis.query,
      ...budgetQuery
    };

    let data = await fetchCampaignData(finalQuery);

    if (!data || data.length === 0) {
      return res.json({
        explanation: "I couldn't find any data matching your query. Could you try rephrasing or specifying different criteria?",
        data: [],
        visualization: null
      });
    }

    // Generate the visualization
    const visualization = await generateVisualization(data, analysis.visualization);

    // Calculate budget metrics
    data = await calculateBudgetMetrics(data);

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
      ],
      quickActions: [
        "Show this week's priorities",
        "Compare channel performance",
        "Highlight budget risks",
        "View top performers"
      ]
    };

    // Generate weekly summary and forecast if requested
    let weeklySummary = null;
    let budgetForecast = null;

    if (analysis.query.includeWeeklySummary) {
      weeklySummary = await generateWeeklySummary();
    }

    if (analysis.query.includeForecast) {
      budgetForecast = await generateBudgetForecast();
    }

    // Return everything with manager-friendly format
    res.json({
      data: data,
      visualization: visualization,
      explanation: analysis.explanation,
      managerView: managerInsights,
      weeklySummary,
      budgetForecast
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
