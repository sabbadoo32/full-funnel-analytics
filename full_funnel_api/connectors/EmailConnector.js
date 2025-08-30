const mongoose = require('mongoose');
const BaseConnector = require('./BaseConnector');
const { 
  getEmailMetrics, 
  getEmailToMobilizeMetrics,
  getPerformanceTier,
  getIndustryBenchmark,
  getKeyStrengths,
  getImprovementAreas
} = require('../helpers/emailAnalytics');

// Constants for performance tiers
const PERFORMANCE_TIERS = {
  EXCELLENT: { minScore: 80, label: 'Excellent' },
  GOOD: { minScore: 60, label: 'Good' },
  AVERAGE: { minScore: 40, label: 'Average' },
  NEEDS_IMPROVEMENT: { minScore: 0, label: 'Needs Improvement' }
};

// Industry benchmarks for comparison
const INDUSTRY_BENCHMARKS = {
  openRate: 0.21, // 21%
  clickRate: 0.03, // 3%
  clickToOpenRate: 0.14, // 14%
  bounceRate: 0.01, // 1%
  unsubscribeRate: 0.002, // 0.2%
  spamRate: 0.001 // 0.1%
};

class EmailConnector extends BaseConnector {
    constructor() {
        super();
        this.collection = 'full_funnel';
        this.requiredFields = [
            'Emails Sent', 'Opened', 'Clicked', 'Converted', 'Bounced', 
            'Unsubscribed', 'Spam Reports', 'Forwards', 'Avg. Time to Open', 
            'Avg. Time to Click', 'Unique Clicks', 'Desktop Opens', 
            'Mobile Opens', 'Webmail Opens', 'Top Email Client', 
            'Mobilize RSVPs', 'Subject Line', 'Campaign Name', 'Send Time'
        ];
    }

    /**
     * Query email campaign data
     * @param {Object} filters - Filters for the query
     * @returns {Promise<Array>} - Array of email campaign documents
     */
    async query(filters = {}) {
        try {
            const query = { 
                ...filters,
                // Ensure we're only getting email campaign data
                'Event Type': { $exists: true, $ne: null }
            };

            const Campaign = mongoose.model('Campaign');
            return await Campaign.find(query)
                .select(this.requiredFields.join(' '))
                .lean()
                .exec();
        } catch (error) {
            console.error('Error querying email data:', error);
            throw new Error('Failed to fetch email campaign data');
        }
    }

