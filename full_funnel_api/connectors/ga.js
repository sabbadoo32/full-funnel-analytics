const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { JWT } = require('google-auth-library');

class GAConnector {
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

  async getRealTimeData(metrics = ['activeUsers'], dimensions = ['country']) {
    try {
      const [response] = await this.client.runRealtimeReport({
        property: `properties/${this.propertyId}`,
        dimensions: dimensions.map(d => ({ name: d })),
        metrics: metrics.map(m => ({ name: m }))
      });

      return this._formatResponse(response);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async getReport({
    startDate,
    endDate,
    metrics = ['sessions', 'activeUsers', 'newUsers'],
    dimensions = ['date'],
    orderBy = [],
    limit = 10000
  }) {
    try {
      const [response] = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: dimensions.map(d => ({ name: d })),
        metrics: metrics.map(m => ({ name: m })),
        orderBys: orderBy,
        limit
      });

      return this._formatResponse(response);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async getEvents({
    startDate,
    endDate,
    eventNames = [],
    dimensions = ['eventName', 'date']
  }) {
    try {
      const [response] = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: dimensions.map(d => ({ name: d })),
        metrics: [
          { name: 'eventCount' },
          { name: 'eventValue' },
          { name: 'averageEventValue' }
        ],
        dimensionFilter: eventNames.length > 0 ? {
          filter: {
            fieldName: 'eventName',
            inListFilter: { values: eventNames }
          }
        } : undefined
      });

      return this._formatResponse(response);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async getConversions({
    startDate,
    endDate,
    conversionEvents = [],
    dimensions = ['eventName', 'date']
  }) {
    try {
      const [response] = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: dimensions.map(d => ({ name: d })),
        metrics: [
          { name: 'conversions' },
          { name: 'conversionValue' },
          { name: 'averageConversionValue' }
        ],
        dimensionFilter: conversionEvents.length > 0 ? {
          filter: {
            fieldName: 'eventName',
            inListFilter: { values: conversionEvents }
          }
        } : undefined
      });

      return this._formatResponse(response);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  _formatResponse(response) {
    const dimensionHeaders = response.dimensionHeaders.map(h => h.name);
    const metricHeaders = response.metricHeaders.map(h => h.name);
    
    return {
      dimensions: dimensionHeaders,
      metrics: metricHeaders,
      rows: response.rows.map(row => {
        const formattedRow = {};
        
        // Add dimensions
        row.dimensionValues.forEach((value, index) => {
          formattedRow[dimensionHeaders[index]] = value.value;
        });
        
        // Add metrics
        row.metricValues.forEach((value, index) => {
          formattedRow[metricHeaders[index]] = Number(value.value);
        });
        
        return formattedRow;
      }),
      rowCount: response.rowCount,
      metadata: {
        currencyCode: response.metadata?.currencyCode,
        timeZone: response.metadata?.timeZone
      }
    };
  }

  _handleError(error) {
    return {
      status: error.code || 500,
      code: error.details?.reason || 'UNKNOWN_ERROR',
      message: error.message,
      details: error.details
    };
  }
}

module.exports = GAConnector;
