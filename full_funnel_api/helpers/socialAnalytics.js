/**
 * Social media analytics helper functions
 * Enhanced with advanced metrics and performance scoring
 */

// Constants for industry benchmarks
const BENCHMARKS = {
  facebook: {
    engagementRate: 0.06, // 0.06% average engagement rate
    videoCompletionRate: 0.25, // 25% average completion rate
    reactionRate: 0.02, // 2% of reach
    shareRate: 0.01, // 1% of reach
    commentRate: 0.005 // 0.5% of reach
  },
  instagram: {
    engagementRate: 0.83, // 0.83% average engagement rate
    saveRate: 0.02, // 2% of reach
    followRate: 0.01, // 1% of profile visits
    videoCompletionRate: 0.35 // 35% average completion rate
  }
};

/**
 * Calculate performance score based on engagement metrics
 */
const calculatePerformanceScore = (metrics, platform) => {
  const platformBenchmarks = BENCHMARKS[platform] || {};
  let score = 0;
  
  if (platform === 'facebook') {
    const engagementRate = metrics.engagementRate || 0;
    const videoCompletion = metrics.videoMetrics?.completionRate || 0;
    const engagementScore = Math.min(100, (engagementRate / platformBenchmarks.engagementRate) * 50);
    const videoScore = videoCompletion ? Math.min(30, (videoCompletion / platformBenchmarks.videoCompletionRate) * 30) : 0;
    const reachScore = metrics.reach > 0 ? Math.min(20, (metrics.reach / 10000) * 20) : 0;
    score = engagementScore + videoScore + reachScore;
  } else if (platform === 'instagram') {
    const engagementRate = metrics.engagementRate || 0;
    const saveRate = metrics.saveRate || 0;
    const followRate = metrics.followRate || 0;
    const engagementScore = Math.min(50, (engagementRate / platformBenchmarks.engagementRate) * 40);
    const saveScore = Math.min(30, (saveRate / platformBenchmarks.saveRate) * 30);
    const followScore = Math.min(20, (followRate / platformBenchmarks.followRate) * 20);
    score = engagementScore + saveScore + followScore;
  }
  
  return Math.min(100, Math.round(score));
};

/**
 * Get performance tier based on score
 */
const getPerformanceTier = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Needs Improvement';
};

/**
 * Get Facebook metrics with enhanced analytics
 */
