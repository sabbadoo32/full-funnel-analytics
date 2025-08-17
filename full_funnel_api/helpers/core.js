// Email analytics helpers
exports.getEmailMetrics = (campaign) => {
  const data = campaign.toObject ? campaign.toObject() : campaign;
  return {
    opened: data['Opened'] || 0,
    clicked: data['Clicked'] || 0,
    converted: data['Converted'] || 0,
    subject: data['Subject Line'] || '',
    sent: data['Sent'] || 0,
    bounced: data['Bounced'] || 0,
    unsubscribed: data['Unsubscribed'] || 0
  };
};

exports.getEmailPerformance = (campaign) => {
  const metrics = exports.getEmailMetrics(campaign);
  return {
    openRate: metrics.sent ? (metrics.opened / metrics.sent * 100).toFixed(2) + '%' : '0%',
    clickRate: metrics.opened ? (metrics.clicked / metrics.opened * 100).toFixed(2) + '%' : '0%',
    conversionRate: metrics.clicked ? (metrics.converted / metrics.clicked * 100).toFixed(2) + '%' : '0%',
    bounceRate: metrics.sent ? (metrics.bounced / metrics.sent * 100).toFixed(2) + '%' : '0%',
    unsubscribeRate: metrics.sent ? (metrics.unsubscribed / metrics.sent * 100).toFixed(2) + '%' : '0%'
  };
};

exports.getEmailEngagement = (campaign) => {
  return {
    subject: campaign['Subject Line'] || '',
    preview: campaign['Preview Text'] || '',
    timeSent: campaign['Send Time'] || null,
    device: campaign['Email Client'] || '',
    platform: campaign['Email Platform'] || ''
  };
};

// Social analytics helpers
exports.getSocialMetrics = (campaign) => {
  const data = campaign.toObject ? campaign.toObject() : campaign;
  return {
    reactions: data['Reactions'] || 0,
    comments: data['Comments'] || 0,
    shares: data['Shares'] || 0,
    reach: data['Reach'] || 0,
    impressions: data['Social impressions'] || 0
  };
};

exports.getSocialEngagement = (campaign) => {
  const metrics = exports.getSocialMetrics(campaign);
  const total = metrics.reactions + metrics.comments + metrics.shares;
  return {
    totalEngagement: total,
    engagementRate: metrics.reach ? (total / metrics.reach * 100).toFixed(2) + '%' : '0%',
    platform: campaign['Social Platform'] || '',
    postType: campaign['Post Type'] || '',
    mediaType: campaign['Media Type'] || ''
  };
};

exports.getSocialReach = (campaign) => {
  return {
    organic: campaign['Organic Reach'] || 0,
    paid: campaign['Paid Reach'] || 0,
    viral: campaign['Viral Reach'] || 0,
    frequency: campaign['Average Frequency'] || 0
  };
};

// Ad analytics helpers
exports.getAdMetrics = (campaign) => {
  const data = campaign.toObject ? campaign.toObject() : campaign;
  return {
    impressions: data['Ad impressions'] || 0,
    clicks: data['Total clicks'] || 0,
    costPerResult: data['Cost per result'] || 0,
    spend: data['Amount spent (USD)'] || 0
  };
};

exports.getAdPerformance = (campaign) => {
  const metrics = exports.getAdMetrics(campaign);
  return {
    ctr: metrics.impressions ? (metrics.clicks / metrics.impressions * 100).toFixed(2) + '%' : '0%',
    cpc: metrics.clicks ? (metrics.spend / metrics.clicks).toFixed(2) : '0',
    frequency: campaign['Ad Frequency'] || 0,
    reach: campaign['Ad Reach'] || 0
  };
};

exports.getAdROI = (campaign) => {
  const metrics = exports.getAdMetrics(campaign);
  const revenue = campaign['Revenue'] || 0;
  return {
    roi: metrics.spend ? ((revenue - metrics.spend) / metrics.spend * 100).toFixed(2) + '%' : '0%',
    roas: metrics.spend ? (revenue / metrics.spend).toFixed(2) : '0',
    costPerConversion: campaign['Cost per conversion'] || 0
  };
};

// Web analytics helpers
exports.getWebMetrics = (campaign) => {
  const data = campaign.toObject ? campaign.toObject() : campaign;
  return {
    sessions: data['Sessions'] || 0,
    activeUsers: data['Active users'] || 0,
    newUsers: data['New users'] || 0,
    avgEngagementTime: data['Average engagement time'] || 0,
    pageviews: data['Pageviews'] || 0,
    uniquePageviews: data['Unique pageviews'] || 0
  };
};

exports.getWebEngagement = (campaign) => {
  return {
    avgSessionDuration: campaign['Average engagement time'] || 0,
    bounceRate: campaign['Bounce rate'] || '0%',
    exitRate: campaign['Exit rate'] || '0%',
    scrollDepth: campaign['Average scroll depth'] || '0%'
  };
};

exports.getWebConversions = (campaign) => {
  return {
    totalConversions: campaign['Total conversions'] || 0,
    conversionRate: campaign['Conversion rate'] || '0%',
    goalCompletions: campaign['Goal completions'] || 0,
    ecommerce: {
      transactions: campaign['Transactions'] || 0,
      revenue: campaign['Revenue'] || 0
    }
  };
};
