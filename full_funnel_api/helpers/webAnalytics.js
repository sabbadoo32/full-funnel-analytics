/**
 * Web analytics helper functions
 */

const getWebMetrics = (campaign) => {
  return {
    landingPage: campaign["Landing page"],
    firstUserSourceMedium: campaign["First user source / medium"],
    sessions: campaign["Sessions"] || 0,
    activeUsers: campaign["Active users"] || 0,
    newUsers: campaign["New users"] || 0,
    avgEngagementTime: campaign["Average engagement time per session"] || 0,
    keyEvents: campaign["Key events"] || 0,
    sessionKeyEventRate: campaign["Session key event rate"] || 0,
    newUserRate: campaign["Active users"] ? 
      ((campaign["New users"] / campaign["Active users"]) * 100).toFixed(2) + '%' : '0%'
  };
};

const getConversionMetrics = (campaign) => {
  return {
    conversionRate: campaign["Conversion Rate"] || 0,
    leads: campaign["Leads"] || 0,
    purchases: campaign["Purchases"] || 0,
    revenue: campaign["Total revenue"] || 0,
    roas: campaign["ROAS"] || 0
  };
};

module.exports = {
  getWebMetrics,
  getConversionMetrics
};
