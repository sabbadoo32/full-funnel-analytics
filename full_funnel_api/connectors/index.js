const GAConnector = require('./ga');
const MetaConnector = require('./meta');

class ConnectorManager {
    constructor() {
        this.connectors = {
            ga: null,
            meta: null
        };
        this.initialized = false;
    }

    async initialize() {
        try {
            // Initialize GA Connector if credentials exist
            if (process.env.GA_PROPERTY_ID && process.env.GA_CREDENTIALS) {
                this.connectors.ga = new GAConnector({
                    propertyId: process.env.GA_PROPERTY_ID,
                    credentials: JSON.parse(process.env.GA_CREDENTIALS)
                });
                console.log('✅ Google Analytics connector initialized');
            } else {
                console.warn('⚠️ Google Analytics connector not configured - missing GA_PROPERTY_ID or GA_CREDENTIALS');
            }

            // Initialize Meta Connector if access token exists
            if (process.env.META_ACCESS_TOKEN && process.env.META_API_VERSION) {
                this.connectors.meta = new MetaConnector({
                    accessToken: process.env.META_ACCESS_TOKEN,
                    apiVersion: process.env.META_API_VERSION
                });
                console.log('✅ Meta connector initialized');
            } else {
                console.warn('⚠️ Meta connector not configured - missing META_ACCESS_TOKEN or META_API_VERSION');
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('❌ Error initializing connectors:', error);
            this.initialized = false;
            return false;
        }
    }

    getConnector(type) {
        if (!this.initialized) {
            throw new Error('Connectors not initialized. Call initialize() first.');
        }
        return this.connectors[type] || null;
    }

    isAvailable(type) {
        return !!this.connectors[type];
    }
}

// Create and export a singleton instance
const connectorManager = new ConnectorManager();
module.exports = connectorManager;
