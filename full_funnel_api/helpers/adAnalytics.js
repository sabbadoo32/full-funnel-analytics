/**
 * Advertising analytics helper functions
 */

const getAdMetrics = (campaign) => {
  return {
    impressions: campaign["Ad impressions"] || 0,
    uniqueUsers: campaign["IMPRESSION:UNIQUE_USERS"] || 0,
    views: campaign["Views"] || 0,
    reach: campaign["Reach"] || 0,
    clicks: {
      total: campaign["Total clicks"] || 0,
      other: campaign["Other Clicks"] || 0,
      link: campaign["Link Clicks"] || 0
    },
    cpm: campaign["Ad CPM (USD)"] || 0,
    matchedAudiencePhotoClick: campaign["Matched Audience Targeting Consumption (Photo Click)"] || 0,
    negativeFeedback: campaign["Negative feedback from users: Hide all"] || 0,
    ctr: campaign["Total clicks"] && campaign["Ad impressions"] ? 
      ((campaign["Total clicks"] / campaign["Ad impressions"]) * 100).toFixed(2) + '%' : '0%'
  };
};

const getAdSetMetrics = (campaign) => {
  return {
    adSetName: campaign["Ad Set Name"],
    adName: campaign["Ad name"],
    amountSpent: campaign["Amount spent (USD)"] || 0,
    costPerResult: campaign["Cost per result"] || 0,
    estimatedEarnings: campaign["Estimated earnings (USD)"] || 0,
    roas: campaign["Total revenue"] && campaign["Amount spent (USD)"] ?
      ((campaign["Total revenue"] / campaign["Amount spent (USD)"]) * 100).toFixed(2) + '%' : '0%'
  };
};

module.exports = {
  getAdMetrics,
  getAdSetMetrics
};
