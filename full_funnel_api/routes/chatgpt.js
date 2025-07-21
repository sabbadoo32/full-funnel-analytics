const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const Campaign = require('../models/Campaign');
const validateCampaign = require('../middleware/campaignValidation');

const openai = new OpenAI({
    apiKey: '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'
});

// Helper function to calculate aggregate metrics
const calculateAggregateMetrics = (campaigns) => {
    return campaigns.reduce((acc, campaign) => {
        if (campaign.emailMetrics) {
            acc.totalEmails.sent += campaign.emailMetrics.sent || 0;
            acc.totalEmails.opened += campaign.emailMetrics.opened || 0;
            acc.totalEmails.clicked += campaign.emailMetrics.clicked || 0;
            acc.totalEmails.converted += campaign.emailMetrics.converted || 0;
        }
        if (campaign.analytics) {
            acc.totalAnalytics.gaSessions += campaign.analytics.gaSessions || 0;
            acc.totalAnalytics.pageViews += campaign.analytics.pageViews || 0;
        }
        return acc;
    }, {
        totalEmails: { sent: 0, opened: 0, clicked: 0, converted: 0 },
        totalAnalytics: { gaSessions: 0, pageViews: 0 }
    });
};

// Main query endpoint with validation
router.post('/query', validateCampaign, async (req, res) => {
    const { query, filters } = req.body;
    
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        // Build MongoDB query based on filters
        const mongoQuery = {};
        if (filters) {
            if (filters.dateRange) {
                mongoQuery.eventDate = {
                    $gte: new Date(filters.dateRange.start),
                    $lte: new Date(filters.dateRange.end)
                };
            }
            if (filters.eventType) {
                mongoQuery.eventType = filters.eventType;
            }
            if (filters.city) {
                mongoQuery.city = filters.city;
            }
        }

        // Get filtered campaign data
        const campaigns = await Campaign.find(mongoQuery);

        // Calculate aggregate metrics
        const aggregateMetrics = calculateAggregateMetrics(campaigns);

        // Format the data for ChatGPT
        const formattedData = campaigns.map(campaign => ({
            eventName: campaign.eventName,
            eventDate: campaign.eventDate,
            eventType: campaign.eventType,
            location: {
                city: campaign.city,
                districts: campaign.districtInfo
            },
            emailMetrics: campaign.getEmailPerformance(),
            analytics: campaign.analytics
        }));

        // Create enhanced ChatGPT prompt
        const prompt = `Analyze the following campaign data and answer this question: ${query}

Aggregate Metrics:
${JSON.stringify(aggregateMetrics, null, 2)}

Detailed Campaign Data:
${JSON.stringify(formattedData, null, 2)}`;

        // Get response from ChatGPT with enhanced context
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are a campaign analytics expert specializing in full-funnel analysis. 
                    Focus on:
                    - Email engagement metrics and conversion rates
                    - Geographic performance patterns
                    - Event type effectiveness
                    - Web analytics correlation with campaign success
                    
                    Provide specific insights using numbers and percentages. Format response in markdown with clear sections.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        // Send enhanced response
        res.json({
            analysis: completion.choices[0].message.content,
            aggregateMetrics,
            campaigns: formattedData
        });

    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

module.exports = router;