const getFacebookMetrics = (campaign) => {
  const reach = campaign["Facebook reach"] || 0;
  const reactions = campaign["Reactions"] || 0;
  const comments = campaign["Comments"] || 0;
  const shares = campaign["Shares"] || 0;
  const linkClicks = campaign["Link Clicks"] || 0;
  const videoViews = campaign["Video Views"] || 0;
  const videoDuration = campaign["Video Duration"] || 1;
  
  const totalEngagement = reactions + comments + shares;
  const engagementRate = reach > 0 ? totalEngagement / reach : 0;
  const videoCompletionRate = videoViews > 0 ? (videoDuration > 0 ? Math.min(1, videoViews / videoDuration) : 0) : 0;
  
  return {
    reach,
    visits: campaign["Facebook visits"] || 0,
    reactions,
    comments,
    shares,
    linkClicks,
    videoViews,
    videoDuration,
    engagement: {
      total: totalEngagement,
      rate: engagementRate,
      reactionRate: reach > 0 ? reactions / reach : 0,
      commentRate: reach > 0 ? comments / reach : 0,
      shareRate: reach > 0 ? shares / reach : 0,
      clickThroughRate: reach > 0 ? linkClicks / reach : 0
    },
    videoMetrics: videoViews > 0 ? {
      views: videoViews,
      duration: videoDuration,
      completionRate: videoCompletionRate,
      avgViewDuration: campaign["Avg. View Duration"] || 0
    } : null,
    performance: {
      score: calculatePerformanceScore({
        engagementRate,
        videoMetrics: { completionRate: videoCompletionRate },
        reach
      }, 'facebook'),
      tier: getPerformanceTier(calculatePerformanceScore({
        engagementRate,
        videoMetrics: { completionRate: videoCompletionRate },
        reach
      }, 'facebook'))
    },
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Get Instagram metrics with enhanced analytics
 */
const getInstagramMetrics = (campaign) => {
  const reach = campaign["Instagram reach"] || 0;
  const profileVisits = campaign["Instagram profile visits"] || 0;
  const likes = campaign["Likes"] || 0;
  const comments = campaign["Comments"] || 0;
  const saves = campaign["Saves"] || 0;
  const follows = campaign["Follows"] || 0;
  const shares = campaign["Shares"] || 0;
  const videoViews = campaign["Video Views"] || 0;
  const videoDuration = campaign["Video Duration"] || 1;
  
  const totalEngagement = likes + comments + saves + shares;
  const engagementRate = reach > 0 ? totalEngagement / reach : 0;
  const followRate = profileVisits > 0 ? follows / profileVisits : 0;
  const saveRate = reach > 0 ? saves / reach : 0;
  const videoCompletionRate = videoViews > 0 ? (videoDuration > 0 ? Math.min(1, videoViews / videoDuration) : 0) : 0;
  
  return {
    // Core metrics
    reach,
    profileVisits,
    follows,
    
    // Engagement metrics
    engagement: {
      total: totalEngagement,
      rate: engagementRate,
      likes,
      comments,
      saves,
      shares,
      likeRate: reach > 0 ? likes / reach : 0,
      commentRate: reach > 0 ? comments / reach : 0,
      saveRate,
      shareRate: reach > 0 ? shares / reach : 0,
      followRate
    },
    
    // Video metrics (if applicable)
    videoMetrics: videoViews > 0 ? {
      views: videoViews,
      duration: videoDuration,
      completionRate: videoCompletionRate,
      avgViewDuration: campaign["Avg. View Duration"] || 0
    } : null,
    
    // Story metrics (if applicable)
    storyMetrics: {
      seen: campaign["seen"] || 0,
      started: campaign["started"] || 0,
      completions: campaign["completions"] || 0,
      completionRate: campaign["started"] > 0 ? campaign["completions"] / campaign["started"] : 0,
      replies: campaign["replies"] || 0,
      exits: campaign["exits"] || 0
    },
    
    // Performance metrics
    performance: {
      score: calculatePerformanceScore({
        engagementRate,
        saveRate,
        followRate,
        videoMetrics: { completionRate: videoCompletionRate },
        reach
      }, 'instagram'),
      tier: getPerformanceTier(calculatePerformanceScore({
        engagementRate,
        saveRate,
        followRate,
        videoMetrics: { completionRate: videoCompletionRate },
        reach
      }, 'instagram')),
      benchmark: BENCHMARKS.instagram,
      lastUpdated: new Date().toISOString()
    }
  };
};

/**
 * Get comprehensive video metrics with engagement analysis
 */
const getVideoMetrics = (campaign) => {
  const durationSec = campaign["Duration (sec)"] || 0;
  const secondsViewed = campaign["Seconds viewed"] || 0;
  const avgSecondsViewed = campaign["Average Seconds viewed"] || 0;
  const views = campaign["Video Views"] || 0;
  const impressions = campaign["Impressions"] || 0;
  const plays = campaign["Video Plays"] || 0;
  const completes = campaign["Video Completions"] || 0;
  
  // Calculate key metrics
  const viewRate = impressions > 0 ? views / impressions : 0;
  const playRate = impressions > 0 ? plays / impressions : 0;
  const completionRate = plays > 0 ? completes / plays : 0;
  const avgViewPercentage = durationSec > 0 ? (avgSecondsViewed / durationSec) : 0;
  
  // Calculate engagement metrics
  const engagementRate = views > 0 ? 
    (campaign["Engagements"] || 0) / views : 0;
  
  // Calculate quartile metrics if available
  const quartiles = {};
  [25, 50, 75, 100].forEach(q => {
    const key = `Q${q} Views`;
    if (campaign[key] !== undefined) {
      quartiles[`q${q}Views`] = campaign[key];
      quartiles[`q${q}ViewRate`] = plays > 0 ? campaign[key] / plays : 0;
    }
  });
  
  return {
    // Core metrics
    views,
    impressions,
    plays,
    completes,
    duration: durationSec,
    
    // View metrics
    viewMetrics: {
      viewRate,
      playRate,
      completionRate,
      avgViewDuration: avgSecondsViewed,
      avgViewPercentage,
      totalViewTime: secondsViewed
    },
    
    // Quartile metrics
    quartiles: Object.keys(quartiles).length > 0 ? quartiles : null,
    
    // Engagement metrics
    engagement: {
      rate: engagementRate,
      likes: campaign["Likes"] || 0,
      comments: campaign["Comments"] || 0,
      shares: campaign["Shares"] || 0,
      saves: campaign["Saves"] || 0,
      clicks: campaign["Clicks"] || 0
    },
    
    // Performance metrics
    performance: {
      score: calculateVideoPerformanceScore({
        viewRate,
        playRate,
        completionRate,
        avgViewPercentage,
        engagementRate
      }),
      tier: getPerformanceTier(calculateVideoPerformanceScore({
        viewRate,
        playRate,
        completionRate,
        avgViewPercentage,
        engagementRate
      })),
      benchmark: {
        viewRate: 0.15,  // 15% average view rate
        playRate: 0.10,  // 10% average play rate
        completionRate: 0.25,  // 25% average completion rate
        engagementRate: 0.03  // 3% average engagement rate
      }
    },
    
    // Timestamp
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Calculate video performance score (0-100)
 */
const calculateVideoPerformanceScore = (metrics) => {
  const {
    viewRate = 0,
    playRate = 0,
    completionRate = 0,
    avgViewPercentage = 0,
    engagementRate = 0
  } = metrics;
  
  // Weights for different metrics
  const weights = {
    viewRate: 0.25,
    playRate: 0.25,
    completionRate: 0.3,
    engagementRate: 0.2
  };
  
  // Calculate weighted score
  let score = (
    (viewRate * 100 * weights.viewRate) +
    (playRate * 100 * weights.playRate) +
    (completionRate * 100 * weights.completionRate) +
    (engagementRate * 100 * weights.engagementRate)
  );
  
  // Adjust based on view percentage
  const viewPercentageScore = avgViewPercentage * 100;
  score = (score * 0.8) + (viewPercentageScore * 0.2);
  
  return Math.min(100, Math.round(score));
};

/**
 * Get comprehensive post metrics with engagement analysis
 */
const getPostMetrics = (campaign) => {
  const postType = (campaign["Post type"] || '').toLowerCase();
  const isVideo = postType.includes('video');
  const isImage = postType.includes('photo') || postType.includes('image');
  const isCarousel = postType.includes('carousel');
  const isStory = postType.includes('story');
  
  // Calculate engagement metrics
  const reach = campaign["Reach"] || campaign["Impressions"] || 0;
  const engagements = (campaign["Engagements"] || 0) + 
                     (campaign["Reactions"] || 0) + 
                     (campaign["Comments"] || 0) + 
                     (campaign["Shares"] || 0);
  const engagementRate = reach > 0 ? engagements / reach : 0;
  
  // Get video metrics if applicable
  const videoMetrics = isVideo ? getVideoMetrics(campaign) : null;
  
  // Get story metrics if applicable
  let storyMetrics = null;
  if (isStory) {
    storyMetrics = {
      seen: campaign["seen"] || 0,
      started: campaign["started"] || 0,
      completions: campaign["completions"] || 0,
      replies: campaign["replies"] || 0,
      exits: campaign["exits"] || 0,
      forwardTaps: campaign["forward_taps"] || 0,
      backTaps: campaign["back_taps"] || 0,
      nextStoryTaps: campaign["next_story_taps"] || 0,
      navigation: {
        forwardRate: campaign["seen"] > 0 ? (campaign["forward_taps"] || 0) / campaign["seen"] : 0,
        backRate: campaign["seen"] > 0 ? (campaign["back_taps"] || 0) / campaign["seen"] : 0,
        nextStoryRate: campaign["seen"] > 0 ? (campaign["next_story_taps"] || 0) / campaign["seen"] : 0,
        exitRate: campaign["seen"] > 0 ? (campaign["exits"] || 0) / campaign["seen"] : 0
      }
    };
  }
  
  return {
    // Core post information
    postId: campaign["Post ID"],
    pageId: campaign["Page ID"],
    pageName: campaign["Page name"],
    title: campaign["Title"],
    description: campaign["Description"],
    publishTime: campaign["Publish time"],
    permalink: campaign["Permalink"],
    postType,
    
    // Post type classification
    contentType: {
      isVideo,
      isImage,
      isCarousel,
      isStory,
      mediaCount: campaign["Media Count"] || (isImage ? 1 : 0)
    },
    
    // Engagement metrics
    reach,
    impressions: campaign["Impressions"] || 0,
    engagements: {
      total: engagements,
      rate: engagementRate,
      reactions: campaign["Reactions"] || 0,
      comments: campaign["Comments"] || 0,
      shares: campaign["Shares"] || 0,
      saves: campaign["Saves"] || 0,
      linkClicks: campaign["Link Clicks"] || 0,
      ctr: reach > 0 ? ((campaign["Link Clicks"] || 0) / reach) : 0
    },
    
    // Video metrics (if applicable)
    video: videoMetrics,
    
    // Story metrics (if applicable)
    story: storyMetrics,
    
    // Performance metrics
    performance: {
      score: calculatePostPerformanceScore(
        engagementRate, 
        isVideo, 
        videoMetrics?.performance?.score,
        isStory,
        storyMetrics
      ),
      tier: getPerformanceTier(calculatePostPerformanceScore(
        engagementRate, 
        isVideo, 
        videoMetrics?.performance?.score,
        isStory,
        storyMetrics
      )),
      lastUpdated: new Date().toISOString()
    }
  };
};

/**
 * Calculate post performance score (0-100)
 */
const calculatePostPerformanceScore = (engagementRate, isVideo, videoScore, isStory, storyMetrics) => {
  // Base score on engagement rate (0-60 points)
  let benchmarkEngagement;
  if (isVideo) {
    benchmarkEngagement = 0.05;
  } else if (isStory) {
    benchmarkEngagement = 0.03;
  } else {
    benchmarkEngagement = 0.02;
  }
  
  const engagementScore = Math.min(60, (engagementRate / benchmarkEngagement) * 60);
  
  // Add video score if applicable (0-20 points)
  const adjustedVideoScore = isVideo && videoScore ? (videoScore * 0.2) : 0;
  
  // Add story completion score if applicable (0-20 points)
  let storyScore = 0;
  if (isStory && storyMetrics?.completions && storyMetrics.started > 0) {
    const completionRate = storyMetrics.completions / storyMetrics.started;
    storyScore = Math.min(20, (completionRate / 0.3) * 20); // 30% benchmark
  }
  
  // Calculate final score (0-100)
  const finalScore = Math.min(100, Math.round(engagementScore + adjustedVideoScore + storyScore));
  return finalScore;
};

module.exports = {
  getFacebookMetrics,
  getInstagramMetrics,
  getVideoMetrics,
  getPostMetrics
};
