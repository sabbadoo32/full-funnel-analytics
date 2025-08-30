const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { JWT } = require('google-auth-library');
const {
  getWebMetrics,
  getConversionMetrics,
  getPerformanceTier,
  WEB_BENCHMARKS
} = require('../helpers/webAnalytics');

class WebAnalyticsConnector {
  constructor(config) {
    this.propertyId = config.propertyId;
    this.credentials = config.credentials;
    this.client = this._initializeClient();
  }

  _initializeClient() {
    const jwt = new JWT({
      email: this.credentials.client_email,
      key: this.credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly']
    });
    return new BetaAnalyticsDataClient({ auth: jwt });
  }

  async getMetrics(query = {}) {
    try {
      // Get core web metrics
      const webMetrics = await this._getCoreWebMetrics(query);
      
      // Get conversion metrics if specified
      const conversionMetrics = query.conversionEvents?.length 
        ? await this._getConversionMetrics(query) 
        : {};

      // Combine and enhance with performance analysis
      return {
        success: true,
        data: {
          ...webMetrics,
          ...conversionMetrics,
          timestamp: new Date().toISOString(),
          propertyId: this.propertyId
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch web analytics data'
      };
    }
  }

  async _getCoreWebMetrics({ startDate, endDate, dimensions = [] }) {
    const [response] = await this.client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'date' },
        { name: 'landingPagePath' },
        { name: 'sourceMedium' },
        ...dimensions.map(d => ({ name: d }))
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'exitRate' },
        { name: 'engagementRate' },
        { name: 'eventCount' },
        { name: 'conversions' },
        { name: 'totalRevenue' },
        { name: 'ecommercePurchases' },
        { name: 'purchaseRevenue' },
        { name: 'transactions' }
      ]
    });

    // Format response and enhance with web analytics helper
    const formattedData = this._formatResponse(response);
    return getWebMetrics(formattedData[0] || {});
  }

  async _getConversionMetrics({ startDate, endDate, conversionEvents = [] }) {
    if (!conversionEvents.length) return {};

    const [response] = await this.client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'eventName' },
        { name: 'date' },
        { name: 'sourceMedium' },
        { name: 'campaign' },
        { name: 'landingPagePath' },
        { name: 'deviceCategory' },
        { name: 'country' }
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'conversions' },
        { name: 'totalRevenue' },
        { name: 'purchaseRevenue' },
        { name: 'transactions' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: { values: conversionEvents }
        }
      }
    });

    const formattedData = this._formatResponse(response);
    return getConversionMetrics(formattedData[0] || {});
  }

  _formatResponse(response) {
    const { rows = [] } = response;
    return rows.map(row => {
      const result = {};
      row.dimensionHeaders?.forEach((header, i) => {
        result[header.name] = row.dimensionValues[i].value;
      });
      row.metricHeaders?.forEach((header, i) => {
        result[header.name] = parseFloat(row.metricValues[i].value);
      });
      return result;
    });
  }
}

module.exports = WebAnalyticsConnector;
