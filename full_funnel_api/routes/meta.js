const express = require('express');
const router = express.Router();
const MetaConnector = require('../connectors/meta');
const { validateDateRange, validateAdAccountId } = require('../middleware/validation');
const { cacheMiddleware } = require('../middleware/cache');

// Initialize Meta connector with config
const metaConnector = new MetaConnector({
  accessToken: process.env.META_ACCESS_TOKEN,
  apiVersion: process.env.META_API_VERSION || 'v17.0'
});

/**
 * Get campaigns for an ad account
 * GET /meta/campaigns/:adAccountId
 */
router.get('/campaigns/:adAccountId', 
  validateAdAccountId,
  validateDateRange,
  cacheMiddleware(300), // Cache for 5 minutes
  async (req, res) => {
    try {
      const { adAccountId } = req.params;
      const { start_time, end_time, status } = req.query;
      
      const campaigns = await metaConnector.getCampaigns(adAccountId, {
        time_range: { 
          since: start_time, 
          until: end_time 
        },
        status
      });
      
      res.json(campaigns);
    } catch (error) {
      res.status(error.status || 500).json({ error });
    }
});

/**
 * Get ads for an ad account
 * GET /meta/ads/:adAccountId
 */
router.get('/ads/:adAccountId',
  validateAdAccountId,
  validateDateRange,
  cacheMiddleware(300),
  async (req, res) => {
    try {
      const { adAccountId } = req.params;
      const { start_time, end_time, campaign_id, status } = req.query;
      
      const ads = await metaConnector.getAds(adAccountId, {
        time_range: {
          since: start_time,
          until: end_time
        },
        campaign_id,
        status
      });
      
      res.json(ads);
    } catch (error) {
      res.status(error.status || 500).json({ error });
    }
});

/**
 * Get insights for an ad account
 * GET /meta/insights/:adAccountId
 */
router.get('/insights/:adAccountId',
  validateAdAccountId,
  validateDateRange,
  cacheMiddleware(300),
  async (req, res) => {
    try {
      const { adAccountId } = req.params;
      const { start_time, end_time, level, fields } = req.query;
      
      const insights = await metaConnector.getInsights(adAccountId, {
        time_range: {
          since: start_time,
          until: end_time
        },
        level: level || 'campaign',
        fields: fields || undefined
      });
      
      res.json(insights);
    } catch (error) {
      res.status(error.status || 500).json({ error });
    }
});

/**
 * Get custom audiences for an ad account
 * GET /meta/audiences/:adAccountId
 */
router.get('/audiences/:adAccountId',
  validateAdAccountId,
  cacheMiddleware(300),
  async (req, res) => {
    try {
      const { adAccountId } = req.params;
      const audiences = await metaConnector.getCustomAudiences(adAccountId);
      res.json(audiences);
    } catch (error) {
      res.status(error.status || 500).json({ error });
    }
});

/**
 * Create a custom audience
 * POST /meta/audiences/:adAccountId
 */
router.post('/audiences/:adAccountId',
  validateAdAccountId,
  async (req, res) => {
    try {
      const { adAccountId } = req.params;
      const audience = await metaConnector.createCustomAudience(adAccountId, req.body);
      res.status(201).json(audience);
    } catch (error) {
      res.status(error.status || 500).json({ error });
    }
});

module.exports = router;
