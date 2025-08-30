const BaseConnector = require('./BaseConnector');
const mongoose = require('mongoose');
const { 
  getEventDetails, 
  getEventPerformance, 
  getEventReferrals 
} = require('../helpers/eventAnalytics');

// Event performance benchmarks
const EVENT_BENCHMARKS = {
  attendanceRate: 70, // Target attendance rate percentage
  noShowRate: 20,    // Target no-show rate percentage
  fillRate: 80,      // Target fill rate percentage
  minRSVPs: 10       // Minimum RSVPs to be considered significant
};

class EventConnector extends BaseConnector {
    constructor() {
        super();
        this.collection = 'full_funnel';
        this.requiredFields = [
            'Event ID', 'Event Name', 'Event Type', 'Event Date', 'Start Time', 'End Time',
            'Location', 'Address', 'City', 'State', 'Zip Code', 'Capacity', 'RSVPs',
            'Attendees', 'No Shows', 'Waitlist', 'Registration URL', 'Description',
            'Organizer', 'Tags', 'Is Virtual', 'Platform', 'Registration Deadline'
        ];
    }

    /**
     * Query event data
     * @param {Object} filters - Filters for the query
     * @returns {Promise<Array>} - Array of event documents
     */
    async query(filters = {}) {
        try {
            const query = { 
                ...filters,
                'Event ID': { $exists: true, $ne: null },
                'Event Name': { $exists: true, $ne: null }
            };

            const Campaign = mongoose.model('Campaign');
            return await Campaign.find(query)
                .select(this.requiredFields.join(' '))
                .sort({ 'Event Date': -1 })
                .lean()
                .exec();
        } catch (error) {
            console.error('Error querying event data:', error);
            throw new Error('Failed to fetch event data');
        }
    }

