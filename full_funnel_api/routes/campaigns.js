const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Define the FullFunnel model schema
const fullFunnelSchema = new mongoose.Schema({}, { strict: false, collection: 'full_funnel' });
const FullFunnel = mongoose.model('FullFunnel', fullFunnelSchema);

// Log collection stats for debugging
FullFunnel.collection.stats()
  .then(stats => {
    console.log('FullFunnel collection stats:', {
      count: stats.count,
      size: stats.size,
      storageSize: stats.storageSize
    });
  })
  .catch(console.error);

// Get campaign summary
router.get('/summary', async (req, res) => {
  const { campaign_tag, date } = req.query;
  
  try {
    // If no parameters, return sample data structure
    if (!campaign_tag && !date) {
      const sample = await FullFunnel.findOne({}, 'name organization_name event_type timeslot_start location_name -_id').lean();
      return res.json({
        message: 'Please provide a campaign_tag and/or date parameter',
        sampleQuery: {
          with_date: '/campaigns/summary?date=2023-01-01',
          with_tag: '/campaigns/summary?campaign_tag=YourCampaignTag',
          with_both: '/campaigns/summary?date=2023-01-01&campaign_tag=YourCampaignTag'
        },
        sampleData: sample
      });
    }
    
    // Build query based on parameters
    const query = {};
    
    if (campaign_tag) {
      // Search in tags array or organization_name
      query.$or = [
        { tags: campaign_tag },
        { organization_name: { $regex: campaign_tag, $options: 'i' } }
      ];
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);
      
      query.timeslot_start = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    // Get matching events
    const events = await FullFunnel.find(query, {
      projection: {
        _id: 0,
        name: 1,
        organization_name: 1,
        event_type: 1,
        timeslot_start: 1,
        location_name: 1,
        is_virtual: 1,
        description: 1,
        tags: 1
      },
      limit: 100
    }).toArray();
    
    if (!events || events.length === 0) {
      return res.status(404).json({
        error: 'No events found',
        query: query,
        suggestions: [
          'Try a different date or campaign tag',
          'Check the spelling of the campaign tag',
          'Try a broader search by removing some filters'
        ]
      });
    }
    
    // Format response
    const response = {
      count: events.length,
      events: events.map(event => ({
        name: event.name,
        organization: event.organization_name,
        type: event.event_type,
        date: event.timeslot_start,
        location: event.location_name,
        isVirtual: event.is_virtual,
        description: event.description,
        tags: event.tags || []
      })),
      summary: {
        organizations: [...new Set(events.map(e => e.organization_name))],
        eventTypes: [...new Set(events.map(e => e.event_type))],
        locations: [...new Set(events.map(e => e.location_name).filter(Boolean))]
      }
    };
    
    res.json(response);
  } catch (err) {
    console.error('Error fetching campaign data:', err);
    res.status(500).json({ 
      error: 'Server error',
      details: err.message
    });
  }
});

module.exports = router;
