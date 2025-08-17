/**
 * Technical analytics helper functions for browser, device, and system data
 */

const getTechnicalMetrics = (campaign) => {
  return {
    // Browser data
    browser: {
      name: campaign["Browser"],
      version: campaign["Browser Version"],
      userAgent: campaign["User Agent"]
    },
    
    // Device info
    device: {
      type: campaign["Device Type"],
      name: campaign["Device"],
      screenResolution: campaign["Screen Resolution"],
      screen: campaign["Screen"]
    },
    
    // Operating system
    os: {
      name: campaign["OS"],
      version: campaign["OS Version"]
    },
    
    // Network/Location
    network: {
      ip: campaign["IP"],
      region: campaign["Region"],
      country: campaign["Country"],
      city: campaign["City"],
      state: campaign["State"],
      zipCode: campaign["ZIP code"]
    }
  };
};

const getTrafficMetrics = (campaign) => {
  return {
    // Traffic sources
    source: campaign["Traffic Source"],
    referringUrl: campaign["Referring URL"],
    queryParameters: campaign["Query Parameters"],
    
    // Visit data
    returningVisitor: campaign["Returning Visitor"],
    hitTime: campaign["Hit Time"],
    userLanguage: campaign["User Language"],
    
    // URLs
    url: campaign["URL"],
    landingPage: campaign["Landing page"]
  };
};

const getConversionMetrics = (campaign) => {
  return {
    // Core conversion data
    metricId: campaign["Metric Id"],
    conversionTime: campaign["Conversion Time"],
    metric1Converted: campaign["Metric 1 Converted"],
    metric1ConvertedTime: campaign["Metric 1 Converted Time"],
    
    // Testing data
    combinationId: campaign["Combination Id"],
    variant: campaign["Variant"],
    
    // Results
    conversionRate: campaign["Conversion Rate"],
    controlGroup: {
      visits: campaign["Control Visits"] || 0,
      conversions: campaign["Control Conversions"] || 0
    },
    variantGroup: {
      visits: campaign["Variant Visits"] || 0,
      conversions: campaign["Variant Conversions"] || 0
    }
  };
};

const getCustomMetrics = (campaign) => {
  return {
    // Custom field support
    custom: campaign["[Custom]"],
    
    // Extended metrics
    combinationId: campaign["Combination Id"],
    metricId: campaign["Metric Id"],
    
    // Performance metrics
    eventCount: campaign["Event count"],
    userKeyEventRate: campaign["User key event rate"],
    predefinedAudience: campaign["Predefined audience"]
  };
};

module.exports = {
  getTechnicalMetrics,
  getTrafficMetrics,
  getConversionMetrics,
  getCustomMetrics
};
