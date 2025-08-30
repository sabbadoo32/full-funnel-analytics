const BaseConnector = require('./BaseConnector');
const mongoose = require('mongoose');
const { 
  getCTVMetrics, 
  getCTVPreferenceInsights, 
  getCTVPerformanceByDemo,
  calculatePerformanceScore,
  getPerformanceTier,
  getKeyStrengths,
  getImprovementAreas
} = require('../helpers/ctvAnalytics');

class CTVConnector extends BaseConnector {
    constructor() {
        super();
        this.collection = 'full_funnel';
        this.requiredFields = [
            'Households', 'Impressons per Household', 'View-Through Rate',
            'Cost Per View', 'Completed View', 'In-market & interests',
            'Detailed demographic', 'Age bracket', 'Hour of day',
            'Strategy', 'State', 'ZIP code', 'Region', 'Country',
            'Frequency', 'Objective', 'Result type', 'Results',
            'campaign_id', 'platform'
        ];
    }

    async query(filters = {}) {
        try {
            const query = { 
                ...filters,
                'Households': { $exists: true, $ne: null },
                'Impressons per Household': { $exists: true, $ne: null },
                'campaign_id': { $exists: true, $ne: null }
            };

            const Campaign = mongoose.model('Campaign');
            const results = await Campaign.find(query)
                .select(this.requiredFields.join(' '))
                .sort({ 'Hour of day': -1 })
                .lean()
                .exec();
            
            if (!results || results.length === 0) {
                console.log('No CTV data found for query:', query);
                return [];
            }
            
            return results;
        } catch (error) {
            console.error('Error querying CTV data:', error);
            throw new Error(`Failed to fetch CTV data: ${error.message}`);
        }
    }

