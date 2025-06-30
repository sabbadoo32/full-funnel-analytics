const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Optional: Adjust this to match your real collection name and fields
const Campaign = mongoose.model('Campaign', new mongoose.Schema({}, { strict: false }));

// GET /campaigns/summary?campaign_tag=MU Project 3.5&date=2025-04-24
router.get('/summary', async (req, res) => {
  const { campaign_tag, date } = req.query;

  if (!campaign_tag || !date) {
    return res.status(400).json({ error: 'Missing required query params: campaign_tag, date' });
  }

  try {
    const campaign = await Campaign.findOne({
      "Campaign Tag": campaign_tag,
      Date: date
    }).lean();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found for that tag and date' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
