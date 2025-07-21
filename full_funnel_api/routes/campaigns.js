const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');

router.get('/summary', async (req, res) => {
  const { campaign_tag, date } = req.query;
  if (!campaign_tag || !date) {
    return res.status(400).json({ error: 'campaign_tag and date are required' });
  }

  try {
    const campaign = await Campaign.findOne({ "Campaign Tag": campaign_tag, Date: date });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
