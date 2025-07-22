/**
 * A/B Testing and variant analytics helper functions
 */

const getTestingMetrics = (campaign) => {
  return {
    // Core test data
    variant: campaign["Variant"],
    combinationId: campaign["Combination Id"],
    
    // Control group
    control: {
      visits: campaign["Control Visits"] || 0,
      conversions: campaign["Control Conversions"] || 0,
      conversionRate: campaign["Control Conversions"] && campaign["Control Visits"] ?
        ((campaign["Control Conversions"] / campaign["Control Visits"]) * 100).toFixed(2) + '%' : '0%'
    },
    
    // Variant group
    variant: {
      visits: campaign["Variant Visits"] || 0,
      conversions: campaign["Variant Conversions"] || 0,
      conversionRate: campaign["Variant Conversions"] && campaign["Variant Visits"] ?
        ((campaign["Variant Conversions"] / campaign["Variant Visits"]) * 100).toFixed(2) + '%' : '0%'
    },
    
    // Overall metrics
    overall: {
      conversionRate: campaign["Conversion Rate"] || 0,
      totalVisits: (campaign["Control Visits"] || 0) + (campaign["Variant Visits"] || 0),
      totalConversions: (campaign["Control Conversions"] || 0) + (campaign["Variant Conversions"] || 0)
    }
  };
};

const getEmailTestingMetrics = (campaign) => {
  return {
    // Email-specific testing
    subjectLine: campaign["Subject Line"],
    variant: campaign["Variant"],
    
    // Email performance
    opened: campaign["Opened"] || 0,
    clicked: campaign["Clicked"] || 0,
    converted: campaign["Converted"] || 0,
    bounced: campaign["Bounced"] || 0,
    unsubscribed: campaign["Unsubscribed"] || 0,
    
    // Conversion tracking
    conversionTime: campaign["Conversion Time"],
    metric1Converted: campaign["Metric 1 Converted"],
    metric1ConvertedTime: campaign["Metric 1 Converted Time"]
  };
};

const getAdTestingMetrics = (campaign) => {
  return {
    // Ad variants
    adSetName: campaign["Ad Set Name"],
    adName: campaign["Ad name"],
    
    // Performance metrics
    objective: campaign["Objective"],
    resultType: campaign["Result type"],
    results: campaign["Results"] || 0,
    costPerResult: campaign["Cost per result"] || 0,
    
    // Reporting period
    reportingStarts: campaign["Reporting starts"],
    reportingEnds: campaign["Reporting ends"]
  };
};

const getCustomTestMetrics = (campaign) => {
  return {
    // Custom metrics
    custom: campaign["[Custom]"],
    metricId: campaign["Metric Id"],
    
    // Extended metrics
    eventCount: campaign["Event count"],
    userKeyEventRate: campaign["User key event rate"],
    predefinedAudience: campaign["Predefined audience"],
    
    // Time-based metrics
    hitTime: campaign["Hit Time"],
    conversionTime: campaign["Conversion Time"]
  };
};

module.exports = {
  getTestingMetrics,
  getEmailTestingMetrics,
  getAdTestingMetrics,
  getCustomTestMetrics
};
