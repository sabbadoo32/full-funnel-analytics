const mongoose = require('mongoose');
const BaseConnector = require('./BaseConnector');
const {
  getAdMetrics,
  getAdSetMetrics,
  getPerformanceTier,
  AD_BENCHMARKS
} = require('../helpers/adAnalytics');

class AdConnector extends BaseConnector {
    constructor() {
        super();
        this.collection = 'full_funnel';
        this.requiredFields = [
            'Ad ID', 'Campaign Name', 'Ad Set Name', 'Ad Name',
            'Impressions', 'Clicks', 'CTR', 'CPC', 'CPM', 'Spend',
            'Conversions', 'Conversion Rate', 'Frequency', 'Reach',
            'Ad Platform', 'Start Date', 'End Date'
        ];
    }

    /**
     * Query ad campaign data
     * @param {Object} filters - Filters for the query
     * @returns {Promise<Array>} - Array of ad campaign documents
     */
    async query(filters = {}) {
        try {
            const query = { 
                ...filters,
                'Ad ID': { $exists: true, $ne: null },
                'Ad Platform': { $exists: true, $ne: null }
            };

            const Campaign = mongoose.model('Campaign');
            return await Campaign.find(query)
                .select(this.requiredFields.join(' '))
                .lean()
                .exec();
        } catch (error) {
            console.error('Error querying ad data:', error);
            throw new Error('Failed to fetch ad campaign data');
        }
    }

    /**
     * Get ad campaign metrics
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} - Ad campaign metrics
     */
    async getMetrics(query = {}) {
        try {
            const ads = await this.query(query);
            
            if (!ads?.length) {
                return this.formatEmptyResponse();
            }

            // Process each ad with enhanced metrics
            const processedAds = ads.map(ad => {
                const platform = ad['Ad Platform'] || 'unknown';
                const campaign = ad['Campaign Name'] || 'unknown';
                const adSet = ad['Ad Set Name'] || 'unknown';
                
                // Get base ad metrics
                const adMetrics = getAdMetrics(ad);
                
                // Get ad set metrics if available
                const adSetMetrics = adSet !== 'unknown' ? getAdSetMetrics(ad) : null;
                
                return {
                    ...ad,
                    platform,
                    campaign,
                    adSet,
                    metrics: {
                        ...adMetrics,
                        ...(adSetMetrics && { adSet: adSetMetrics })
                    },
                    timestamp: new Date().toISOString()
                };
            });

            // Calculate aggregate metrics
            const aggregateMetrics = this.calculateAggregateMetrics(processedAds);
            
            // Generate insights and recommendations
            const insights = this.generateInsights(processedAds, aggregateMetrics);

            return {
                success: true,
                total: processedAds.length,
                platformBreakdown: this.breakdownByPlatform(processedAds),
                campaignBreakdown: this.breakdownByCampaign(processedAds),
                metrics: {
                    ...aggregateMetrics,
                    insights,
                    timestamp: new Date().toISOString()
                },
                ads: processedAds
            };
        } catch (error) {
            console.error('Error in AdConnector.getMetrics:', error);
            return {
                success: false,
                error: error.message || 'Failed to process ad metrics'
            };
        }
    }

    /**
     * Initialize ad metrics object
     * @private
     */
    initializeAdMetrics() {
        return {
            impressions: 0,
            clicks: 0,
            spend: 0,
            conversions: 0,
            reach: 0,
            ctr: 0,
            cpc: 0,
            cpm: 0,
            conversionRate: 0,
            frequency: 0,
            totalAds: 0
        };
    }

    /**
     * Update ad metrics with new ad data
     * @param {Object} metrics - Metrics object to update
     * @param {Object} ad - Ad data
     * @private
     */
    updateAdMetrics(metrics, ad) {
        metrics.impressions += ad.Impressions || 0;
        metrics.clicks += ad.Clicks || 0;
        metrics.spend += ad.Spend || 0;
        metrics.conversions += ad.Conversions || 0;
        metrics.reach += ad.Reach || 0;
        metrics.totalAds++;
    }

