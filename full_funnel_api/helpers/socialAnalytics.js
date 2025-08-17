/**
 * Social media analytics helper functions
 */

const getFacebookMetrics = (campaign) => {
  return {
    reach: campaign["Facebook reach"] || 0,
    visits: campaign["Facebook visits"] || 0,
    reactions: campaign["Reactions"] || 0,
    comments: campaign["Comments"] || 0,
    shares: campaign["Shares"] || 0,
    totalEngagement: (campaign["Reactions"] || 0) + (campaign["Comments"] || 0) + (campaign["Shares"] || 0),
    engagementRate: campaign["Facebook reach"] ? 
      (((campaign["Reactions"] || 0) + (campaign["Comments"] || 0) + (campaign["Shares"] || 0)) / campaign["Facebook reach"] * 100).toFixed(2) + '%' : '0%'
  };
};

const getInstagramMetrics = (campaign) => {
  return {
    reach: campaign["Instagram reach"] || 0,
    profileVisits: campaign["Instagram profile visits"] || 0,
    clicks: campaign["IG Clicks"] || 0,
    likes: campaign["Likes"] || 0,
    saves: campaign["Saves"] || 0,
    follows: campaign["Follows"] || 0,
    seen: campaign["seen"] || 0,
    started: campaign["started"] || 0,
    completions: campaign["completions"] || 0,
    completionRate: campaign["started"] ? 
      ((campaign["completions"] / campaign["started"]) * 100).toFixed(2) + '%' : '0%'
  };
};

const getVideoMetrics = (campaign) => {
  return {
    secondsViewed: campaign["Seconds viewed"] || 0,
    avgSecondsViewed: campaign["Average Seconds viewed"] || 0,
    durationSec: campaign["Duration (sec)"] || 0,
    completionRate: campaign["Duration (sec)"] ? 
      ((campaign["Average Seconds viewed"] / campaign["Duration (sec)"]) * 100).toFixed(2) + '%' : '0%'
  };
};

const getPostMetrics = (campaign) => {
  return {
    postId: campaign["Post ID"],
    pageId: campaign["Page ID"],
    pageName: campaign["Page name"],
    title: campaign["Title"],
    description: campaign["Description"],
    publishTime: campaign["Publish time"],
    captionType: campaign["Caption type"],
    permalink: campaign["Permalink"],
    isCrosspost: campaign["Is crosspost"],
    isShare: campaign["Is share"],
    postType: campaign["Post type"]
  };
};

module.exports = {
  getFacebookMetrics,
  getInstagramMetrics,
  getVideoMetrics,
  getPostMetrics
};
