const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const mongoose = require('mongoose');
const validateCampaign = require('../middleware/campaignValidation');
const credentialManager = require('../helpers/credentialManager');

// Define the Campaign model schema
const campaignSchema = new mongoose.Schema({}, { strict: false, collection: 'full_funnel' });
const Campaign = mongoose.model('Campaign', campaignSchema);

// Log when the model is ready
console.log('Campaign model initialized');

// Get OpenAI credentials from credential manager
const { apiKey } = credentialManager.getOpenAICredentials();

// Initialize OpenAI client
const openai = new OpenAI({ apiKey });

// Validate OpenAI API key
if (!apiKey) {
    console.error('Error: OpenAI API key not found. Please check your environment variables.');
    // Don't exit process - allow the server to start but the OpenAI features won't work
    console.warn('Server will start but OpenAI features will not function properly.');
}

// Helper function to calculate comprehensive metrics
const calculateAggregateMetrics = (campaigns) => {
    const initialAccumulator = {
        events: { total: 0, byType: {} },
        organizations: {},
        locations: { byState: {}, byCity: {} },
        tags: {}
    };

    return campaigns.reduce((acc, campaign) => {
        // Event Metrics
        if (campaign.event_type) {
            acc.events.total++;
            acc.events.byType[campaign.event_type] = (acc.events.byType[campaign.event_type] || 0) + 1;
            
            // Organization metrics
            if (campaign.organization_name) {
                acc.organizations[campaign.organization_name] = (acc.organizations[campaign.organization_name] || 0) + 1;
            }
            
            // Location metrics
            if (campaign.state) {
                acc.locations.byState[campaign.state] = (acc.locations.byState[campaign.state] || 0) + 1;
            }
            if (campaign.city) {
                acc.locations.byCity[campaign.city] = (acc.locations.byCity[campaign.city] || 0) + 1;
            }
        }
        
        // Tags metrics
        if (campaign.tags) {
            campaign.tags.split('|').forEach(tag => {
                tag = tag.trim();
                if (tag) {
                    acc.tags[tag] = (acc.tags[tag] || 0) + 1;
                }
            });
        }
        
        return acc;
    }, initialAccumulator);
};

// Helper function to process aggregate metrics for response
const processAggregateMetrics = (rawMetrics) => {
    // Return the metrics as-is since we're already processing them in calculateAggregateMetrics
    return rawMetrics;
};

// Helper function to extract date range from natural language
const parseDateRange = (query) => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startDate = new Date(2025, 6, 1); // July 1, 2025
    const endDate = new Date(2025, 6, 31); // July 31, 2025
    
    return { startDate, endDate };
};

// Helper to analyze the type of question
const analyzeQuestion = (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Determine the type of event being asked about
    let eventType = null;
    const eventTypes = ['volunteer', 'fundraiser', 'meeting', 'rally', 'canvassing', 'phonebank', 'donation'];
    for (const type of eventTypes) {
        if (lowerQuery.includes(type)) {
            eventType = type;
            break;
        }
    }
    
    // Check for location filters
    let location = null;
    const locations = ['california', 'texas', 'new york', 'florida', 'illinois'];
    for (const loc of locations) {
        if (lowerQuery.includes(loc)) {
            location = loc;
            break;
        }
    }
    
    // Check for organization filters
    let organization = null;
    const organizations = ['democrat', 'republican', 'independent', 'green', 'libertarian'];
    for (const org of organizations) {
        if (lowerQuery.includes(org)) {
            organization = org;
            break;
        }
    }
    
    // Check for metrics of interest
    const metrics = {
        count: lowerQuery.includes('how many') || lowerQuery.includes('total') || !lowerQuery.includes('list'),
        list: lowerQuery.includes('list') || lowerQuery.includes('show me'),
        byType: lowerQuery.includes('by type') || lowerQuery.includes('types of'),
        byLocation: lowerQuery.includes('by location') || lowerQuery.includes('where') || !!location,
        byOrganization: lowerQuery.includes('by organization') || lowerQuery.includes('who') || !!organization,
        byDate: lowerQuery.includes('by date') || lowerQuery.includes('when') || lowerQuery.includes('schedule')
    };
    
    // Determine comparison type
    const isBest = lowerQuery.includes('best') || lowerQuery.includes('top') || lowerQuery.includes('most');
    const isWorst = lowerQuery.includes('worst') || lowerQuery.includes('lowest') || lowerQuery.includes('least');
    
    return {
        eventType,
        location,
        organization,
        metrics,
        comparison: {
            best: isBest,
            worst: isWorst,
            average: lowerQuery.includes('average') || (!isBest && !isWorst)
        },
        dateRange: parseDateRange(query)
    };
};