    /**
     * Calculate ad rates and averages
     * @param {Object} metrics - Metrics to calculate rates for
     * @private
     */
    calculateAdRates(metrics) {
        metrics.ctr = metrics.impressions > 0 ? 
            (metrics.clicks / metrics.impressions) * 100 : 0;
            
        metrics.cpc = metrics.clicks > 0 ? 
            metrics.spend / metrics.clicks : 0;
            
        metrics.cpm = metrics.impressions > 0 ? 
            (metrics.spend / metrics.impressions) * 1000 : 0;
            
        metrics.conversionRate = metrics.clicks > 0 ? 
            (metrics.conversions / metrics.clicks) * 100 : 0;
            
        metrics.frequency = metrics.reach > 0 ? 
            metrics.impressions / metrics.reach : 0;
    }

    /**
     * Calculate aggregate metrics from processed ads
     * @private
     */
    calculateAggregateMetrics(ads) {
        const totalMetrics = {
            impressions: 0,
            clicks: 0,
            spend: 0,
            conversions: 0,
            reach: 0,
            videoViews: 0,
            videoCompletions: 0,
            revenue: 0,
            amountSpent: 0,
            performanceScores: []
        };

        // Sum up all metrics
        ads.forEach(ad => {
            totalMetrics.impressions += ad.metrics.impressions || 0;
            totalMetrics.clicks += ad.metrics.clicks || 0;
            totalMetrics.spend += ad.metrics.spend || 0;
            totalMetrics.conversions += ad.metrics.conversions || 0;
            totalMetrics.reach += ad.metrics.reach || 0;
            totalMetrics.videoViews += ad.metrics.videoViews || 0;
            totalMetrics.videoCompletions += ad.metrics.videoCompletions || 0;
            totalMetrics.revenue += ad.metrics.revenue || 0;
            totalMetrics.amountSpent += ad.metrics.amountSpent || 0;
            
            if (ad.metrics.performanceScore) {
                totalMetrics.performanceScores.push(ad.metrics.performanceScore);
            }
        });

        // Calculate rates
        const ctr = totalMetrics.impressions > 0 ? totalMetrics.clicks / totalMetrics.impressions : 0;
        const cpc = totalMetrics.clicks > 0 ? totalMetrics.spend / totalMetrics.clicks : 0;
        const cpm = totalMetrics.impressions > 0 ? (totalMetrics.spend / totalMetrics.impressions) * 1000 : 0;
        const conversionRate = totalMetrics.clicks > 0 ? totalMetrics.conversions / totalMetrics.clicks : 0;
        const frequency = totalMetrics.reach > 0 ? totalMetrics.impressions / totalMetrics.reach : 0;
        const roas = totalMetrics.amountSpent > 0 ? totalMetrics.revenue / totalMetrics.amountSpent : 0;
        const avgPerformanceScore = totalMetrics.performanceScores.length > 0 
            ? totalMetrics.performanceScores.reduce((a, b) => a + b, 0) / totalMetrics.performanceScores.length 
            : 0;

        return {
            totalMetrics: {
                ...totalMetrics,
                ctr,
                cpc,
                cpm,
                conversionRate,
                frequency,
                roas,
                avgPerformanceScore,
                performanceTier: getPerformanceTier(avgPerformanceScore)
            },
            benchmark: AD_BENCHMARKS
        };
    }