    /**
     * Get event metrics with enhanced analytics
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} - Enhanced event metrics with insights
     */
    async getMetrics(query = {}) {
        try {
            const events = await this.query(query);
            
            if (!events || events.length === 0) {
                return {
                    success: true,
                    total: 0,
                    metrics: this.initializeEventMetrics(),
                    events: [],
                    insights: {
                        keyStrengths: [],
                        improvementAreas: [],
                        recommendations: []
                    },
                    timestamp: new Date().toISOString()
                };
            }

            // Process each event with enhanced analytics
            const processedEvents = [];
            const metrics = {
                byType: {},
                byState: {},
                byPlatform: {},
                byOrganizer: {},
                locations: new Set(),
                organizers: new Set(),
                tags: new Map(),
                ...this.initializeEventMetrics()
            };

            // Process each event
            for (const event of events) {
                const eventDetails = getEventDetails(event);
                const eventPerformance = getEventPerformance(event);
                const eventReferrals = getEventReferrals(event);
                
                const isVirtual = event['Is Virtual'] === 'Yes';
                const eventType = eventDetails.eventType || 'Other';
                const state = event.State || 'Unknown';
                const platform = event.Platform || 'Unknown';
                const organizer = event.Organizer || 'Unknown';
                
                // Initialize metrics for event type if not exists
                if (!metrics.byType[eventType]) {
                    metrics.byType[eventType] = this.initializeEventMetrics();
                }
                
                // Initialize metrics for state if not exists
                if (!metrics.byState[state]) {
                    metrics.byState[state] = this.initializeEventMetrics();
                }
                
                // Initialize metrics for platform if not exists
                if (!metrics.byPlatform[platform]) {
                    metrics.byPlatform[platform] = this.initializeEventMetrics();
                }
                
                // Initialize metrics for organizer if not exists
                if (!metrics.byOrganizer[organizer]) {
                    metrics.byOrganizer[organizer] = this.initializeEventMetrics();
                }
                
                // Update metrics at all levels
                this.updateEventMetrics(metrics, event, isVirtual);
                this.updateEventMetrics(metrics.byType[eventType], event, isVirtual);
                this.updateEventMetrics(metrics.byState[state], event, isVirtual);
                this.updateEventMetrics(metrics.byPlatform[platform], event, isVirtual);
                this.updateEventMetrics(metrics.byOrganizer[organizer], event, isVirtual);
                
                // Track unique locations, organizers, and tags
                const locationKey = `${event.City}, ${event.State}`.trim();
                if (locationKey) metrics.locations.add(locationKey);
                if (organizer) metrics.organizers.add(organizer);
                
                // Process tags
                if (event.Tags) {
                    const tags = event.Tags.split(',').map(tag => tag.trim());
                    tags.forEach(tag => {
                        if (tag) {
                            metrics.tags.set(tag, (metrics.tags.get(tag) || 0) + 1);
                        }
                    });
                }
                
                // Calculate performance score for this event
                const performanceScore = this.calculatePerformanceScore(eventPerformance);
                const performanceTier = this.getPerformanceTier(performanceScore);
                
                // Add processed event data
                processedEvents.push({
                    id: eventDetails.eventId,
                    name: eventDetails.eventName,
                    type: eventType,
                    platform,
                    organizer,
                    location: locationKey,
                    isVirtual,
                    date: eventDetails.eventDate,
                    metrics: {
                        ...eventPerformance,
                        performanceScore,
                        performanceTier,
                        referrals: eventReferrals
                    },
                    details: eventDetails
                });
            }
            
            // Calculate aggregate metrics
            this.calculateAggregateMetrics(metrics);
            
            // Generate insights and recommendations
            const insights = this.generateInsights(metrics, processedEvents);
            
            // Prepare response
            return {
                success: true,
                total: events.length,
                metrics: this.formatMetrics(metrics, processedEvents),
                events: processedEvents,
                insights,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error getting event metrics:', error);
            return {
                success: false,
                error: `Failed to get event metrics: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Calculate performance score for an event
     * @param {Object} metrics - Event performance metrics
     * @returns {number} - Performance score (0-100)
     * @private
     */
    calculatePerformanceScore(metrics) {
        const { 
            attendanceRate = 0, 
            engagementRate = 0, 
            conversionRate = 0,
            engagedSessions = 0,
            avgEngagementTime = 0
        } = metrics;
        
        // Weights for different metrics (sum to 1.0)
        const weights = {
            attendance: 0.4,
            engagement: 0.3,
            conversion: 0.2,
            timeSpent: 0.1
        };
        
        // Calculate component scores (0-100)
        const attendanceScore = Math.min(100, (attendanceRate / EVENT_BENCHMARKS.attendanceRate) * 100);
        const engagementScore = Math.min(100, (engagementRate * 100) / 10); // Assuming 10% is excellent
        const conversionScore = Math.min(100, (conversionRate * 100) / 5);   // Assuming 5% is excellent
        const timeScore = Math.min(100, (avgEngagementTime / 300) * 100);    // 5 minutes is excellent
        
        // Calculate weighted score
        return Math.round(
            (attendanceScore * weights.attendance) +
            (engagementScore * weights.engagement) +
            (conversionScore * weights.conversion) +
            (timeScore * weights.timeSpent)
        );
    }

    /**
     * Get performance tier based on score
     * @param {number} score - Performance score (0-100)
     * @returns {string} - Performance tier
     * @private
     */
    getPerformanceTier(score) {
        if (score >= 90) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 50) return 'average';
        return 'needs_improvement';
    }

    /**
     * Initialize event metrics object
     * @returns {Object} - Initialized metrics object
     * @private
     */
    initializeEventMetrics() {
        return {
            // Count metrics
            totalEvents: 0,
            virtualEvents: 0,
            inPersonEvents: 0,
            totalCapacity: 0,
            totalRSVPs: 0,
            totalAttendees: 0,
            totalNoShows: 0,
            totalWaitlist: 0,
            
            // Rate metrics
            attendanceRate: 0,
            noShowRate: 0,
            fillRate: 0,
            virtualPercentage: 0,
            
            // Engagement metrics
            totalEngagedSessions: 0,
            avgEngagementRate: 0,
            avgEngagementTime: 0,
            
            // Performance metrics
            avgPerformanceScore: 0,
            performanceTiers: {
                excellent: 0,
                good: 0,
                average: 0,
                needs_improvement: 0
            }
        };
    }

    /**
     * Update event metrics with new event data
     * @param {Object} metrics - Metrics object to update
     * @param {Object} event - Event data
     * @param {boolean} isVirtual - Whether the event is virtual
     * @private
     */
    updateEventMetrics(metrics, event, isVirtual) {
        metrics.totalEvents++;
        
        if (isVirtual) {
            metrics.virtualEvents++;
        } else {
            metrics.inPersonEvents++;
        }
        
        // Basic metrics
        metrics.totalCapacity += parseInt(event.Capacity || 0, 10);
        metrics.totalRSVPs += parseInt(event.RSVPs || 0, 10);
        metrics.totalAttendees += parseInt(event.Attendees || 0, 10);
        metrics.totalNoShows += parseInt(event['No Shows'] || 0, 10);
        metrics.totalWaitlist += parseInt(event.Waitlist || 0, 10);
        
        // Engagement metrics
        const engagedSessions = parseInt(event['Engaged sessions'] || 0, 10);
        const engagementRate = parseFloat(event['Engagement rate'] || 0);
        const engagementTime = parseFloat(event['Average engagement time'] || 0);
        
        metrics.totalEngagedSessions += engagedSessions;
        metrics.avgEngagementRate = ((metrics.avgEngagementRate * (metrics.totalEvents - 1)) + engagementRate) / metrics.totalEvents;
        metrics.avgEngagementTime = ((metrics.avgEngagementTime * (metrics.totalEvents - 1)) + engagementTime) / metrics.totalEvents;
    }
    
    /**
     * Calculate aggregate metrics across all events
     * @param {Object} metrics - Metrics object to update
     * @private
     */
    calculateAggregateMetrics(metrics) {
        // Calculate rates for the main metrics
        metrics.attendanceRate = metrics.totalRSVPs > 0 ? 
            (metrics.totalAttendees / metrics.totalRSVPs) * 100 : 0;
            
        metrics.noShowRate = metrics.totalRSVPs > 0 ? 
            (metrics.totalNoShows / metrics.totalRSVPs) * 100 : 0;
            
        metrics.fillRate = metrics.totalCapacity > 0 ? 
            (metrics.totalRSVPs / metrics.totalCapacity) * 100 : 0;
            
        metrics.virtualPercentage = metrics.totalEvents > 0 ? 
            (metrics.virtualEvents / metrics.totalEvents) * 100 : 0;
        
        // Calculate rates for each category
        ['byType', 'byState', 'byPlatform', 'byOrganizer'].forEach(category => {
            if (metrics[category]) {
                Object.values(metrics[category]).forEach(item => {
                    this.calculateEventRates(item);
                });
            }
        });
    }
    
    /**
     * Generate insights based on event metrics
     * @param {Object} metrics - Aggregated metrics
     * @param {Array} events - Processed events
     * @returns {Object} - Insights object with keyStrengths, improvementAreas, and recommendations
     * @private
     */
    generateInsights(metrics, events) {
        const insights = {
            keyStrengths: [],
            improvementAreas: [],
            recommendations: []
        };
        
        // Check attendance rate
        if (metrics.attendanceRate > EVENT_BENCHMARKS.attendanceRate * 1.1) {
            insights.keyStrengths.push('High attendance rate');
        } else if (metrics.attendanceRate < EVENT_BENCHMARKS.attendanceRate * 0.8) {
            insights.improvementAreas.push('Low attendance rate');
        }
        
        // Check no-show rate
        if (metrics.noShowRate < EVENT_BENCHMARKS.noShowRate * 0.8) {
            insights.keyStrengths.push('Low no-show rate');
        } else if (metrics.noShowRate > EVENT_BENCHMARKS.noShowRate * 1.2) {
            insights.improvementAreas.push('High no-show rate');
        }
        
        // Check fill rate
        if (metrics.fillRate > EVENT_BENCHMARKS.fillRate * 1.1) {
            insights.keyStrengths.push('High event fill rate');
        } else if (metrics.fillRate < EVENT_BENCHMARKS.fillRate * 0.8) {
            insights.improvementAreas.push('Low event fill rate');
        }
        
        // Generate recommendations based on insights
        if (insights.improvementAreas.includes('Low attendance rate')) {
            insights.recommendations.push(
                'Improve event marketing and promotion to increase attendance.'
            );
        }
        
        if (insights.improvementAreas.includes('High no-show rate')) {
            insights.recommendations.push(
                'Implement reminder emails/SMS before events to reduce no-shows.'
            );
        }
        
        // Add event type performance insights
        if (metrics.byType) {
            const sortedTypes = Object.entries(metrics.byType)
                .sort((a, b) => b[1].attendanceRate - a[1].attendanceRate);
                
            if (sortedTypes.length > 0) {
                const [bestType, bestMetrics] = sortedTypes[0];
                insights.keyStrengths.push(
                    `Best performing event type: ${bestType} with ${bestMetrics.attendanceRate.toFixed(1)}% attendance`
                );
                
                if (sortedTypes.length > 1) {
                    const [worstType, worstMetrics] = sortedTypes[sortedTypes.length - 1];
                    if (worstMetrics.attendanceRate < EVENT_BENCHMARKS.attendanceRate * 0.7) {
                        insights.improvementAreas.push(
                            `Low attendance for event type: ${worstType} (${worstMetrics.attendanceRate.toFixed(1)}%)`
                        );
                    }
                }
            }
        }
        
        return insights;
    }
    
    /**
     * Format metrics for the API response
     * @param {Object} metrics - Raw metrics
     * @param {Array} events - Processed events
     * @returns {Object} - Formatted metrics
     * @private
     */
    formatMetrics(metrics, events) {
        // Calculate average performance score across all events
        const totalScore = events.reduce((sum, event) => sum + (event.metrics.performanceScore || 0), 0);
        const avgScore = events.length > 0 ? totalScore / events.length : 0;
        
        // Count performance tiers
        const performanceTiers = {
            excellent: 0,
            good: 0,
            average: 0,
            needs_improvement: 0
        };
        
        events.forEach(event => {
            performanceTiers[event.metrics.performanceTier]++;
        });
        
        // Get top tags
        const topTags = Array.from(metrics.tags.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));
        
        return {
            overview: {
                totalEvents: metrics.totalEvents,
                virtualEvents: metrics.virtualEvents,
                inPersonEvents: metrics.inPersonEvents,
                virtualPercentage: metrics.virtualPercentage,
                avgPerformanceScore: parseFloat(avgScore.toFixed(1)),
                performanceTiers
            },
            attendance: {
                totalCapacity: metrics.totalCapacity,
                totalRSVPs: metrics.totalRSVPs,
                totalAttendees: metrics.totalAttendees,
                totalNoShows: metrics.totalNoShows,
                totalWaitlist: metrics.totalWaitlist,
                attendanceRate: parseFloat(metrics.attendanceRate.toFixed(2)),
                noShowRate: parseFloat(metrics.noShowRate.toFixed(2)),
                fillRate: parseFloat(metrics.fillRate.toFixed(2))
            },
            engagement: {
                totalEngagedSessions: metrics.totalEngagedSessions,
                avgEngagementRate: parseFloat(metrics.avgEngagementRate.toFixed(2)),
                avgEngagementTime: parseFloat(metrics.avgEngagementTime.toFixed(1))
            },
            byType: metrics.byType,
            byState: metrics.byState,
            byPlatform: metrics.byPlatform,
            byOrganizer: metrics.byOrganizer,
            topLocations: Array.from(metrics.locations).slice(0, 10),
            topOrganizers: Array.from(metrics.organizers).slice(0, 10),
            topTags
        };

    /**
     * Calculate event rates and averages
     * @param {Object} metrics - Metrics to calculate rates for
     * @private
     */
    calculateEventRates(metrics) {
        metrics.attendanceRate = metrics.totalRSVPs > 0 ? 
            (metrics.totalAttendees / metrics.totalRSVPs) * 100 : 0;
            
        metrics.noShowRate = metrics.totalRSVPs > 0 ? 
            (metrics.totalNoShows / metrics.totalRSVPs) * 100 : 0;
            
        metrics.fillRate = metrics.totalCapacity > 0 ? 
            (metrics.totalRSVPs / metrics.totalCapacity) * 100 : 0;
            
        metrics.virtualPercentage = metrics.totalEvents > 0 ? 
            (metrics.virtualEvents / metrics.totalEvents) * 100 : 0;
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
                error: data.error || 'Unknown error occurred',
                timestamp: data.timestamp || new Date().toISOString()
            };
        }
        
        // If metrics is already formatted (from getMetrics), return as is
        if (data.metrics.overview) {
            return {
                success: true,
                type: 'event',
                ...data
            };
        }
        
        // Fallback for legacy format
        return {
            success: true,
            type: 'event',
            total: data.total || 0,
            metrics: {
                overview: {
                    totalEvents: data.metrics.totalEvents || 0,
                    virtualEvents: data.metrics.virtualEvents || 0,
                    inPersonEvents: data.metrics.inPersonEvents || 0,
                    virtualPercentage: data.metrics.virtualPercentage || 0,
                    avgPerformanceScore: 0,
                    performanceTiers: {
                        excellent: 0,
                        good: 0,
                        average: 0,
                        needs_improvement: 0
                    }
                },
                attendance: {
                    totalCapacity: data.metrics.totalCapacity || 0,
                    totalRSVPs: data.metrics.totalRSVPs || 0,
                    totalAttendees: data.metrics.totalAttendees || 0,
                    totalNoShows: data.metrics.totalNoShows || 0,
                    totalWaitlist: data.metrics.totalWaitlist || 0,
                    attendanceRate: data.metrics.attendanceRate || 0,
                    noShowRate: data.metrics.noShowRate || 0,
                    fillRate: data.metrics.fillRate || 0
                },
                engagement: {
                    totalEngagedSessions: data.metrics.totalEngagedSessions || 0,
                    avgEngagementRate: data.metrics.avgEngagementRate || 0,
                    avgEngagementTime: data.metrics.avgEngagementTime || 0
                },
                byType: data.metrics.byType || {},
                byState: data.metrics.byState || {},
                byPlatform: data.metrics.byPlatform || {},
                byOrganizer: data.metrics.byOrganizer || {},
                topLocations: Array.isArray(data.metrics.locations) ? 
                    data.metrics.locations.slice(0, 10) : [],
                topOrganizers: Array.isArray(data.metrics.organizers) ? 
                    data.metrics.organizers.slice(0, 10) : [],
                topTags: data.metrics.topTags || []
            },
            events: data.events || [],
            insights: data.insights || {
                keyStrengths: [],
                improvementAreas: [],
                recommendations: []
            },
            timestamp: data.timestamp || new Date().toISOString()
        };
    }

    /**
     * Generate suggestions based on event metrics and insights
     * @param {Object} data - Response data from getMetrics
     * @returns {Array} - List of suggestions
     */
    generateSuggestions(data) {
        const { metrics, insights } = data;
        const suggestions = [];
        
        // If we already have insights, use those
        if (insights && Array.isArray(insights.recommendations) && insights.recommendations.length > 0) {
            suggestions.push(...insights.recommendations);
        }
        
        // Fallback to basic suggestions if no insights available
        if (suggestions.length === 0) {
            if (metrics.attendance?.noShowRate > EVENT_BENCHMARKS.noShowRate) {
                suggestions.push('High no-show rate detected. Consider implementing reminder emails or texts before events.');
            }
            
            if (metrics.attendance?.attendanceRate < EVENT_BENCHMARKS.attendanceRate * 0.8) {
                suggestions.push('Low attendance rate. Consider improving your event marketing or timing.');
            }
            
            if (metrics.attendance?.fillRate < EVENT_BENCHMARKS.fillRate * 0.8) {
                suggestions.push('Low event fill rate. Consider adjusting your event capacity or marketing strategy.');
            }
        }
        
        // Add engagement-based suggestions
        if (metrics.engagement?.avgEngagementRate < 5) { // Assuming <5% is low
            suggestions.push('Low engagement rate. Consider making your events more interactive or relevant to your audience.');
        }
        
        // Add performance tier based suggestions
        const performanceTiers = metrics.overview?.performanceTiers;
        if (performanceTiers) {
            const totalEvents = metrics.overview.totalEvents;
            const needsImprovementPct = (performanceTiers.needs_improvement / totalEvents) * 100;
            
            if (needsImprovementPct > 50) {
                suggestions.push('More than half of your events need improvement. Consider reviewing your event strategy.');
            }
            
            if (performanceTiers.excellent / totalEvents > 0.3) {
                suggestions.push('Great job! A significant portion of your events are performing excellently.');
            }
        }
        
        // Ensure we always return at least one suggestion
        if (suggestions.length === 0) {
            // Analyze event types for specific suggestions
            if (metrics.byType) {
                const eventTypes = Object.entries(metrics.byType);
                if (eventTypes.length > 0) {
                    // Find best performing event type
                    const bestType = eventTypes.reduce((best, [type, typeMetrics]) => {
                        return (!best || typeMetrics.attendanceRate > best.attendanceRate) ? 
                            { type, ...typeMetrics } : best;
                    }, null);
                    
                    if (bestType && bestType.attendanceRate > EVENT_BENCHMARKS.attendanceRate * 1.1) {
                        suggestions.push(
                            `Your best performing event type is "${bestType.type}" with an attendance rate of ${bestType.attendanceRate.toFixed(1)}%. ` +
                            'Consider hosting more events of this type.'
                        );
                    }
                }
            }
            
            // Check virtual vs in-person performance
            const virtualPct = metrics.overview?.virtualPercentage || 0;
            if (virtualPct > 70) {
                suggestions.push('Most of your events are virtual. Consider adding more in-person events to engage your local community.');
            } else if (virtualPct < 30) {
                suggestions.push('Most of your events are in-person. Consider adding more virtual events to reach a wider audience.');
            }
        }
        
        return suggestions.length > 0 ? suggestions : ['Your event performance looks good! Keep up the great work!'];
    }
}

module.exports = EventConnector;
