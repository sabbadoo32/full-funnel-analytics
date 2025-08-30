const BaseConnector = require('./BaseConnector');
const mongoose = require('mongoose');
const { 
  getActionDetails,
  calculateActionMetrics,
  generateInsights,
  getPerformanceTier,
  BENCHMARKS
} = require('../helpers/impactiveAnalytics');

class ImpactiveConnector extends BaseConnector {
    constructor() {
        super();
        this.collection = 'full_funnel';
        this.requiredFields = [
            'action_id', 'action_type', 'user_id', 'campaign_id', 
            'campaign_name', 'completed', 'opt_in', 'action_created_at'
        ];
    }

    async query(filters = {}) {
        try {
            const query = { 
                ...filters,
                'action_id': { $exists: true },
                'action_type': { $exists: true }
            };

            const Campaign = mongoose.model('Campaign');
            return await Campaign.find(query)
                .select(this.requiredFields.join(' '))
                .sort({ 'action_created_at': -1 })
                .lean()
                .exec();
        } catch (error) {
            console.error('Error querying Impactive data:', error);
            throw new Error('Failed to fetch Impactive data');
        }
    }

    /**
     * Get metrics for Impactive actions with enhanced analytics
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} - Enhanced action metrics with insights
     */
    async getMetrics(query = {}) {
        try {
            const actions = await this.query(query);
            
            if (!actions?.length) {
                return {
                    success: true,
                    total: 0,
                    metrics: {
                        overview: {
                            totalActions: 0,
                            totalUniqueUsers: 0,
                            totalCompleted: 0,
                            totalOptIns: 0,
                            completionRate: 0,
                            optInRate: 0,
                            actionsPerUser: 0,
                            performanceScore: 0,
                            performanceTier: 'needs_improvement'
                        },
                        byActionType: {},
                        byCategory: {},
                        byCampaign: {},
                        byTime: {
                            byHour: Array(24).fill(0),
                            byDay: Array(7).fill(0)
                        }
                    },
                    events: [],
                    insights: {
                        keyStrengths: [],
                        improvementAreas: [],
                        recommendations: ['No action data available. Consider promoting your campaigns to drive more engagement.'],
                        performanceTier: 'needs_improvement',
                        summary: 'No action data available.'
                    },
                    timestamp: new Date().toISOString()
                };
            }
            
            // Process each action with enhanced analytics
            const processedActions = actions.map(action => getActionDetails(action));
            
            // Calculate metrics
            const metrics = calculateActionMetrics(processedActions);
            
            // Generate insights
            const insights = generateInsights(metrics);
            
            // Format the response
            return {
                success: true,
                total: processedActions.length,
                metrics: {
                    overview: {
                        totalActions: metrics.totalActions,
                        totalUniqueUsers: metrics.uniqueUsers.size,
                        totalCompleted: metrics.completedActions,
                        totalOptIns: metrics.optedIn,
                        completionRate: parseFloat(metrics.completionRate.toFixed(4)),
                        optInRate: parseFloat(metrics.optInRate.toFixed(4)),
                        actionsPerUser: parseFloat(metrics.actionsPerUser.toFixed(2)),
                        performanceScore: metrics.performanceScore,
                        performanceTier: insights.performanceTier || getPerformanceTier(metrics.performanceScore)
                    },
                    byActionType: Object.entries(metrics.byActionType).reduce((acc, [type, data]) => {
                        acc[type] = {
                            count: data.count,
                            completed: data.completed,
                            optIns: data.optIns,
                            completionRate: data.count > 0 ? data.completed / data.count : 0,
                            optInRate: data.count > 0 ? data.optIns / data.count : 0
                        };
                        return acc;
                    }, {}),
                    byCategory: Object.entries(metrics.byCategory).reduce((acc, [category, data]) => {
                        acc[category] = {
                            count: data.count,
                            completed: data.completed,
                            optIns: data.optIns,
                            completionRate: data.count > 0 ? data.completed / data.count : 0,
                            optInRate: data.count > 0 ? data.optIns / data.count : 0
                        };
                        return acc;
                    }, {}),
                    byCampaign: processedActions.reduce((acc, action) => {
                        const campaignId = action.campaignId || 'unknown';
                        if (!acc[campaignId]) {
                            acc[campaignId] = {
                                name: action.campaignName || 'Unknown Campaign',
                                count: 0,
                                completed: 0,
                                optIns: 0,
                                actions: []
                            };
                        }
                        
                        acc[campaignId].count++;
                        if (action.isCompleted) acc[campaignId].completed++;
                        if (action.isOptIn) acc[campaignId].optIns++;
                        acc[campaignId].actions.push({
                            id: action.id,
                            type: action.actionType,
                            category: action.category,
                            isCompleted: action.isCompleted,
                            isOptIn: action.isOptIn,
                            timestamp: action.timestamp
                        });
                        
                        return acc;
                    }, {}),
                    byTime: metrics.byTime
                },
                events: processedActions,
                insights,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error getting Impactive metrics:', error);
            return {
                success: false,
                error: `Failed to get Impactive metrics: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Format the API response
     * @param {Object} data - Raw data to format
     * @returns {Object} - Formatted response
     */
    formatResponse(data) {
        // If there was an error, return the error response
        if (!data.success) {
            return {
                success: false,
                error: data.error || 'Unknown error occurred',
                timestamp: data.timestamp || new Date().toISOString()
            };
        }
        
        // If metrics is already formatted (from getMetrics), return as is
        if (data.metrics?.overview) {
            return {
                success: true,
                type: 'impactive',
                ...data
            };
        }
        
        // Fallback for legacy format
        return {
            success: true,
            type: 'impactive',
            total: data.total || 0,
            metrics: {
                overview: {
                    totalActions: data.metrics?.totalActions || 0,
                    totalUniqueUsers: data.metrics?.totalUniqueUsers || 0,
                    totalCompleted: data.metrics?.totalCompletedActions || 0,
                    totalOptIns: data.metrics?.totalOptIns || 0,
                    completionRate: data.metrics?.completionRate || 0,
                    optInRate: data.metrics?.optInRate || 0,
                    actionsPerUser: 0,
                    performanceScore: 0,
                    performanceTier: 'needs_improvement'
                },
                byActionType: data.metrics?.byActionType || {},
                byCategory: {},
                byCampaign: data.metrics?.byCampaign || {},
                byTime: {
                    byHour: Array(24).fill(0),
                    byDay: Array(7).fill(0)
                }
            },
            events: [],
            insights: {
                keyStrengths: [],
                improvementAreas: [],
                recommendations: ['Legacy data format detected. Some analytics features may be limited.'],
                performanceTier: 'needs_improvement',
                summary: 'Legacy data format detected.'
            },
            timestamp: data.timestamp || new Date().toISOString()
        };
    }

    generateSuggestions(metrics) {
        const suggestions = [];
        if (metrics.completionRate < 50) {
            suggestions.push('Low action completion rate. Consider simplifying your action forms.');
        }
        if (metrics.optInRate < 30) {
            suggestions.push('Low opt-in rate. Make sure the value of opting in is clear to users.');
        }
        return suggestions.length ? suggestions : ['Your Impactive metrics look good!'];
    }
}

module.exports = ImpactiveConnector;