    /**
     * Generate insights based on ad performance
     * @private
     */
    generateInsights(ads, aggregateMetrics) {
        const insights = [];
        const { totalMetrics, benchmark } = aggregateMetrics;

        // CTR insight
        if (totalMetrics.ctr < benchmark.CTR * 0.7) {
            insights.push(`Your CTR (${(totalMetrics.ctr * 100).toFixed(2)}%) is below the industry average of ${(benchmark.CTR * 100).toFixed(2)}%. Consider testing different ad creatives or targeting.`);
        } else if (totalMetrics.ctr > benchmark.CTR * 1.3) {
            insights.push(`Great job! Your CTR (${(totalMetrics.ctr * 100).toFixed(2)}%) is significantly above the industry average of ${(benchmark.CTR * 100).toFixed(2)}%.`);
        }

        // ROAS insight
        if (totalMetrics.roas < benchmark.ROAS * 0.7) {
            insights.push(`Your ROAS (${totalMetrics.roas.toFixed(2)}x) is below the industry average of ${benchmark.ROAS}x. Consider optimizing your landing pages or adjusting your bidding strategy.`);
        } else if (totalMetrics.roas > benchmark.ROAS * 1.3) {
            insights.push(`Excellent! Your ROAS (${totalMetrics.roas.toFixed(2)}x) is significantly above the industry average of ${benchmark.ROAS}x.`);
        }

        // Video completion rate insight
        if (totalMetrics.videoViews > 0) {
            const completionRate = totalMetrics.videoCompletions / totalMetrics.videoViews;
            if (completionRate < benchmark.VIDEO_COMPLETION_RATE * 0.7) {
                insights.push(`Your video completion rate (${(completionRate * 100).toFixed(2)}%) is below the industry average of ${(benchmark.VIDEO_COMPLETION_RATE * 100).toFixed(2)}%. Consider making your videos more engaging or shorter.`);
            }
        }

        // Frequency insight
        if (totalMetrics.frequency > benchmark.FREQUENCY * 1.5) {
            insights.push(`Your ad frequency (${totalMetrics.frequency.toFixed(2)}) is higher than the recommended level of ${benchmark.FREQUENCY}. Consider expanding your audience or refreshing your creatives.`);
        }

        return insights;
    }

    /**
     * Generate a breakdown of metrics by platform
     * @private
     */
    breakdownByPlatform(ads) {
        const platformMap = new Map();
        
        ads.forEach(ad => {
            const platform = ad.platform;
            if (!platformMap.has(platform)) {
                platformMap.set(platform, [ad]);
            } else {
                platformMap.get(platform).push(ad);
            }
        });

        const breakdown = {};
        platformMap.forEach((platformAds, platform) => {
            const platformMetrics = this.calculateAggregateMetrics(platformAds);
            breakdown[platform] = platformMetrics.totalMetrics;
        });

        return breakdown;
    }

    /**
     * Generate a breakdown of metrics by campaign
     * @private
     */
    breakdownByCampaign(ads) {
        const campaignMap = new Map();
        
        ads.forEach(ad => {
            const campaign = ad.campaign;
            if (!campaignMap.has(campaign)) {
                campaignMap.set(campaign, [ad]);
            } else {
                campaignMap.get(campaign).push(ad);
            }
        });

        const breakdown = {};
        campaignMap.forEach((campaignAds, campaign) => {
            const campaignMetrics = this.calculateAggregateMetrics(campaignAds);
            breakdown[campaign] = campaignMetrics.totalMetrics;
        });

        return breakdown;
    }

    /**
     * Format an empty response
     * @private
     */
    formatEmptyResponse() {
        return {
            success: true,
            total: 0,
            platformBreakdown: {},
            campaignBreakdown: {},
            metrics: {
                totalMetrics: {},
                insights: [],
                timestamp: new Date().toISOString()
            },
            ads: []
        };
    }

