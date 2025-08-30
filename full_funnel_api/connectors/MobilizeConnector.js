const BaseConnector = require('./BaseConnector');
const mongoose = require('mongoose');
const { 
  getEventDetails,
  calculateEventMetrics,
  generateInsights,
  getPerformanceTier,
  BENCHMARKS
} = require('../helpers/mobilizeAnalytics');

class MobilizeConnector extends BaseConnector {
    constructor() {
        super();
        this.collection = 'full_funnel';
        this.requiredFields = [
            'event_id', 'event_title', 'event_type', 'event_description',
            'start_time', 'end_time', 'timezone', 'location', 'address',
            'city', 'state', 'zip', 'is_virtual', 'virtual_url',
            'max_attendees', 'current_attendees', 'volunteer_count',
            'organization_id', 'organization_name', 'campaign_id',
            'created_date', 'updated_date', 'status', 'browser_url'
        ];
    }

    async query(filters = {}) {
        try {
            const query = { 
                ...filters,
                'event_id': { $exists: true },
                'event_title': { $exists: true }
            };

            const Campaign = mongoose.model('Campaign');
            return await Campaign.find(query)
                .select(this.requiredFields.join(' '))
                .sort({ 'start_time': -1 })
                .lean()
                .exec();
        } catch (error) {
            console.error('Error querying Mobilize data:', error);
            throw new Error('Failed to fetch Mobilize data');
        }
    }

    /**
     * Get metrics for Mobilize events with enhanced analytics
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} - Enhanced event metrics with insights
     */
    async getMetrics(query = {}) {
        try {
            const events = await this.query(query);
            
            if (!events?.length) {
                return {
                    success: true,
                    total: 0,
                    metrics: {
                        overview: {
                            totalEvents: 0,
                            totalAttendees: 0,
                            totalCapacity: 0,
                            totalVolunteers: 0,
                            avgAttendanceRate: 0,
                            avgVolunteerRatio: 0,
                            performanceScore: 0,
                            performanceTier: 'needs_improvement',
                            upcomingEvents: 0,
                            pastEvents: 0,
                            virtualEvents: 0,
                            inPersonEvents: 0
                        },
                        byEventType: {},
                        byCategory: {},
                        byState: {},
                        byOrganization: {},
                        byTime: {
                            byHour: Array(24).fill(0),
                            byDay: Array(7).fill(0)
                        }
                    },
                    events: [],
                    insights: {
                        keyStrengths: [],
                        improvementAreas: [],
                        recommendations: ['No event data available. Consider creating and promoting more events.'],
                        performanceTier: 'needs_improvement',
                        summary: 'No event data available.'
                    },
                    timestamp: new Date().toISOString()
                };
            }
            
            // Process each event with enhanced analytics
            const processedEvents = events.map(event => getEventDetails(event));
            
            // Calculate metrics
            const metrics = calculateEventMetrics(processedEvents);
            
            // Generate insights
            const insights = generateInsights(metrics);
            
            // Format the response
            return {
                success: true,
                total: processedEvents.length,
                metrics: {
                    overview: {
                        totalEvents: metrics.totalEvents,
                        totalAttendees: metrics.totalAttendees,
                        totalCapacity: metrics.totalCapacity,
                        totalVolunteers: metrics.totalVolunteers,
                        avgAttendanceRate: parseFloat(metrics.avgAttendanceRate.toFixed(4)),
                        avgVolunteerRatio: parseFloat(metrics.avgVolunteerRatio.toFixed(4)),
                        performanceScore: metrics.performanceScore,
                        performanceTier: insights.performanceTier || getPerformanceTier(metrics.performanceScore),
                        upcomingEvents: metrics.upcomingEvents,
                        pastEvents: metrics.pastEvents,
                        virtualEvents: metrics.virtualEvents,
                        inPersonEvents: metrics.inPersonEvents
                    },
                    byEventType: Object.entries(metrics.byEventType).reduce((acc, [type, data]) => {
                        acc[type] = {
                            count: data.count,
                            attendees: data.attendees,
                            capacity: data.capacity,
                            volunteers: data.volunteers,
                            attendanceRate: data.capacity > 0 ? data.attendees / data.capacity : 0,
                            volunteerRatio: data.attendees > 0 ? data.volunteers / data.attendees : 0
                        };
                        return acc;
                    }, {}),
                    byCategory: Object.entries(metrics.byCategory).reduce((acc, [category, data]) => {
                        acc[category] = {
                            count: data.count,
                            attendees: data.attendees,
                            capacity: data.capacity,
                            volunteers: data.volunteers,
                            attendanceRate: data.capacity > 0 ? data.attendees / data.capacity : 0,
                            volunteerRatio: data.attendees > 0 ? data.volunteers / data.attendees : 0
                        };
                        return acc;
                    }, {}),
                    byState: Object.entries(metrics.byState).reduce((acc, [state, data]) => {
                        acc[state] = {
                            count: data.count,
                            attendees: data.attendees,
                            capacity: data.capacity,
                            volunteers: data.volunteers,
                            attendanceRate: data.capacity > 0 ? data.attendees / data.capacity : 0,
                            volunteerRatio: data.attendees > 0 ? data.volunteers / data.attendees : 0
                        };
                        return acc;
                    }, {}),
                    byOrganization: Object.entries(metrics.byOrganization).reduce((acc, [orgId, data]) => {
                        acc[orgId] = {
                            name: data.name,
                            count: data.count,
                            attendees: data.attendees,
                            capacity: data.capacity,
                            volunteers: data.volunteers,
                            attendanceRate: data.capacity > 0 ? data.attendees / data.capacity : 0,
                            volunteerRatio: data.attendees > 0 ? data.volunteers / data.attendees : 0
                        };
                        return acc;
                    }, {}),
                    byTime: metrics.byTime
                },
                events: processedEvents,
                insights,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error getting Mobilize metrics:', error);
            return {
                success: false,
                error: `Failed to get Mobilize metrics: ${error.message}`,
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
                type: 'mobilize',
                ...data
            };
        }
        
        // Fallback for legacy format
        return {
            success: true,
            type: 'mobilize',
            total: data.total || 0,
            metrics: {
                overview: {
                    totalEvents: data.metrics?.totalEvents || 0,
                    totalAttendees: data.metrics?.totalAttendees || 0,
                    totalCapacity: data.metrics?.totalCapacity || 0,
                    totalVolunteers: data.metrics?.totalVolunteers || 0,
                    avgAttendanceRate: data.metrics?.attendanceRate || 0,
                    avgVolunteerRatio: data.metrics?.volunteerRatio || 0,
                    performanceScore: 0,
                    performanceTier: 'needs_improvement',
                    upcomingEvents: 0,
                    pastEvents: 0,
                    virtualEvents: data.metrics?.virtualEvents || 0,
                    inPersonEvents: data.metrics?.inPersonEvents || 0
                },
                byEventType: data.metrics?.byEventType || {},
                byCategory: {},
                byState: data.metrics?.byState || {},
                byOrganization: data.metrics?.byOrganization || {},
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
        
        if (metrics.avgFillRate < 60) {
            suggestions.push('Low event fill rate. Consider adjusting your event capacity or marketing strategy.');
        }
        
        if (metrics.virtualEvents === 0) {
            suggestions.push('No virtual events found. Consider adding virtual options to increase accessibility.');
        }
        
        if (metrics.avgAttendees < 5) {
            suggestions.push('Low average attendance. Consider consolidating events or improving outreach.');
        }
        
        return suggestions.length ? suggestions : ['Your Mobilize metrics look good!'];
    }
}

module.exports = MobilizeConnector;