// Main query endpoint with natural language processing
router.post('/query', async (req, res) => {
    const { query } = req.body;
    
    try {
        if (!Campaign) {
            return res.status(503).json({ error: 'Database connection not ready' });
        }

        // Analyze the natural language query
        const analysis = analyzeQuestion(query);
        
        // Build MongoDB query based on analysis
        const mongoQuery = {};
        
        // Add date range filtering if specified
        if (analysis.dateRange) {
            mongoQuery.timeslot_start = {
                $gte: analysis.dateRange.startDate,
                $lte: analysis.dateRange.endDate
            };
        }

        // Add event type filtering if specified
        if (analysis.eventType) {
            mongoQuery.event_type = { $regex: analysis.eventType, $options: 'i' };
        }
        
        // Add location filtering if specified
        if (analysis.location) {
            mongoQuery.$or = [
                { state: { $regex: analysis.location, $options: 'i' } },
                { city: { $regex: analysis.location, $options: 'i' } }
            ];
        }
        
        // Add organization filtering if specified
        if (analysis.organization) {
            mongoQuery.organization_name = { $regex: analysis.organization, $options: 'i' };
        }

        // Execute the query with a reasonable limit
        console.log('Executing MongoDB query:', JSON.stringify(mongoQuery, null, 2));
        let campaigns = [];
        try {
            campaigns = await Campaign.find(mongoQuery).limit(5000).lean().exec();
            console.log(`Found ${campaigns.length} campaigns`);
            if (campaigns.length > 0) {
                console.log('Sample campaign:', JSON.stringify(campaigns[0], null, 2));
            }
        } catch (error) {
            console.error('Error executing MongoDB query:', error);
            return res.status(500).json({
                error: 'Error querying the database',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        const totalEvents = campaigns.length;
        if (totalEvents === 0) {
            return res.status(200).json({
                message: `No events found${analysis.eventType ? ` for event type '${analysis.eventType}'` : ''}${analysis.location ? ` in ${analysis.location}` : ''}${analysis.dateRange ? ` from ${analysis.dateRange.startDate.toLocaleDateString()} to ${analysis.dateRange.endDate.toLocaleDateString()}` : ''}.`,
                suggestions: [
                    'Try a different date range',
                    'Check your spelling or try a different location',
                    'Try a broader search term'
                ]
            });
        }

        // Process the campaigns data
        const metrics = calculateAggregateMetrics(campaigns);
        
        // Prepare the response object
        const response = {
            summary: [],
            dateRange: analysis.dateRange ? {
                start: analysis.dateRange.startDate.toLocaleDateString(),
                end: analysis.dateRange.endDate.toLocaleDateString(),
                days: Math.ceil((analysis.dateRange.endDate - analysis.dateRange.startDate) / (1000 * 60 * 60 * 24))
            } : { start: 'N/A', end: 'N/A', days: 0 },
            metrics: {},
            insights: [],
            suggestions: [
                'Try asking about specific event types',
                'Filter by location or organization',
                'Request a breakdown by date range'
            ]
        };
        
        // Process metrics based on analysis
        processEventMetrics(response, campaigns, analysis);

        function getMostCommonValue(items, field) {
            const counts = {};
            let maxCount = 0;
            let mostCommon = 'N/A';
            
            items.forEach(item => {
                const value = item[field];
                if (value) {
                    counts[value] = (counts[value] || 0) + 1;
                    if (counts[value] > maxCount) {
                        maxCount = counts[value];
                        mostCommon = value;
                    }
                }
            });
            
            return mostCommon;
        }
        
        // Process the event metrics and add relevant suggestions
        response.suggestions = getSuggestions('events');
        
        // Add comparison insights if applicable
        if (analysis.comparison.best || analysis.comparison.worst) {
            const comparisonType = analysis.comparison.best ? 'best' : 'worst';
            response.insights.push(
                `Showing ${comparisonType} performing events based on your criteria`
            );
        }
        
        // Return the final response
        return res.json(response);
    } catch (error) {
        console.error('Error processing query:', error);
        return res.status(500).json({
            error: 'An error occurred while processing your request',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Helper function to generate summary based on metrics
function generateSummary(metrics, analysis) {
    if (analysis.dataType === 'email') {
        return `The average open rate was ${metrics.openRate?.average || 'N/A'}.`;
    } else if (analysis.dataType === 'social') {
        return `Average engagement rate was ${metrics.engagementRate?.average || 'N/A'}.`;
    } else if (analysis.dataType === 'web') {
        return `Average sessions per day: ${metrics.sessions?.average || 'N/A'}.`;
    } else if (analysis.dataType === 'ad') {
        return `Average ROAS: ${metrics.roas?.average || 'N/A'}.`;
    } else if (analysis.dataType === 'events') {
        return `Found ${metrics.events.total} events across ${Object.keys(metrics.events.byType).length} event types.`;
    }
    return `Found ${metrics.count} items across ${metrics.types?.length || 1} categories.`;
}

// Helper function to get relevant suggestions
function getSuggestions(dataType) {
    const suggestions = {
        email: [
            'Try A/B testing different subject lines',
            'Experiment with sending at different times',
            'Segment your audience for better targeting'
        ],
        social: [
            'Post at optimal times for your audience',
            'Try different content formats (videos, images, polls)',
            'Engage with comments to boost visibility'
        ],
        web: [
            'Improve page load speed',
            'Enhance mobile responsiveness',
            'Add clear call-to-actions'
        ],
        ad: [
            'Refine your target audience',
            'Test different ad creatives',
            'Adjust bidding strategy'
        ],
        events: [
            'Check for tracking issues',
            'Consider testing different approaches',
            'Review your campaign settings'
        ]
    };
    return suggestions[dataType] || [
        'Review your campaign settings',
        'Check for tracking issues',
        'Consider testing different approaches'
    ];
}

// Process event-specific metrics
function processEventMetrics(response, campaigns, analysis) {
    const metrics = calculateAggregateMetrics(campaigns);
    
    // Get top event types
    const topEventTypes = Object.entries(metrics.events.byType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .reduce((obj, [k, v]) => ({...obj, [k]: v}), {});
    
    // Get top organizations
    const topOrganizations = Object.entries(metrics.organizations)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .reduce((obj, [k, v]) => ({...obj, [k]: v}), {});
    
    // Get top locations
    const topStates = Object.entries(metrics.locations.byState)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .reduce((obj, [k, v]) => ({...obj, [k]: v}), {});
    
    const topCities = Object.entries(metrics.locations.byCity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((obj, [k, v]) => ({...obj, [k]: v}), {});
    
    // Get top tags
    const topTags = Object.entries(metrics.tags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((obj, [k, v]) => ({...obj, [k]: v}), {});
    
    // Add event metrics to response
    response.metrics = {
        events: {
            total: metrics.events.total,
            byType: topEventTypes,
            topOrganizations,
            topTags
        },
        locations: {
            byState: topStates,
            byCity: topCities
        }
    };
    
    // Add summary based on analysis
    const summaryItems = [
        {
            type: 'events',
            title: 'Total Events',
            value: metrics.events.total
        },
        {
            type: 'event_types',
            title: 'Event Types',
            value: Object.keys(metrics.events.byType).length
        },
        {
            type: 'top_organization',
            title: 'Top Organization',
            value: Object.keys(topOrganizations)[0] || 'N/A'
        },
        {
            type: 'top_location',
            title: 'Top Location',
            value: Object.keys(topStates)[0] || 'N/A'
        }
    ];
    
    // Add filtered summaries based on analysis
    if (analysis.eventType) {
        summaryItems.push({
            type: 'filtered_events',
            title: `${analysis.eventType} Events`,
            value: metrics.events.byType[analysis.eventType] || 0
        });
    }
    
    if (analysis.location) {
        const locationCount = metrics.locations.byState[analysis.location] || 
                            metrics.locations.byCity[analysis.location] || 0;
        summaryItems.push({
            type: 'location_events',
            title: `Events in ${analysis.location}`,
            value: locationCount
        });
    }
    
    response.summary = [...(response.summary || []), ...summaryItems];
}

// Process social media metrics
function processSocialMetrics(response, campaigns, analysis) {
    const engagementRates = campaigns.map(c => c.metrics?.engagementRate || 0);
    
    response.metrics = {
        engagementRate: calculateRateMetrics(engagementRates, 'engagement rate'),
        totalReactions: campaigns.reduce((sum, c) => sum + (c.metrics?.reactions || 0), 0),
        totalShares: campaigns.reduce((sum, c) => sum + (c.metrics?.shares || 0), 0)
    };
    
    if (analysis.comparison.best || analysis.comparison.worst) {
        const index = analysis.comparison.worst ? campaigns.length - 1 : 0;
        const campaign = campaigns[index];
        response.insights.highlightedPost = {
            name: campaign.name,
            date: campaign.eventDate.toLocaleDateString(),
            engagementRate: (campaign.metrics?.engagementRate * 100).toFixed(1) + '%',
            reactions: campaign.metrics?.reactions || 0,
            shares: campaign.metrics?.shares || 0
        };
    }
}

// Process web analytics metrics
function processWebMetrics(response, campaigns, analysis) {
    const sessions = campaigns.map(c => c.metrics?.sessions || 0);
    const pageViews = campaigns.map(c => c.metrics?.pageViews || 0);
    
    response.metrics = {
        sessions: calculateNumericMetrics(sessions, 'sessions'),
        pageViews: calculateNumericMetrics(pageViews, 'page views'),
        avgSessionDuration: calculateNumericMetrics(
            campaigns.map(c => c.metrics?.avgSessionDuration || 0),
            'avg session duration',
            true
        )
    };
}

// Process advertising metrics
function processAdMetrics(response, campaigns, analysis) {
    const roas = campaigns.map(c => c.metrics?.roas || 0);
    const ctr = campaigns.map(c => c.metrics?.ctr || 0);
    
    response.metrics = {
        roas: calculateNumericMetrics(roas, 'ROAS'),
        ctr: calculateRateMetrics(ctr, 'CTR'),
        totalSpend: campaigns.reduce((sum, c) => sum + (c.metrics?.spend || 0), 0).toFixed(2)
    };
}

// Helper to calculate rate metrics (0-1 scale)
function calculateRateMetrics(values, label) {
    if (!values.length) return { average: 'N/A' };
    
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    
    return {
        average: (avg * 100).toFixed(1) + '%',
        min: (Math.min(...values) * 100).toFixed(1) + '%',
        max: (Math.max(...values) * 100).toFixed(1) + '%',
        label
    };
}

// Helper to calculate numeric metrics
function calculateNumericMetrics(values, label, isTime = false) {
    if (!values.length) return { average: 'N/A' };
    
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    
    return {
        average: isTime ? formatTime(avg) : Math.round(avg).toLocaleString(),
        min: isTime ? formatTime(Math.min(...values)) : Math.min(...values).toLocaleString(),
        max: isTime ? formatTime(Math.max(...values)) : Math.max(...values).toLocaleString(),
        label
    };
}

// Helper to format time in minutes:seconds
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = router;
