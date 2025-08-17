const validateCampaign = (req, res, next) => {
  const campaign = req.body;
  
  // Required fields validation
  const requiredFields = ['eventName', 'eventDate', 'eventType', 'city'];
  const missingFields = requiredFields.filter(field => !campaign[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      fields: missingFields
    });
  }

  // Email metrics validation
  if (campaign.emailMetrics) {
    const { sent, opened, clicked, converted } = campaign.emailMetrics;
    
    // Validate numeric values
    if (sent && typeof sent !== 'number' || 
        opened && typeof opened !== 'number' ||
        clicked && typeof clicked !== 'number' ||
        converted && typeof converted !== 'number') {
      return res.status(400).json({
        error: 'Email metrics must be numeric values'
      });
    }

    // Validate logical relationships
    if (opened > sent || clicked > opened || converted > clicked) {
      return res.status(400).json({
        error: 'Invalid email metrics: values must follow logical progression'
      });
    }
  }

  // Date validation
  if (new Date(campaign.eventDate).toString() === 'Invalid Date') {
    return res.status(400).json({
      error: 'Invalid event date format'
    });
  }

  // Analytics validation
  if (campaign.analytics) {
    const { gaSessions, pageViews } = campaign.analytics;
    if (gaSessions && typeof gaSessions !== 'number' ||
        pageViews && typeof pageViews !== 'number') {
      return res.status(400).json({
        error: 'Analytics metrics must be numeric values'
      });
    }
  }

  // District validation
  const districtFields = ['congressionalDistrict', 'stateHouseDistrict', 'stateSenateDistrict'];
  districtFields.forEach(field => {
    if (campaign[field] && typeof campaign[field] !== 'string') {
      return res.status(400).json({
        error: `${field} must be a string value`
      });
    }
  });

  next();
};

module.exports = validateCampaign;