    /**
     * Get metrics for CTV campaigns
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} - Metrics data
     */
    async getMetrics(query = {}) {
        try {
            const ctvData = await this.query(query);
            if (!ctvData || ctvData.length === 0) {
                return { 
                    success: true,
                    total: 0, 
                    metrics: this.getEmptyMetrics(),
                    ads: []
                };
            }

            const metrics = this.getEmptyMetrics();
            const processedCampaigns = [];
            
            // Process each CTV data point
            for (const campaign of ctvData) {
                const campaignId = campaign.campaign_id || 'unknown';
                const platform = campaign.platform || 'unknown';
                
                // Get metrics using helper functions
                const ctvMetrics = getCTVMetrics(campaign);
                const preferenceInsights = getCTVPreferenceInsights(campaign);
                const performanceByDemo = getCTVPerformanceByDemo(campaign);
                const performanceScore = calculatePerformanceScore(campaign);
                const performanceTier = getPerformanceTier(performanceScore);
                const keyStrengths = getKeyStrengths(campaign, performanceScore);
                const improvementAreas = getImprovementAreas(campaign, performanceScore);
                
                // Calculate derived metrics
                const impressions = ctvMetrics.totalImpressions || 0;
                const views = ctvMetrics.totalViews || 0;
                const spend = ctvMetrics.totalSpend || 0;
                const clicks = ctvMetrics.totalResults || 0;
                const completions = ctvMetrics.totalCompletedViews || 0;
                const households = ctvMetrics.totalHouseholds || 0;
                const viewThroughRate = impressions > 0 ? views / impressions : 0;
                const completionRate = views > 0 ? completions / views : 0;
                const cpv = views > 0 ? spend / views : 0;
                const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
                const cpc = clicks > 0 ? spend / clicks : 0;
                
                // Create campaign object
                const campaignData = {
                    id: campaignId,
                    name: campaign['Campaign Name'] || 'Unnamed Campaign',
                    platform,
                    metrics: {
                        ...ctvMetrics,
                        performanceScore,
                        performanceTier,
                        preferenceInsights,
                        performanceByDemo,
                        viewThroughRate,
                        completionRate,
                        cpv,
                        cpm,
                        cpc,
                        timestamp: new Date().toISOString()
                    },
                    insights: {
                        keyStrengths,
                        improvementAreas,
                        recommendations: this.generateRecommendations(ctvMetrics, performanceScore)
                    }
                };
                
                // Initialize platform metrics if needed
                if (!metrics.byPlatform[platform]) {
                    metrics.byPlatform[platform] = {
                        totalImpressions: 0,
                        totalViews: 0,
                        totalSpend: 0,
                        totalClicks: 0,
                        totalCompletions: 0,
                        totalHouseholds: 0,
                        totalCampaigns: 0,
                        avgViewThroughRate: 0,
                        avgCompletionRate: 0,
                        avgCPV: 0,
                        avgCPM: 0,
                        avgCPC: 0,
                        performanceScore: 0
                    };
                }
                
                // Update platform metrics
                const platformData = metrics.byPlatform[platform];
                platformData.totalImpressions += impressions;
                platformData.totalViews += views;
                platformData.totalSpend += spend;
                platformData.totalClicks += clicks;
                platformData.totalCompletions += completions;
                platformData.totalHouseholds += households;
                platformData.totalCampaigns += 1;
                platformData.performanceScore = (platformData.performanceScore * (platformData.totalCampaigns - 1) + performanceScore) / platformData.totalCampaigns;
                
                // Initialize campaign metrics if needed
                if (!metrics.byCampaign[campaignId]) {
                    metrics.byCampaign[campaignId] = {
                        id: campaignId,
                        name: campaign['Campaign Name'] || 'Unnamed Campaign',
                        platform,
                        totalImpressions: 0,
                        totalViews: 0,
                        totalSpend: 0,
                        totalClicks: 0,
                        totalCompletions: 0,
                        totalHouseholds: 0,
                        performanceScore: 0,
                        performanceTier: '',
                        preferenceInsights: {},
                        performanceByDemo: {}
                    };
                }
                
                // Update campaign metrics
                const campaignMetrics = metrics.byCampaign[campaignId];
                campaignMetrics.totalImpressions += impressions;
                campaignMetrics.totalViews += views;
                campaignMetrics.totalSpend += spend;
                campaignMetrics.totalClicks += clicks;
                campaignMetrics.totalCompletions += completions;
                campaignMetrics.totalHouseholds += households;
                campaignMetrics.performanceScore = performanceScore;
                campaignMetrics.performanceTier = performanceTier;
                campaignMetrics.preferenceInsights = preferenceInsights;
                campaignMetrics.performanceByDemo = performanceByDemo;
                
                // Update totals
                metrics.totalImpressions += impressions;
                metrics.totalViews += views;
                metrics.totalSpend += spend;
                metrics.totalClicks += clicks;
                metrics.totalCompletions += completions;
                metrics.totalHouseholds += households;
                
                processedCampaigns.push(campaignData);
            }
            
            // Calculate aggregate metrics
            metrics.avgViewThroughRate = metrics.totalImpressions > 0 ? metrics.totalViews / metrics.totalImpressions : 0;
            metrics.avgCompletionRate = metrics.totalViews > 0 ? metrics.totalCompletions / metrics.totalViews : 0;
            metrics.avgCostPerView = metrics.totalViews > 0 ? metrics.totalSpend / metrics.totalViews : 0;
            metrics.avgCPM = metrics.totalImpressions > 0 ? (metrics.totalSpend / metrics.totalImpressions) * 1000 : 0;
            metrics.avgCPC = metrics.totalClicks > 0 ? metrics.totalSpend / metrics.totalClicks : 0;
            
            // Calculate platform averages
            Object.values(metrics.byPlatform).forEach(platform => {
                platform.avgViewThroughRate = platform.totalImpressions > 0 ? platform.totalViews / platform.totalImpressions : 0;
                platform.avgCompletionRate = platform.totalViews > 0 ? platform.totalCompletions / platform.totalViews : 0;
                platform.avgCPV = platform.totalViews > 0 ? platform.totalSpend / platform.totalViews : 0;
                platform.avgCPM = platform.totalImpressions > 0 ? (platform.totalSpend / platform.totalImpressions) * 1000 : 0;
                platform.avgCPC = platform.totalClicks > 0 ? platform.totalSpend / platform.totalClicks : 0;
            });
            
            return {
                success: true,
                total: ctvData.length,
                metrics: metrics,
                ads: processedCampaigns,
                platformBreakdown: metrics.byPlatform,
                campaignBreakdown: metrics.byCampaign,
                insights: {
                    keyStrengths: this.aggregateKeyStrengths(processedCampaigns),
                    improvementAreas: this.aggregateImprovementAreas(processedCampaigns),
                    recommendations: this.aggregateRecommendations(processedCampaigns)
                },
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error getting CTV metrics:', error);
            return {
                success: false,
                error: `Failed to get CTV metrics: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    /**
     * Aggregate key strengths from multiple campaigns
     * @param {Array} campaigns - List of campaign data
     * @returns {Array} - Aggregated key strengths
     */
    aggregateKeyStrengths(campaigns) {
        if (!campaigns || campaigns.length === 0) return [];
        
        const strengthCounts = new Map();
        
        campaigns.forEach(campaign => {
            const strengths = campaign.insights?.keyStrengths || [];
            strengths.forEach(strength => {
                strengthCounts.set(strength, (strengthCounts.get(strength) || 0) + 1);
            });
        });
        
        return Array.from(strengthCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([strength]) => strength)
            .slice(0, 5); // Return top 5 strengths
    }
    
    /**
     * Aggregate improvement areas from multiple campaigns
     * @param {Array} campaigns - List of campaign data
     * @returns {Array} - Aggregated improvement areas
     */
    aggregateImprovementAreas(campaigns) {
        if (!campaigns || campaigns.length === 0) return [];
        
        const areaCounts = new Map();
        
        campaigns.forEach(campaign => {
            const areas = campaign.insights?.improvementAreas || [];
            areas.forEach(area => {
                areaCounts.set(area, (areaCounts.get(area) || 0) + 1);
            });
        });
        
        return Array.from(areaCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([area]) => area)
            .slice(0, 5); // Return top 5 improvement areas
    }
    
    /**
     * Aggregate recommendations from multiple campaigns
     * @param {Array} campaigns - List of campaign data
     * @returns {Array} - Aggregated recommendations
     */
    aggregateRecommendations(campaigns) {
        if (!campaigns || campaigns.length === 0) return [];
        
        const recCounts = new Map();
        
        campaigns.forEach(campaign => {
            const recs = campaign.insights?.recommendations || [];
            recs.forEach(rec => {
                recCounts.set(rec, (recCounts.get(rec) || 0) + 1);
            });
        });
        
        return Array.from(recCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([rec]) => rec)
            .slice(0, 5); // Return top 5 recommendations
    }
    
    /**
     * Generate recommendations for a campaign based on metrics and performance score
     * @param {Object} metrics - Campaign metrics
     * @param {number} performanceScore - Performance score (0-100)
     * @returns {Array} - List of recommendations
     */
    generateRecommendations(metrics, performanceScore) {
        const recommendations = [];
        
        // Performance-based recommendations
        if (performanceScore < 50) {
            recommendations.push('Consider optimizing your CTV creative for better engagement.');
            recommendations.push('Review targeting parameters to ensure you\'re reaching the right audience.');
        }
        
        // View-through rate recommendations
        const vtr = metrics.viewThroughRate || 0;
        if (vtr < 0.5) {
            recommendations.push('Improve your ad creative to increase view-through rate.');
        }
        
        // Completion rate recommendations
        const completionRate = metrics.completionRate || 0;
        if (completionRate < 0.7) {
            recommendations.push('Consider shortening your video or making it more engaging to improve completion rates.');
        }
        
        // Cost efficiency recommendations
        const cpv = metrics.cpv || 0;
        if (cpv > 0.03) {
            recommendations.push('Optimize your bidding strategy to reduce cost per view.');
        }
        
        return recommendations.length > 0 ? recommendations : ['Performance is meeting expectations. Continue monitoring.'];
    }
    
    /**
     * Get empty metrics object with proper structure
     * @returns {Object} - Empty metrics object
     */
    getEmptyMetrics() {
        return {
            totalImpressions: 0,
            totalViews: 0,
            totalSpend: 0,
            totalClicks: 0,
            totalCompletions: 0,
            totalHouseholds: 0,
            viewRate: '0%',
            completionRate: '0%',
            ctr: '0%',
            cpm: '0.00',
            cpv: '0.0000',
            byCampaign: {},
            byPlatform: {}
        };
    }
    
    /**
     * Initialize platform metrics object
     * @private
     */
    initializePlatformMetrics() {
            // Update platform metrics
            const platform = campaign.platform || 'unknown';
            if (!acc.metrics.byPlatform[platform]) {
                acc.metrics.byPlatform[platform] = {
                    impressions: 0,
                    views: 0,
                    spend: 0,
                    clicks: 0,
                    completions: 0,
                    households: 0
                }
                };
            }
            // Update platform metrics from CTV metrics
            const platformData = acc.metrics.byPlatform[platform];
            platformData.impressions += ctvMetrics.households * ctvMetrics.impressionsPerHousehold || 0;
            platformData.views += ctvMetrics.completedView || 0;
            platformData.spend += ctvMetrics.costPerView * ctvMetrics.completedView || 0;
            platformData.clicks += ctvMetrics.results || 0;
            platformData.completions += ctvMetrics.completedView || 0;
            platformData.households += ctvMetrics.households || 0;
            
            // Update totals
            acc.metrics.totalImpressions += platformData.impressions;
            acc.metrics.totalViews += platformData.views;
            acc.metrics.totalSpend += platformData.spend;
            acc.metrics.totalClicks += platformData.clicks;
            acc.metrics.totalCompletions += platformData.completions;
            acc.metrics.totalHouseholds += platformData.households;
            acc.metrics.totalViews += item.views || 0;
            acc.metrics.totalCompletions += item.completions || 0;
            acc.metrics.totalSpend += parseFloat(item.spend) || 0;
            acc.metrics.totalClicks += item.clicks || 0;
            
            return acc;
        }, { 
            metrics: {
                totalImpressions: 0,
                totalViews: 0,
                totalSpend: 0,
                totalClicks: 0,
                totalCompletions: 0,
                totalHouseholds: 0,
                byCampaign: {},
                byPlatform: {}
            }
        });

    /**
     * Format the response for API consumption
     * @param {Object} data - Raw metrics data
     * @returns {Object} - Formatted response
     */
    formatResponse(data) {
        if (!data || !data.metrics) {
            return {
                success: false,
                type: 'ctv',
                total: 0,
                metrics: this.getEmptyMetrics(),
                ads: [],
                suggestions: ['No CTV data available.']
            };
        }
        
        // If we already have a properly formatted response from getMetrics
        if (data.success !== undefined) {
            return data;
        }
        
        // Calculate rates if not already present
        if (!data.metrics.avgViewThroughRate) {
            data.metrics.avgViewThroughRate = data.metrics.totalImpressions > 0 ? 
                data.metrics.totalViews / data.metrics.totalImpressions : 0;
        }
        
        if (!data.metrics.avgCostPerView) {
            data.metrics.avgCostPerView = data.metrics.totalViews > 0 ? 
                data.metrics.totalSpend / data.metrics.totalViews : 0;
        }
        
        // Format the overview metrics
        const overview = {
            totalImpressions: data.metrics.totalImpressions || 0,
            totalViews: data.metrics.totalViews || 0,
            totalCompletions: data.metrics.totalCompletions || 0,
            totalSpend: data.metrics.totalSpend || 0,
            totalClicks: data.metrics.totalClicks || 0,
            totalHouseholds: data.metrics.totalHouseholds || 0,
            avgViewThroughRate: data.metrics.avgViewThroughRate || 0,
            avgCostPerView: data.metrics.avgCostPerView || 0,
            avgCompletionRate: data.metrics.avgCompletionRate || 0,
            avgCPM: data.metrics.avgCPM || 0,
            avgCPC: data.metrics.avgCPC || 0,
            timestamp: new Date().toISOString()
        };
        
        return {
            success: true,
            type: 'ctv',
            total: data.total || 0,
            metrics: {
                overview,
                byCampaign: data.metrics.byCampaign || {},
                byPlatform: data.metrics.byPlatform || {},
                insights: data.insights || {}
            },
            ads: data.ads || [],
            platformBreakdown: data.platformBreakdown || {},
            campaignBreakdown: data.campaignBreakdown || {},
            timestamp: data.timestamp || new Date().toISOString(),
            suggestions: this.generateSuggestions(data.metrics, data.insights)
        };
    }

    /**
     * Generate performance suggestions based on metrics and insights
     * @param {Object} metrics - Performance metrics
     * @param {Object} insights - Performance insights
     * @returns {Array} - List of suggestions
     */
    generateSuggestions(metrics = {}, insights = {}) {
        if (!metrics) {
            return ['No metrics available to generate suggestions.'];
        }
        
        const suggestions = [];
        const overview = metrics.overview || metrics;
        
        try {
            // Add insights from the insights object if available
            if (insights.keyStrengths && insights.keyStrengths.length > 0) {
                suggestions.push(...insights.keyStrengths.map(strength => `Strength: ${strength}`));
            }
            
            if (insights.improvementAreas && insights.improvementAreas.length > 0) {
                suggestions.push(...insights.improvementAreas.map(area => `Improvement area: ${area}`));
            }
            
            // Add data-driven suggestions
            const viewRate = overview.avgViewThroughRate || 0;
            const completionRate = overview.avgCompletionRate || 0;
            const cpv = overview.avgCostPerView || 0;
            const cpm = overview.avgCPM || 0;
            
            // View rate analysis
            if (viewRate < 0.5) {
                suggestions.push('Low view-through rate. Consider making your ad creative more engaging in the first few seconds.');
            }
            
            // Completion rate analysis
            if (completionRate < 0.7) {
                suggestions.push('Low completion rate. Consider shortening your video or making the content more engaging throughout.');
            }
            
            // Cost efficiency analysis
            if (cpv > 0.03) {
                suggestions.push('High cost per view. Consider optimizing your targeting or bidding strategy.');
            }
            
            // Platform-specific suggestions
            if (metrics.byPlatform) {
                const platforms = Object.entries(metrics.byPlatform);
                if (platforms.length > 0) {
                    // Find best performing platform by completion rate
                    const [bestPlatform, bestData] = platforms.reduce((best, [platform, data]) => {
                        const completionRate = data.completionRate || 0;
                        return completionRate > best[1] ? [platform, completionRate] : best;
                    }, ['', 0]);
                    
                    if (bestPlatform) {
                        suggestions.push(`Best performing platform: ${bestPlatform} with ${(bestData * 100).toFixed(2)}% completion rate.`);
                    }
                }
            }
            
            // If no specific issues found, provide positive feedback
            if (suggestions.length === 0) {
                suggestions.push('CTV performance is meeting or exceeding expectations.');
            }
            
            return suggestions;
            
        } catch (error) {
            console.error('Error generating suggestions:', error);
            return ['Unable to generate performance suggestions.'];
        }
    }
}

module.exports = CTVConnector;
