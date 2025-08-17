const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const Campaign = require('../models/Campaign');
const validateCampaign = require('../middleware/campaignValidation');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Helper function to calculate comprehensive metrics
const calculateAggregateMetrics = (campaigns) => {
    return campaigns.reduce((acc, campaign) => {
        // Email Metrics
        if (campaign.emailCampaign?.metrics) {
            const metrics = campaign.emailCampaign.metrics;
            acc.email.sent += metrics.sent || 0;
            acc.email.opened += metrics.opened || 0;
            acc.email.clicked += metrics.clicked || 0;
            acc.email.converted += metrics.converted || 0;
            acc.email.bounced += metrics.bounced || 0;
            acc.email.unsubscribed += metrics.unsubscribed || 0;
        }

        // Web Analytics
        if (campaign.webAnalytics) {
            acc.web.sessions += campaign.webAnalytics.sessions || 0;
            acc.web.activeUsers += campaign.webAnalytics.activeUsers || 0;
            acc.web.newUsers += campaign.webAnalytics.newUsers || 0;
            acc.web.pageViews += campaign.webAnalytics.pageViews || 0;
            acc.web.keyEvents += campaign.webAnalytics.keyEvents || 0;
        }

        // Social Media
        if (campaign.socialMedia?.engagement) {
            acc.social.reactions += campaign.socialMedia.engagement.reactions || 0;
            acc.social.comments += campaign.socialMedia.engagement.comments || 0;
            acc.social.shares += campaign.socialMedia.engagement.shares || 0;
        }

        // Advertising
        if (campaign.advertising) {
            acc.advertising.impressions += campaign.advertising.adImpressions || 0;
            acc.advertising.clicks += campaign.advertising.clicks?.total || 0;
            acc.advertising.reach += campaign.advertising.reach || 0;
            acc.advertising.earnings += campaign.advertising.estimatedEarningsUSD || 0;
        }

        // Demographics
        if (campaign.demographics) {
            // Count unique demographic values
            if (campaign.demographics.ethnicity) acc.demographics.ethnicities.add(campaign.demographics.ethnicity);
            if (campaign.demographics.language) acc.demographics.languages.add(campaign.demographics.language);
            if (campaign.demographics.race) acc.demographics.races.add(campaign.demographics.race);
            if (campaign.demographics.gender) acc.demographics.genders.add(campaign.demographics.gender);
        }

        // Revenue
        if (campaign.revenue) {
            acc.revenue.total += campaign.revenue.total || 0;
            if (campaign.revenue.roas) acc.revenue.roasValues.push(campaign.revenue.roas);
        }

        return acc;
    }, {
        email: { sent: 0, opened: 0, clicked: 0, converted: 0, bounced: 0, unsubscribed: 0 },
        web: { sessions: 0, activeUsers: 0, newUsers: 0, pageViews: 0, keyEvents: 0 },
        social: { reactions: 0, comments: 0, shares: 0 },
        advertising: { impressions: 0, clicks: 0, reach: 0, earnings: 0 },
        demographics: { 
            ethnicities: new Set(),
            languages: new Set(),
            races: new Set(),
            genders: new Set()
        },
        revenue: { total: 0, roasValues: [] }
    });
};

// Helper function to process aggregate metrics for response
const processAggregateMetrics = (rawMetrics) => {
    const { demographics, revenue, ...metrics } = rawMetrics;
    
    // Convert Sets to arrays and calculate averages
    return {
        ...metrics,
        demographics: {
            ethnicities: Array.from(demographics.ethnicities),
            languages: Array.from(demographics.languages),
            races: Array.from(demographics.races),
            genders: Array.from(demographics.genders)
        },
        revenue: {
            total: revenue.total,
            averageRoas: revenue.roasValues.length ? 
                (revenue.roasValues.reduce((a, b) => a + b, 0) / revenue.roasValues.length).toFixed(2) : 0
        }
    };
};

