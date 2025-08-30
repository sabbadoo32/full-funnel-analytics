const GAConnector = require('./ga');
const MetaConnector = require('./meta');
const EmailConnector = require('./EmailConnector');
const SocialConnector = require('./SocialConnector');
const AdConnector = require('./AdConnector');
const EventConnector = require('./EventConnector');
const ImpactiveConnector = require('./ImpactiveConnector');
const MobilizeConnector = require('./MobilizeConnector');
const CTVConnector = require('./CTVConnector');

class ConnectorManager {
    constructor() {
        this.connectors = {
            ga: new GAConnector(),
            meta: new MetaConnector(),
            email: new EmailConnector(),
            social: new SocialConnector(),
            ads: new AdConnector(),
            events: new EventConnector(),
            impactive: new ImpactiveConnector(),
            mobilize: new MobilizeConnector(),
            ctv: new CTVConnector()
        };
        
        // Map schema fields to connectors
        this.fieldToConnectorMap = this.createFieldMapping();
    }
    
    createFieldMapping() {
        return {
            // Google Analytics
            'Sessions': 'ga',
            'Active users': 'ga',
            'New users': 'ga',
            'Average engagement time per session': 'ga',
            'Key events': 'ga',
            'Session key event rate': 'ga',
            
            // Meta
            'Post ID': 'meta',
            'Reactions': 'meta',
            'Comments': 'meta',
            'Shares': 'meta',
            'Reach': 'meta',
            
            // Email
            'Email': 'email',
            'Opened': 'email',
            'Clicked': 'email',
            'Bounced': 'email',
            'Unsubscribed': 'email',
            
            // Events
            'Event Name': 'events',
            'Event Type': 'events',
            'Event Date': 'events',
            'Attendees': 'events',
            'RSVPs': 'events',
            
            // Impactive
            'action_id': 'impactive',
            'action_type': 'impactive',
            'completed': 'impactive',
            'opt_in': 'impactive',
            'video_100p_completion_rate': 'impactive',
            'video_avg_percent_viewed': 'impactive',
            'video_avg_time_viewed': 'impactive',
            'video_audible_visible_on_complete_imps': 'impactive',
            'video_audible_visible_50p_imps': 'impactive',
            'video_audible_visible_impressions': 'impactive',
            'video_audible_visible_rate': 'impactive',
            'video_audible_visible_viewability': 'impactive',
            
            // Mobilize
            'event_id': 'mobilize',
            'event_title': 'mobilize',
            'current_attendees': 'mobilize',
            'volunteer_count': 'mobilize',
            
            // CTV
            'ctv_impressions': 'ctv',
            'ctv_views': 'ctv',
            'ctv_completions': 'ctv',
            'ctv_spend': 'ctv',
            'ctv_clicks': 'ctv',
            'ctv_platform': 'ctv',
            'ctv_device_type': 'ctv'
        };
    }
    
    /**
     * Get the appropriate connector for a given field
     */
    getConnectorForField(field) {
        const connectorKey = this.fieldToConnectorMap[field];
        return connectorKey ? this.connectors[connectorKey] : null;
    }
    
    /**
     * Query data across all relevant connectors
     */
    async query(filters = {}) {
        const results = {};
        const errors = [];
        
        // Determine which connectors we need based on filter fields
        const requiredConnectors = new Set();
        
        // Check filter fields
        Object.keys(filters).forEach(field => {
            const connector = this.getConnectorForField(field);
            if (connector) {
                requiredConnectors.add(connector);
            }
        });
        
        // If no specific fields, use all connectors
        const connectorsToQuery = requiredConnectors.size > 0 
            ? Array.from(requiredConnectors) 
            : Object.values(this.connectors);
        
        // Execute queries in parallel
        const queries = connectorsToQuery.map(async connector => {
            try {
                const result = await connector.query(filters);
                return { 
                    type: connector.constructor.name.replace('Connector', '').toLowerCase(),
                    data: result 
                };
            } catch (error) {
                console.error(`Error querying ${connector.constructor.name}:`, error);
                errors.push({
                    connector: connector.constructor.name,
                    error: error.message
                });
                return null;
            }
        });
        
        // Wait for all queries to complete
        const queryResults = await Promise.all(queries);
        
        // Combine results
        queryResults.forEach(result => {
            if (result) {
                results[result.type] = result.data;
            }
        });
        
        return {
            success: errors.length === 0,
            data: results,
            errors: errors.length > 0 ? errors : undefined
        };
    }
    
    /**
     * Get metrics from all connectors
     */
    async getMetrics(query = {}) {
        const metrics = {};
        const errors = [];
        
        // Get metrics from all connectors in parallel
        const metricPromises = Object.entries(this.connectors).map(async ([key, connector]) => {
            try {
                const result = await connector.getMetrics(query);
                return { key, data: result };
            } catch (error) {
                console.error(`Error getting metrics from ${key}:`, error);
                errors.push({
                    connector: key,
                    error: error.message
                });
                return null;
            }
        });
        
        // Wait for all metrics to complete
        const metricResults = await Promise.all(metricPromises);
        
        // Combine results
        metricResults.forEach(result => {
            if (result) {
                metrics[result.key] = result.data;
            }
        });
        
        return {
            success: errors.length === 0,
            metrics,
            errors: errors.length > 0 ? errors : undefined,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Get a specific connector by type
     */
    getConnector(type) {
        return this.connectors[type.toLowerCase()] || null;
    }
}

// Export a singleton instance
module.exports = new ConnectorManager();