    /**
     * Format response for API
     * @param {Object} data - Raw data to format
     * @returns {Object} - Formatted response
     */
    formatResponse(data) {
        if (!data.success) {
            return {
                success: false,
                error: data.error || 'Failed to process ad metrics'
            };
        }

        return {
            success: true,
            type: 'ad',
            total: data.total,
            metrics: {
                overview: {
                    totalSpend: data.metrics.totalMetrics.amountSpent,
                    totalImpressions: data.metrics.totalMetrics.impressions,
                    totalClicks: data.metrics.totalMetrics.clicks,
                    totalConversions: data.metrics.totalMetrics.conversions,
                    averageCTR: data.metrics.totalMetrics.ctr,
                    averageCPC: data.metrics.totalMetrics.cpc,
                    averageCPM: data.metrics.totalMetrics.cpm,
                    averageROAS: data.metrics.totalMetrics.roas,
                    frequency: data.metrics.totalMetrics.frequency,
                    performanceScore: data.metrics.totalMetrics.avgPerformanceScore,
                    performanceTier: data.metrics.totalMetrics.performanceTier
                },
                platformBreakdown: data.platformBreakdown,
                campaignBreakdown: data.campaignBreakdown,
                byPlatform: data.platformBreakdown,
                byCampaign: data.campaignBreakdown,
                insights: data.metrics.insights,
                benchmark: data.metrics.benchmark,
                timestamp: data.metrics.timestamp
            },
            ads: data.ads.map(ad => ({
                id: ad['Ad ID'],
                name: ad['Ad Name'],
                platform: ad.platform,
                campaign: ad.campaign,
                metrics: ad.metrics,
                timestamp: ad.timestamp
            })),
            suggestions: this.generateSuggestions(data.metrics.totalMetrics)
        };
    }

    /**
     * Generate suggestions based on ad metrics
     * @param {Object} metrics - Ad metrics object
     * @returns {Array} - Array of suggestion strings
     */
    generateSuggestions(metrics) {
        const suggestions = [];
        const { ctr, cpc, cpm, conversionRate, frequency, roas, avgPerformanceScore } = metrics;
        const { CTR, CPC, CPM, CONVERSION_RATE, ROAS } = AD_BENCHMARKS;

        // CTR suggestions
        if (ctr < CTR * 0.7) {
            suggestions.push(`Low CTR (${(ctr * 100).toFixed(2)}% vs benchmark ${(CTR * 100).toFixed(2)}%). Test different creatives, headlines, or targeting.`);
        } else if (ctr > CTR * 1.3) {
            suggestions.push(`Great CTR performance (${(ctr * 100).toFixed(2)}%)! Consider increasing budget for top-performing ads.`);
        }

        // CPC suggestions
        if (cpc > CPC * 1.3) {
            suggestions.push(`High CPC ($${cpc.toFixed(2)} vs benchmark $${CPC.toFixed(2)}). Optimize quality score or refine targeting.`);
        } else if (cpc < CPC * 0.7) {
            suggestions.push(`Efficient CPC ($${cpc.toFixed(2)}). Consider bidding more aggressively.`);
        }

        // Conversion rate suggestions
        if (conversionRate < CONVERSION_RATE * 0.7) {
            suggestions.push(`Low conversion rate (${(conversionRate * 100).toFixed(2)}% vs benchmark ${(CONVERSION_RATE * 100).toFixed(2)}%). Check landing page experience and audience targeting.`);
        }

        // ROAS suggestions
        if (roas < ROAS * 0.7) {
            suggestions.push(`Low ROAS (${roas.toFixed(2)}x vs benchmark ${ROAS.toFixed(2)}x). Review bidding strategy and conversion tracking.`);
        } else if (roas > ROAS * 1.3) {
            suggestions.push(`Excellent ROAS (${roas.toFixed(2)}x)! Consider scaling successful campaigns.`);
        }

        // Frequency suggestions
        if (frequency > 3) {
            suggestions.push(`High ad frequency (${frequency.toFixed(1)}). Consider refreshing creatives or expanding audience to reduce fatigue.`);
        }

        // Performance score insights
        if (avgPerformanceScore < 50) {
            suggestions.push('Low overall performance score. Review campaign settings, targeting, and creatives.');
        } else if (avgPerformanceScore > 80) {
            suggestions.push('Excellent performance score! Consider allocating more budget to top-performing campaigns.');
        }

        return suggestions.length > 0 ? suggestions : ['Your ad performance is meeting or exceeding benchmarks. Keep up the good work!'];
    }
}

module.exports = AdConnector;