// Main query endpoint with validation
router.post('/query', validateCampaign, async (req, res) => {
    const { query, filters } = req.body;
    
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        // Build flexible MongoDB aggregation pipeline
        const pipeline = [];

        // Match stage for basic filtering
        if (filters) {
            const matchStage = {};
            if (filters.dateRange) {
                matchStage.eventDate = {
                    $gte: new Date(filters.dateRange.start),
                    $lte: new Date(filters.dateRange.end)
                };
            }
            if (filters.eventType) matchStage.eventType = filters.eventType;
            if (filters.city) matchStage.city = filters.city;
            if (filters.demographics) {
                Object.entries(filters.demographics).forEach(([key, value]) => {
                    if (value) matchStage[`demographics.${key}`] = value;
                });
            }
            if (Object.keys(matchStage).length > 0) {
                pipeline.push({ $match: matchStage });
            }
        }

        // Add lookup stages for any referenced collections
        // (if we add more collections in the future)

        // Get campaign data with flexible aggregation
        const campaigns = await Campaign.aggregate(pipeline);

        // Calculate and process aggregate metrics
        const rawMetrics = calculateAggregateMetrics(campaigns);
        const aggregateMetrics = processAggregateMetrics(rawMetrics);

        // Format the data for ChatGPT with all available metrics
        const formattedData = campaigns.map(campaign => ({
            basic: {
                eventName: campaign.eventName,
                eventDate: campaign.eventDate,
                eventType: campaign.eventType,
                status: campaign.status,
                role: campaign.role
            },
            location: {
                city: campaign.city,
                districts: campaign.districtInfo
            },
            demographics: campaign.demographics,
            email: campaign.getEmailPerformance(),
            social: campaign.getSocialEngagement(),
            advertising: campaign.getAdPerformance(),
            analytics: campaign.getAnalyticsOverview(),
            mobilize: campaign.getEmailToMobilizeMetrics(),
            revenue: campaign.revenue
        }));

        // Calculate email-to-mobilize aggregate metrics
        const emailToMobilizeStats = campaigns.reduce((acc, campaign) => {
            const mobilizeMetrics = campaign.getEmailToMobilizeMetrics();
            if (!mobilizeMetrics) return acc;

            // Track which email subjects led to signups
            const subjectLine = campaign.emailCampaign?.subjectLine;
            if (subjectLine && mobilizeMetrics.metrics.totalSignups > 0) {
                if (!acc.emailPerformance[subjectLine]) {
                    acc.emailPerformance[subjectLine] = {
                        signups: 0,
                        attendees: 0,
                        sent: 0,
                        opened: 0,
                        clicked: 0
                    };
                }
                const stats = acc.emailPerformance[subjectLine];
                stats.signups += mobilizeMetrics.metrics.totalSignups;
                stats.attendees += mobilizeMetrics.metrics.actualAttendees;
                stats.sent += campaign.emailCampaign.metrics.sent;
                stats.opened += campaign.emailCampaign.metrics.opened;
                stats.clicked += campaign.emailCampaign.metrics.clicked;
            }

            // Track conversion funnel
            acc.totalSignups += mobilizeMetrics.metrics.totalSignups;
            acc.totalAttendees += mobilizeMetrics.metrics.actualAttendees;
            if (mobilizeMetrics.conversionPath?.timeToConversion) {
                acc.conversionTimes.push(mobilizeMetrics.conversionPath.timeToConversion);
            }

            return acc;
        }, {
            emailPerformance: {},
            totalSignups: 0,
            totalAttendees: 0,
            conversionTimes: []
        });

        // Add email-to-mobilize stats to aggregate metrics
        aggregateMetrics.emailToMobilize = {
            ...emailToMobilizeStats,
            avgConversionTime: emailToMobilizeStats.conversionTimes.length ?
                (emailToMobilizeStats.conversionTimes.reduce((a, b) => a + b, 0) / 
                 emailToMobilizeStats.conversionTimes.length).toFixed(2) : null
        };

        // Create enhanced ChatGPT prompt with comprehensive context
        const prompt = `Analyze the following campaign data and answer this question: ${query}

Aggregate Metrics:
${JSON.stringify(aggregateMetrics, null, 2)}

Detailed Campaign Data:
${JSON.stringify(formattedData, null, 2)}`;

        // Get response from ChatGPT with enhanced context and capabilities
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are a campaign analytics expert with full access to MongoDB campaign data.
                    Your role is to analyze ANY aspect of the data that the user asks about.
                    
                    You can explore relationships between ANY fields in the data, such as:
                    - How social media engagement affects email conversions
                    - Which demographics respond best to different channel types
                    - How ad performance correlates with Mobilize signups
                    - What patterns exist across geographic regions and event types
                    - How different channels (email, social, ads, p2p) influence each other
                    
                    Structure your response in exactly three sections:

                    # Section 1: Key Findings and Recommendations
                    - Clear, direct answer to the user's question
                    - Most important insights from the data
                    - Actionable recommendations based on the analysis
                    - Use bullet points for clarity
                    
                    # Section 2: Data Sources and Citations
                    - List all data sources used in the analysis
                    - For each metric cited, include:
                      * Exact value and source (e.g., "email.openRate: 25.3% from campaign.emailCampaign.metrics")
                      * Time period or scope of the data
                      * Any data quality notes or limitations
                    - Explain why these specific data points were chosen
                    - Note any relevant data that was unavailable or insufficient
                    
                    # Section 3: Analysis Methodology
                    - Show your step-by-step analytical process
                    - Explain your reasoning for each analytical choice
                    - Detail any calculations or transformations performed
                    - Discuss alternative approaches considered
                    - Highlight any assumptions made
                    - Explain how you validated your findings
                    
                    Remember:
                    1. ANY field can be compared with ANY other field
                    2. Users can ask ANY question about the data
                    3. Always use precise numbers and percentages
                    4. Always explain your methodology
                    5. If data is missing or insufficient, say so
                    6. Every insight must be supported by specific data points
                    7. Explain WHY you chose certain metrics over others`
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        // Send enhanced response with all metrics
        res.json({
            analysis: completion.choices[0].message.content,
            metrics: {
                aggregate: aggregateMetrics,
                campaigns: formattedData
            }
        });

    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

module.exports = router;
