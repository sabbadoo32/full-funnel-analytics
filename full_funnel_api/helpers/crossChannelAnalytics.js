/**
 * Cross-channel analytics and attribution helper functions
 */

const getAttributionMetrics = (campaign) => {
  return {
    // Channel attribution
    firstUserSourceMedium: campaign["First user source / medium"],
    firstUserPrimaryChannelGroup: campaign["First user primary channel group (Default Channel Group)"],
    appOrChannel: campaign["App or Channel"],
    
    // Cross-channel metrics
    engagedSessions: campaign["Engaged sessions"] || 0,
    engagementRate: campaign["Engagement rate"] || 0,
    engagedSessionsPerUser: campaign["Engaged sessions per user"] || 0,
    avgEngagementTime: campaign["Average engagement time"] || 0,
    
    // Conversion tracking
    eventCount: campaign["Event count"] || 0,
    userKeyEventRate: campaign["User key event rate"] || 0,
    predefinedAudience: campaign["Predefined audience"],
    
    // Cost metrics across channels
    costPerSession: campaign["Cost Per Session"] || 0,
    costPerLead: campaign["Cost Per Lead"] || 0,
    costPerPurchase: campaign["Cost Per Purchase"] || 0
  };
};

const getCampaignPerformance = (campaign) => {
  return {
    campaign: campaign["Campaign"],
    period: campaign["Period"],
    campaignDay: campaign["Campaign Day"],
    spend: campaign["Spend"] || 0,
    revenue: campaign["Revenue"] || 0,
    roas: campaign["ROAS"] || 0,
    
    // Reach metrics
    users: campaign["Users"] || 0,
    totalContributed: campaign["Total Contributed"] || 0,
    
    // Daily metrics available if needed
    dailyMetrics: {
      // Can be expanded based on the date fields in master list
      // Currently showing as example
      "5/20": campaign["5/20"],
      "5/21": campaign["5/21"]
      // etc.
    }
  };
};

const getChannelReach = (campaign) => {
  return {
    facebookReach: campaign["Facebook reach"] || 0,
    facebookVisits: campaign["Facebook visits"] || 0,
    instagramReach: campaign["Instagram reach"] || 0,
    instagramVisits: campaign["Instagram profile visits"] || 0,
    webSessions: campaign["Sessions"] || 0,
    webUsers: campaign["Users"] || 0,
    households: campaign["Households"] || 0
  };
};

module.exports = {
  getAttributionMetrics,
  getCampaignPerformance,
  getChannelReach
};