    /**
     * Get email campaign metrics
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} - Email campaign metrics
     */
    /**
     * Calculate campaign performance metrics
     */
    async getMetrics(query = {}) {
        try {
            const campaigns = await this.query(query);
            if (!campaigns?.length) {
                return this.formatEmptyResponse();
            }

            // Process each campaign with enhanced metrics
            const processedCampaigns = campaigns.map(campaign => {
                try {
                    const emailMetrics = getEmailMetrics(campaign);
                    const mobilizeMetrics = campaign['Mobilize RSVPs'] ? 
                        getEmailToMobilizeMetrics(campaign) : null;
                    
                    return {
                        ...campaign,
                        metrics: {
                            ...emailMetrics,
                            ...(mobilizeMetrics && { mobilize: mobilizeMetrics }),
                            timestamp: new Date().toISOString()
                        }
                    };
                } catch (error) {
                    console.error('Error processing campaign:', campaign['Campaign Name'], error);
                    return null;
                }
            }).filter(Boolean); // Remove any failed campaigns

            if (processedCampaigns.length === 0) {
                throw new Error('No valid campaigns found after processing');
            }

            // Calculate aggregate metrics
            const aggregateMetrics = this.calculateAggregateMetrics(processedCampaigns);
            const performanceScore = this.calculateOverallPerformanceScore(processedCampaigns);
            const performanceTier = getPerformanceTier(performanceScore);

            // Generate insights and recommendations
            const insights = this.generateInsights(processedCampaigns, aggregateMetrics);
            const suggestions = this.generateSuggestions(aggregateMetrics);

            return this.formatResponse({
                success: true,
                total: processedCampaigns.length,
                metrics: {
                    ...aggregateMetrics,
                    performance: {
                        score: performanceScore,
                        tier: performanceTier,
                        distribution: this.calculatePerformanceDistribution(processedCampaigns),
                        industryBenchmark: getIndustryBenchmark('email'),
                        keyStrengths: getKeyStrengths(aggregateMetrics),
                        improvementAreas: getImprovementAreas(aggregateMetrics)
                    },
                    insights,
                    suggestions,
                    timestamp: new Date().toISOString()
                },
                campaigns: processedCampaigns
            });

            // Get metrics for each campaign
            const campaignMetrics = campaigns.map(campaign => ({
                ...campaign,
                metrics: getEmailMetrics(campaign),
                mobilizeMetrics: getEmailToMobilizeMetrics(campaign)
            }));

            // Aggregate metrics
            const aggregatedMetrics = this.aggregateMetrics(campaignMetrics);

            return {
                total: campaigns.length,
                campaigns: campaignMetrics,
                aggregated: aggregatedMetrics,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting email metrics:', error);
            throw new Error('Failed to calculate email metrics');
        }
    }

    /**
     * Format response for API
     * @param {Object} data - Raw data to format
     * @returns {Object} - Formatted response
     */
    // Helper method to aggregate metrics across campaigns
    aggregateMetrics(campaignMetrics) {
        if (!campaignMetrics.length) return {};

        // Sum all metrics
        const aggregated = campaignMetrics.reduce((acc, { metrics }) => {
            Object.entries(metrics).forEach(([key, value]) => {
                if (typeof value === 'number') {
                    acc[key] = (acc[key] || 0) + value;
                } else if (key === 'rates') {
                    acc.rates = acc.rates || {};
                    Object.entries(value).forEach(([rateKey, rateValue]) => {
                        acc.rates[rateKey] = (acc.rates[rateKey] || 0) + rateValue;
                    });
                }
            });
            return acc;
        }, {});

        // Calculate averages for rates
        if (aggregated.rates) {
            Object.keys(aggregated.rates).forEach(key => {
                aggregated.rates[key] = aggregated.rates[key] / campaignMetrics.length;
            });
        }

        return aggregated;
    }

    // Format empty response
    formatEmptyResponse() {
        return {
            success: true,
            type: 'email',
            total: 0,
            campaigns: [],
            metrics: {
                overview: {
                    totals: {
                        sent: 0,
                        delivered: 0,
                        opens: 0,
                        clicks: 0,
                        conversions: 0,
                        bounces: 0,
                        unsubscribes: 0,
                        spamReports: 0
                    },
                    rates: {
                        openRate: 0,
                        clickRate: 0,
                        clickToOpenRate: 0,
                        conversionRate: 0,
                        bounceRate: 0,
                        unsubscribeRate: 0,
                        spamRate: 0,
                        forwardRate: 0
                    },
                    benchmarkComparison: {}
                },
                performance: {
                    score: 0,
                    tier: 'Needs Improvement',
                    distribution: {},
                    industryBenchmark: getIndustryBenchmark('email'),
                    keyStrengths: [],
                    improvementAreas: []
                },
                insights: [],
                suggestions: [],
                timestamps: {
                    dataStart: null,
                    dataEnd: null,
                    processedAt: new Date().toISOString()
                }
            },
            _metadata: {
                version: '1.0.0',
                processedCount: 0,
                hasMobilizeData: false
            }
        };
    }

    /**
     * Generate suggestions based on email metrics
     * @param {Object} metrics - Email metrics
     * @returns {Array} - List of suggestions
     */
    /**
     * Generate suggestions based on email metrics
     */
    generateSuggestions(metrics) {
        const suggestions = [];
        
        if (metrics.rates.bounceRate > INDUSTRY_BENCHMARKS.bounceRate) {
            suggestions.push('High bounce rate detected. Consider cleaning your email list and removing invalid addresses.');
        }
        
        if (metrics.rates.unsubscribeRate > INDUSTRY_BENCHMARKS.unsubscribeRate) {
            suggestions.push('Higher than average unsubscribe rate. Review your email frequency and content relevance.');
        }
        
        if (metrics.rates.spamRate > INDUSTRY_BENCHMARKS.spamRate) {
            suggestions.push('Spam complaints are above average. Ensure your emails comply with anti-spam regulations.');
        }
        
        if (metrics.rates.openRate < INDUSTRY_BENCHMARKS.openRate) {
            suggestions.push('Try A/B testing different subject lines and preheader text to improve open rates.');
        }
        
        if (metrics.rates.clickRate < INDUSTRY_BENCHMARKS.clickRate) {
            suggestions.push('Consider improving your call-to-action buttons and links to boost click-through rates.');
        }
        
        return suggestions.length ? suggestions : ['Your email metrics are looking good!'];
    }
    
    /**
     * Calculate aggregate metrics from processed campaigns
     */
    calculateAggregateMetrics(campaigns) {
        if (!campaigns?.length) return {};

        const totals = campaigns.reduce((acc, campaign) => {
            const m = campaign.metrics;
            return {
                totalSent: acc.totalSent + (m.totalSent || 0),
                totalOpens: acc.totalOpens + (m.totalOpens || 0),
                totalClicks: acc.totalClicks + (m.totalClicks || 0),
                totalConversions: acc.totalConversions + (m.totalConversions || 0),
                totalBounces: acc.totalBounces + (m.totalBounces || 0),
                totalUnsubscribes: acc.totalUnsubscribes + (m.totalUnsubscribes || 0),
                totalSpamReports: acc.totalSpamReports + (m.totalSpamReports || 0),
                totalForwards: acc.totalForwards + (m.totalForwards || 0)
            };
        }, {
            totalSent: 0,
            totalOpens: 0,
            totalClicks: 0,
            totalConversions: 0,
            totalBounces: 0,
            totalUnsubscribes: 0,
            totalSpamReports: 0,
            totalForwards: 0
        });

        // Calculate rates
        const rates = {
            openRate: totals.totalSent > 0 ? totals.totalOpens / totals.totalSent : 0,
            clickRate: totals.totalSent > 0 ? totals.totalClicks / totals.totalSent : 0,
            clickToOpenRate: totals.totalOpens > 0 ? totals.totalClicks / totals.totalOpens : 0,
            conversionRate: totals.totalClicks > 0 ? totals.totalConversions / totals.totalClicks : 0,
            bounceRate: totals.totalSent > 0 ? totals.totalBounces / totals.totalSent : 0,
            unsubscribeRate: totals.totalSent > 0 ? totals.totalUnsubscribes / totals.totalSent : 0,
            spamRate: totals.totalSent > 0 ? totals.totalSpamReports / totals.totalSent : 0,
            forwardRate: totals.totalOpens > 0 ? totals.totalForwards / totals.totalOpens : 0
        };

        return { ...totals, rates };
    }

    /**
     * Calculate overall performance score across all campaigns
     */
    calculateOverallPerformanceScore(campaigns) {
        if (!campaigns?.length) return 0;
        const totalScore = campaigns.reduce((sum, campaign) => 
            sum + (campaign.metrics?.performance?.score || 0), 0);
        return Math.round((totalScore / campaigns.length) * 10) / 10; // Round to 1 decimal
    }

    /**
     * Calculate performance distribution by tier
     */
    calculatePerformanceDistribution(campaigns) {
        const distribution = {
            [PERFORMANCE_TIERS.EXCELLENT.label]: 0,
            [PERFORMANCE_TIERS.GOOD.label]: 0,
            [PERFORMANCE_TIERS.AVERAGE.label]: 0,
            [PERFORMANCE_TIERS.NEEDS_IMPROVEMENT.label]: 0
        };

        campaigns.forEach(campaign => {
            const tier = campaign.metrics?.performance?.tier || PERFORMANCE_TIERS.NEEDS_IMPROVEMENT.label;
            distribution[tier] = (distribution[tier] || 0) + 1;
        });

        // Convert to percentages
        const total = campaigns.length || 1;
        return Object.fromEntries(
            Object.entries(distribution).map(([tier, count]) => [
                tier,
                Math.round((count / total) * 100)
            ])
        );
    }

    /**
     * Calculate benchmark comparison metrics
     */
    calculateBenchmarkComparison(rates = {}) {
        return {
            openRate: this.calculateDelta(rates.openRate, INDUSTRY_BENCHMARKS.openRate, true),
            clickRate: this.calculateDelta(rates.clickRate, INDUSTRY_BENCHMARKS.clickRate, true),
            clickToOpenRate: this.calculateDelta(rates.clickToOpenRate || 0, INDUSTRY_BENCHMARKS.clickToOpenRate, true),
            bounceRate: this.calculateDelta(rates.bounceRate || 0, INDUSTRY_BENCHMARKS.bounceRate, false),
            unsubscribeRate: this.calculateDelta(rates.unsubscribeRate || 0, INDUSTRY_BENCHMARKS.unsubscribeRate, false),
            spamRate: this.calculateDelta(rates.spamRate || 0, INDUSTRY_BENCHMARKS.spamRate, false)
        };
    }

    /**
     * Calculate delta between value and benchmark
     */
    calculateDelta(value, benchmark, higherIsBetter = true) {
        if (benchmark === undefined || benchmark === null) {
            return { value, benchmark: 0, delta: 0, isPositive: false };
        }
        const delta = value - benchmark;
        return {
            value,
            benchmark,
            delta: benchmark !== 0 ? (delta / benchmark) * 100 : 0,
            isPositive: higherIsBetter ? delta >= 0 : delta <= 0
        };
    }

    /**
     * Get earliest campaign date
     */
    getEarliestCampaignDate(campaigns) {
        if (!campaigns?.length) return null;
        const dates = campaigns
            .map(c => new Date(c['Send Time'] || c['Created Time'] || new Date()))
            .filter(d => !isNaN(d.getTime()));
        return dates.length ? new Date(Math.min(...dates)).toISOString() : null;
    }

    /**
     * Get latest campaign date
     */
    getLatestCampaignDate(campaigns) {
        if (!campaigns?.length) return null;
        const dates = campaigns
            .map(c => new Date(c['Send Time'] || c['Created Time'] || new Date(0)))
            .filter(d => !isNaN(d.getTime()));
        return dates.length ? new Date(Math.max(...dates)).toISOString() : null;
    }

    /**
     * Generate insights from campaign data
     */
    generateInsights(campaigns, metrics) {
        const insights = [];
        
        // Check performance against benchmarks
        if (metrics.rates.openRate > INDUSTRY_BENCHMARKS.openRate) {
            insights.push('Your open rate is above industry average. Keep up the engaging subject lines!');
        } else {
            insights.push('Consider A/B testing different subject lines to improve open rates.');
        }
        
        if (metrics.rates.clickRate > INDUSTRY_BENCHMARKS.clickRate) {
            insights.push('Great job! Your click-through rate is above industry average.');
        } else {
            insights.push('Try improving your call-to-action buttons and links to boost click-through rates.');
        }
        
        if (metrics.rates.bounceRate < INDUSTRY_BENCHMARKS.bounceRate) {
            insights.push('Your bounce rate is lower than industry average, indicating a clean email list.');
        }
        
        if (metrics.rates.unsubscribeRate < INDUSTRY_BENCHMARKS.unsubscribeRate * 0.5) {
            insights.push('Your unsubscribe rate is very low, showing strong audience engagement.');
        }
        
        // Add time-based insights if we have enough data
        if (campaigns.length > 1) {
            const sortedCampaigns = [...campaigns].sort((a, b) => 
                new Date(a['Send Time'] || 0) - new Date(b['Send Time'] || 0)
            );
            
            const firstCampaign = sortedCampaigns[0];
            const lastCampaign = sortedCampaigns[sortedCampaigns.length - 1];
            
            if (lastCampaign.metrics.rates.openRate > firstCampaign.metrics.rates.openRate) {
                insights.push('Your open rates have been improving over time. Keep up the good work!');
            }
        }
        
        return insights.length ? insights : ['Your email performance metrics look solid!'];
    }

    /**
     * Format response for API
     * @param {Object} data - Data to format
     * @returns {Object} - Formatted response
     */
    formatResponse(data) {
        if (!data.success) {
            return {
                success: false,
                error: data.error,
                timestamp: data.timestamp || new Date().toISOString()
            };
        }

        const metrics = data.metrics || {};
        const performance = metrics.performance || {};
        const campaigns = data.campaigns || [];
        
        const response = {
            success: true,
            type: 'email',
            total: data.total || 0,
            metrics: {
                overview: {
                    totals: {
                        sent: metrics.totalSent || 0,
                        delivered: (metrics.totalSent || 0) - (metrics.totalBounces || 0),
                        opens: metrics.totalOpens || 0,
                        clicks: metrics.totalClicks || 0,
                        conversions: metrics.totalConversions || 0,
                        bounces: metrics.totalBounces || 0,
                        unsubscribes: metrics.totalUnsubscribes || 0,
                        spamReports: metrics.totalSpamReports || 0,
                        forwards: metrics.totalForwards || 0
                    },
                    rates: metrics.rates || {},
                    benchmarkComparison: this.calculateBenchmarkComparison(metrics.rates || {})
                },
                performance: {
                    score: performance.score || 0,
                    tier: performance.tier || 'Needs Improvement',
                    distribution: performance.distribution || {},
                    industryBenchmark: performance.industryBenchmark || getIndustryBenchmark('email'),
                    keyStrengths: performance.keyStrengths || [],
                    improvementAreas: performance.improvementAreas || []
                },
                insights: metrics.insights || [],
                suggestions: metrics.suggestions || [],
                timestamps: {
                    dataStart: this.getEarliestCampaignDate(campaigns),
                    dataEnd: this.getLatestCampaignDate(campaigns),
                    processedAt: new Date().toISOString()
                }
            },
            campaigns: campaigns,
            _metadata: {
                version: '1.0.0',
                processedCount: campaigns.length,
                hasMobilizeData: campaigns.some(c => c.metrics && c.metrics.mobilize)
            }
        };

        // Add mobilize data if it exists
        if (metrics.mobilize) {
            response.metrics.mobilize = metrics.mobilize;
        }

        return response;
    }
}

module.exports = EmailConnector;
