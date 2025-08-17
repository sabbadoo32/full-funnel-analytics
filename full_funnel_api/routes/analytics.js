const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');

// Get full analytics overview for a campaign
router.get('/campaigns/:id/analytics', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    const analytics = campaign.getAnalyticsOverview();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific analytics domain for a campaign
router.get('/campaigns/:id/analytics/:domain', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const domain = req.params.domain;
    let analytics;

    switch (domain) {
      case 'email':
        analytics = campaign.getEmailPerformance();
        break;
      case 'social':
        analytics = campaign.getSocialEngagement();
        break;
      case 'ads':
        analytics = campaign.getAdPerformance();
        break;
      case 'web':
        analytics = {
          ...campaign.getWebMetrics(),
          ...campaign.getWebEngagement(),
          conversions: campaign.getWebConversions()
        };
        break;
      case 'ctv':
        analytics = {
          ...campaign.getCTVMetrics(),
          preferences: campaign.getCTVPreferenceInsights(),
          performance: campaign.getCTVPerformanceByDemo()
        };
        break;
      case 'p2p':
        analytics = {
          ...campaign.getP2PMetrics(),
          f2f: campaign.getF2FMetrics(),
          dialer: campaign.getDialerMetrics(),
          canvass: campaign.getOpenCanvassMetrics()
        };
        break;
      case 'demographics':
        analytics = {
          ...campaign.getSelfReportedDemographics(),
          ...campaign.getDetailedDemographics(),
          geographic: campaign.getGeographicMetrics(),
          contact: campaign.getContactInfo(),
          engagement: campaign.getDemographicEngagement()
        };
        break;
      case 'events':
        analytics = {
          ...campaign.getEventDetails(),
          ...campaign.getEventPerformance(),
          referrals: campaign.getEventReferrals()
        };
        break;
      case 'technical':
        analytics = {
          ...campaign.getTechnicalMetrics(),
          traffic: campaign.getTrafficMetrics(),
          conversions: campaign.getConversionMetrics(),
          custom: campaign.getCustomMetrics()
        };
        break;
      case 'testing':
        analytics = {
          ...campaign.getTestingMetrics(),
          email: campaign.getEmailTestingMetrics(),
          ads: campaign.getAdTestingMetrics(),
          custom: campaign.getCustomTestMetrics()
        };
        break;
      default:
        return res.status(400).json({ error: 'Invalid analytics domain' });
    }

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get filtered analytics based on date range and domains
router.get('/campaigns/:id/analytics/filter', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const { startDate, endDate, domains } = req.query;
    const analytics = campaign.getAnalyticsOverview();

    // Filter by domains if specified
    if (domains) {
      const requestedDomains = domains.split(',');
      const filteredAnalytics = {};
      requestedDomains.forEach(domain => {
        if (analytics[domain]) {
          filteredAnalytics[domain] = analytics[domain];
        }
      });
      return res.json(filteredAnalytics);
    }

    // Return all analytics if no filtering
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get aggregated analytics across multiple campaigns
router.get('/analytics/aggregate', async (req, res) => {
  try {
    const { startDate, endDate, domains } = req.query;
    
    // Build query
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get campaigns
    const campaigns = await Campaign.find(query);
    
    // Aggregate analytics
    const aggregatedAnalytics = campaigns.reduce((acc, campaign) => {
      const analytics = campaign.getAnalyticsOverview();
      
      // Filter by domains if specified
      if (domains) {
        const requestedDomains = domains.split(',');
        requestedDomains.forEach(domain => {
          if (analytics[domain]) {
            if (!acc[domain]) acc[domain] = [];
            acc[domain].push(analytics[domain]);
          }
        });
      } else {
        // Include all domains
        Object.keys(analytics).forEach(domain => {
          if (!acc[domain]) acc[domain] = [];
          acc[domain].push(analytics[domain]);
        });
      }
      
      return acc;
    }, {});

    res.json(aggregatedAnalytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
