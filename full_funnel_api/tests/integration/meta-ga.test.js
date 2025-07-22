const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../app');
const MetaConnector = require('../../connectors/meta');
const GAConnector = require('../../connectors/ga');

jest.mock('../../connectors/meta');
jest.mock('../../connectors/ga');

describe('Meta & GA Integration Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.GA_PROPERTY_ID = 'mock-property';
    process.env.GA_CLIENT_EMAIL = 'mock@email.com';
    process.env.GA_PRIVATE_KEY = 'mock-key';
    process.env.META_ACCESS_TOKEN = 'mock-token';
    process.env.META_API_VERSION = 'v17.0';
  });

  describe('Meta API Endpoints', () => {
    const mockMetaConfig = {
      accessToken: 'mock-token',
      apiVersion: 'v17.0'
    };

    const mockGAConfig = {
      propertyId: 'mock-property',
      credentials: {
        client_email: 'mock@email.com',
        private_key: 'mock-key'
      }
    };

    const mockCampaignData = {
      data: [
        {
          id: '123',
          name: 'Test Campaign',
          insights: {
            impressions: 1000,
            clicks: 50,
            spend: 100
          }
        }
      ]
    };

    beforeEach(() => {
      MetaConnector.prototype.getCampaigns = jest.fn().mockResolvedValue(mockCampaignData);
      MetaConnector.prototype.getAds = jest.fn().mockResolvedValue(mockCampaignData);
      MetaConnector.prototype.getInsights = jest.fn().mockResolvedValue(mockCampaignData);
    });

    test('GET /meta/campaigns/:adAccountId returns campaign data', async () => {
      const res = await request(app)
        .get('/api/v1/meta/campaigns/123456789')
        .query({
          start_time: '2025-01-01',
          end_time: '2025-12-31'
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockCampaignData);
      expect(MetaConnector.prototype.getCampaigns).toHaveBeenCalledWith(
        '123456789',
        expect.any(Object)
      );
    });

    test('GET /meta/ads/:adAccountId returns ad data', async () => {
      const res = await request(app)
        .get('/api/v1/meta/ads/123456789')
        .query({
          start_time: '2025-01-01',
          end_time: '2025-12-31'
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockCampaignData);
      expect(MetaConnector.prototype.getAds).toHaveBeenCalledWith(
        '123456789',
        expect.any(Object)
      );
    });

    test('GET /meta/insights/:adAccountId returns insights data', async () => {
      const res = await request(app)
        .get('/api/v1/meta/insights/123456789')
        .query({
          start_time: '2025-01-01',
          end_time: '2025-12-31'
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockCampaignData);
      expect(MetaConnector.prototype.getInsights).toHaveBeenCalledWith(
        '123456789',
        expect.any(Object)
      );
    });
  });

  describe('GA API Endpoints', () => {
    const mockGAData = {
      dimensions: ['date'],
      metrics: ['sessions', 'users'],
      rows: [
        {
          date: '20250101',
          sessions: 1000,
          users: 500
        }
      ],
      rowCount: 1
    };

    beforeEach(() => {
      GAConnector.prototype._initializeClient = jest.fn().mockReturnValue({});
      GAConnector.prototype.getRealTimeData = jest.fn().mockResolvedValue(mockGAData);
      GAConnector.prototype.getReport = jest.fn().mockResolvedValue(mockGAData);
      GAConnector.prototype.getEvents = jest.fn().mockResolvedValue(mockGAData);
      GAConnector.prototype.getConversions = jest.fn().mockResolvedValue(mockGAData);
    });

    test('GET /ga/realtime returns real-time data', async () => {
      const res = await request(app)
        .get('/api/v1/ga/realtime')
        .query({
          metrics: 'activeUsers',
          dimensions: 'country'
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockGAData);
      expect(GAConnector.prototype.getRealTimeData).toHaveBeenCalledWith(
        ['activeUsers'],
        ['country']
      );
    });

    test('GET /ga/report returns report data', async () => {
      const res = await request(app)
        .get('/api/v1/ga/report')
        .query({
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          metrics: 'sessions,users',
          dimensions: 'date'
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockGAData);
      expect(GAConnector.prototype.getReport).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          metrics: ['sessions', 'users'],
          dimensions: ['date']
        })
      );
    });

    test('GET /ga/events returns event data', async () => {
      const res = await request(app)
        .get('/api/v1/ga/events')
        .query({
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          event_names: 'purchase,signup'
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockGAData);
      expect(GAConnector.prototype.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          eventNames: ['purchase', 'signup']
        })
      );
    });

    test('GET /ga/conversions returns conversion data', async () => {
      const res = await request(app)
        .get('/api/v1/ga/conversions')
        .query({
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          conversion_events: 'purchase'
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockGAData);
      expect(GAConnector.prototype.getConversions).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          conversionEvents: ['purchase']
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('Returns 400 for invalid date range', async () => {
      const res = await request(app)
        .get('/api/v1/meta/campaigns/123456789')
        .query({
          start_time: '2025-12-31',
          end_time: '2025-01-01' // End before start
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'INVALID_DATE_RANGE');
    });

    test('Returns 400 for invalid ad account ID', async () => {
      const res = await request(app)
        .get('/api/v1/meta/campaigns/invalid-id')
        .query({
          start_time: '2025-01-01',
          end_time: '2025-12-31'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'INVALID_AD_ACCOUNT_ID');
    });
  });

  describe('Caching', () => {
    beforeEach(() => {
      const { mockCache } = require('../setup');
      mockCache.clear();
    });

    test('Returns cached response for repeated GA requests', async () => {
      const { mockCache } = require('../setup');

      // Define query parameters that will be used for both requests
      const query = {
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        metrics: 'sessions,users',
        dimensions: 'date'
      };

      console.log('Initial cache state:', mockCache);
      console.log('Initial cache keys:', Array.from(mockCache.keys()));

      // First request
      const res1 = await request(app)
        .get('/api/v1/ga/report')
        .query(query);

      console.log('\nAfter first request:');
      console.log('Cache contents:', mockCache);
      console.log('Cache keys:', Array.from(mockCache.keys()));
      console.log('Response headers:', res1.headers);

      expect(res1.status).toBe(200);
      expect(res1.headers['x-cache']).toBe('MISS');

      // Second request - use exact same query object
      const res2 = await request(app)
        .get('/api/v1/ga/report')
        .query(query);

      console.log('\nAfter second request:');
      console.log('Cache contents:', mockCache);
      console.log('Cache keys:', Array.from(mockCache.keys()));
      console.log('Response headers:', res2.headers);

      expect(res2.status).toBe(200);
      expect(res2.headers['x-cache']).toBe('HIT');
      expect(GAConnector.prototype.getReport).toHaveBeenCalledTimes(1);
    });
  });
});
