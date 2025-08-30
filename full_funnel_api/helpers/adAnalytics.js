/**
 * Advertising analytics helper functions with enhanced metrics and performance scoring
 */

// Industry benchmarks for ad performance
const AD_BENCHMARKS = {
  CTR: 0.009, // 0.9% average CTR across industries
  CPC: 2.69, // $2.69 average CPC
  CPM: 7.19, // $7.19 average CPM
  ROAS: 2.87, // 2.87x average ROAS
  CONVERSION_RATE: 0.0235, // 2.35% average conversion rate
  FREQUENCY: 2.0, // Optimal frequency cap
  VIEW_RATE: 0.31, // 31% average view rate for video ads
  VIDEO_COMPLETION_RATE: 0.26 // 26% average completion rate for video ads
};

/**
 * Get performance tier based on score (0-100)
 */
const getPerformanceTier = (score) => {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Average';
  return 'Needs Improvement';
};

/**
 * Calculate ad performance score (0-100)
 */
const calculateAdPerformanceScore = (metrics) => {
  const {
    ctr = 0,
    cpc = 0,
    cpm = 0,
    roas = 0,
    conversionRate = 0,
    frequency = 0,
    viewRate = 0,
    videoCompletionRate = 0,
    negativeFeedbackRate = 0,
    engagementRate = 0
  } = metrics;

  // Calculate component scores (0-100)
  const ctrScore = Math.min(100, (ctr / AD_BENCHMARKS.CTR) * 100);
  const cpcScore = cpc > 0 ? Math.min(100, (AD_BENCHMARKS.CPC / cpc) * 100) : 0;
  const cpmScore = cpm > 0 ? Math.min(100, (AD_BENCHMARKS.CPM / cpm) * 100) : 0;
  const roasScore = Math.min(100, (roas / AD_BENCHMARKS.ROAS) * 100);
  const convRateScore = Math.min(100, (conversionRate / AD_BENCHMARKS.CONVERSION_RATE) * 100);
  const frequencyScore = frequency > 0 ? Math.min(100, (AD_BENCHMARKS.FREQUENCY / Math.max(1, frequency)) * 100) : 0;
  const viewRateScore = Math.min(100, (viewRate / AD_BENCHMARKS.VIEW_RATE) * 100);
  const completionScore = Math.min(100, (videoCompletionRate / AD_BENCHMARKS.VIDEO_COMPLETION_RATE) * 100);
  
  // Calculate weighted score (adjust weights as needed)
  const score = (
    (ctrScore * 0.2) +
    (cpcScore * 0.15) +
    (cpmScore * 0.1) +
    (roasScore * 0.25) +
    (convRateScore * 0.15) +
    (frequencyScore * 0.05) +
    (viewRateScore * 0.05) +
    (completionScore * 0.05) -
    (negativeFeedbackRate * 100) // Penalize high negative feedback
  );

  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Get comprehensive ad metrics with performance analysis
 */
const getAdMetrics = (campaign) => {
  // Core metrics
  const impressions = campaign["Ad impressions"] || 0;
  const uniqueUsers = campaign["IMPRESSION:UNIQUE_USERS"] || 0;
  const views = campaign["Views"] || 0;
  const reach = campaign["Reach"] || 0;
  const totalClicks = campaign["Total clicks"] || 0;
  const linkClicks = campaign["Link Clicks"] || 0;
  const otherClicks = campaign["Other Clicks"] || 0;
  const amountSpent = campaign["Amount spent (USD)"] || 0;
  const revenue = campaign["Total revenue"] || 0;
  const conversions = campaign["Conversions"] || 0;
  const videoViews = campaign["Video Views"] || 0;
  const videoCompletions = campaign["Video Completions"] || 0;
  const videoDuration = campaign["Video Duration"] || 0;
  const negativeFeedback = campaign["Negative feedback from users: Hide all"] || 0;
  
  // Calculate rates and metrics
  const ctr = impressions > 0 ? totalClicks / impressions : 0;
  const cpc = linkClicks > 0 ? amountSpent / linkClicks : 0;
  const cpm = impressions > 0 ? (amountSpent / impressions) * 1000 : 0;
  const roas = amountSpent > 0 ? revenue / amountSpent : 0;
  const conversionRate = linkClicks > 0 ? conversions / linkClicks : 0;
  const frequency = reach > 0 ? impressions / reach : 0;
  const viewRate = impressions > 0 ? videoViews / impressions : 0;
  const videoCompletionRate = videoViews > 0 ? videoCompletions / videoViews : 0;
  const negativeFeedbackRate = impressions > 0 ? negativeFeedback / impressions : 0;
  const avgViewDuration = videoViews > 0 ? (videoDuration * videoViews) / videoViews : 0;
  
  // Calculate performance score
  const performanceScore = calculateAdPerformanceScore({
    ctr,
    cpc,
    cpm,
    roas,
    conversionRate,
    frequency,
    viewRate,
    videoCompletionRate,
    negativeFeedbackRate,
    engagementRate: ctr // Using CTR as a proxy for engagement
  });
  
  // Get performance tier
  const performanceTier = getPerformanceTier(performanceScore);
  
  // Get key strengths and improvement areas
  const { strengths, improvements } = getPerformanceInsights({
    ctr,
    cpc,
    roas,
    conversionRate,
    frequency,
    viewRate,
    videoCompletionRate,
    negativeFeedbackRate,
    benchmark: AD_BENCHMARKS
  });

  return {
    // Core metrics
    impressions,
    uniqueUsers,
    reach,
    frequency,
    
    // Engagement metrics
    engagement: {
      views,
      viewRate,
      clicks: {
        total: totalClicks,
        link: linkClicks,
        other: otherClicks,
        ctr
      },
      negativeFeedback: {
        count: negativeFeedback,
        rate: negativeFeedbackRate
      },
      matchedAudiencePhotoClick: campaign["Matched Audience Targeting Consumption (Photo Click)"] || 0
    },
    
    // Video metrics (if applicable)
    video: videoDuration > 0 ? {
      views: videoViews,
      completions: videoCompletions,
      completionRate: videoCompletionRate,
      avgViewDuration,
      duration: videoDuration
    } : null,
    
    // Performance metrics
    performance: {
      score: performanceScore,
      tier: performanceTier,
      metrics: {
        ctr,
        cpc,
        cpm,
        roas,
        conversionRate,
        frequency,
        viewRate,
        videoCompletionRate
      },
      benchmark: AD_BENCHMARKS,
      strengths,
      improvements,
      lastUpdated: new Date().toISOString()
    },
    
    // Financial metrics
    financials: {
      amountSpent,
      revenue,
      roas,
      cpc,
      cpm,
      costPerResult: conversions > 0 ? amountSpent / conversions : 0,
      estimatedEarnings: campaign["Estimated earnings (USD)"] || 0
    },
    
    // Conversion metrics
    conversions: {
      total: conversions,
      rate: conversionRate,
      costPerConversion: conversions > 0 ? amountSpent / conversions : 0,
      valuePerConversion: conversions > 0 ? revenue / conversions : 0
    },
    
    // Metadata
    metadata: {
      campaignId: campaign["Campaign ID"],
      campaignName: campaign["Campaign name"],
      adSetId: campaign["Ad set ID"],
      adSetName: campaign["Ad set name"],
      adId: campaign["Ad ID"],
      adName: campaign["Ad name"],
      platform: campaign["Platform"] || 'unknown',
      objective: campaign["Objective"],
      status: campaign["Status"],
      startDate: campaign["Start date"],
      endDate: campaign["End date"]
    }
  };
};

/**
 * Get performance insights based on metrics and benchmarks
 */
const getPerformanceInsights = ({
  ctr,
  cpc,
  roas,
  conversionRate,
  frequency,
  viewRate,
  videoCompletionRate,
  negativeFeedbackRate,
  benchmark
}) => {
  const strengths = [];
  const improvements = [];
  
  // Check CTR performance
  if (ctr >= benchmark.CTR * 1.5) {
    strengths.push('High Click-Through Rate (CTR)');
  } else if (ctr < benchmark.CTR * 0.5) {
    improvements.push('Low Click-Through Rate (CTR)');
  }
  
  // Check CPC performance
  if (cpc > 0 && cpc <= benchmark.CPC * 0.7) {
    strengths.push('Efficient Cost Per Click (CPC)');
  } else if (cpc > benchmark.CPC * 1.3) {
    improvements.push('High Cost Per Click (CPC)');
  }
  
  // Check ROAS performance
  if (roas >= benchmark.ROAS * 1.5) {
    strengths.push('Strong Return On Ad Spend (ROAS)');
  } else if (roas > 0 && roas < benchmark.ROAS * 0.7) {
    improvements.push('Low Return On Ad Spend (ROAS)');
  }
  
  // Check conversion rate
  if (conversionRate >= benchmark.CONVERSION_RATE * 1.5) {
    strengths.push('High Conversion Rate');
  } else if (conversionRate > 0 && conversionRate < benchmark.CONVERSION_RATE * 0.7) {
    improvements.push('Low Conversion Rate');
  }
  
  // Check frequency
  if (frequency > benchmark.FREQUENCY * 1.5) {
    improvements.push('High ad frequency may cause fatigue');
  }
  
  // Check video metrics if applicable
  if (viewRate > 0) {
    if (viewRate >= benchmark.VIEW_RATE * 1.3) {
      strengths.push('Strong Video View Rate');
    }
    
    if (videoCompletionRate >= benchmark.VIDEO_COMPLETION_RATE * 1.3) {
      strengths.push('High Video Completion Rate');
    } else if (videoCompletionRate > 0 && videoCompletionRate < benchmark.VIDEO_COMPLETION_RATE * 0.7) {
      improvements.push('Low Video Completion Rate');
    }
  }
  
  // Check negative feedback
  if (negativeFeedbackRate > 0.01) { // More than 1% negative feedback rate
    improvements.push('High Negative Feedback Rate');
  }
  
  // Ensure we have at least one strength and one improvement
  if (strengths.length === 0) {
    strengths.push('Stable performance across key metrics');
  }
  
  if (improvements.length === 0) {
    improvements.push('Consider testing different creatives or audiences');
  }
  
  return { strengths, improvements };
};

/**
 * Get comprehensive ad set metrics with performance analysis
 */
const getAdSetMetrics = (adSet) => {
  // Core metrics
  const impressions = adSet["Impressions"] || 0;
  const reach = adSet["Reach"] || 0;
  const amountSpent = adSet["Amount spent (USD)"] || 0;
  const revenue = adSet["Total revenue"] || 0;
  const results = adSet["Results"] || 0;
  const linkClicks = adSet["Link Clicks"] || 0;
  const conversions = adSet["Conversions"] || 0;
  const frequency = reach > 0 ? impressions / reach : 0;
  const ctr = impressions > 0 ? linkClicks / impressions : 0;
  const cpc = linkClicks > 0 ? amountSpent / linkClicks : 0;
  const cpm = impressions > 0 ? (amountSpent / impressions) * 1000 : 0;
  const roas = amountSpent > 0 ? revenue / amountSpent : 0;
  const conversionRate = linkClicks > 0 ? conversions / linkClicks : 0;
  const costPerResult = results > 0 ? amountSpent / results : 0;
  
  // Calculate performance score
  const performanceScore = calculateAdPerformanceScore({
    ctr,
    cpc,
    cpm,
    roas,
    conversionRate,
    frequency,
    viewRate: 0, // Not typically available at ad set level
    videoCompletionRate: 0, // Not typically available at ad set level
    negativeFeedbackRate: 0, // Not typically available at ad set level
    engagementRate: ctr // Using CTR as a proxy for engagement
  });
  
  // Get performance tier
  const performanceTier = getPerformanceTier(performanceScore);
  
  // Get key strengths and improvement areas
  const { strengths, improvements } = getPerformanceInsights({
    ctr,
    cpc,
    roas,
    conversionRate,
    frequency,
    viewRate: 0,
    videoCompletionRate: 0,
    negativeFeedbackRate: 0,
    benchmark: AD_BENCHMARKS
  });

  return {
    // Core metrics
    adSetId: adSet["Ad set ID"],
    adSetName: adSet["Ad set name"] || adSet["Ad Set Name"],
    campaignId: adSet["Campaign ID"],
    campaignName: adSet["Campaign name"],
    
    // Performance metrics
    performance: {
      score: performanceScore,
      tier: performanceTier,
      metrics: {
        ctr,
        cpc,
        cpm,
        roas,
        conversionRate,
        frequency,
        costPerResult,
        results
      },
      benchmark: AD_BENCHMARKS,
      strengths,
      improvements,
      lastUpdated: new Date().toISOString()
    },
    
    // Engagement metrics
    engagement: {
      impressions,
      reach,
      frequency,
      linkClicks,
      ctr,
      conversions,
      conversionRate
    },
    
    // Financial metrics
    financials: {
      amountSpent,
      revenue,
      roas,
      cpc,
      cpm,
      costPerResult,
      estimatedEarnings: adSet["Estimated earnings (USD)"] || 0,
      valuePerResult: results > 0 ? revenue / results : 0
    },
    
    // Audience metrics
    audience: {
      targetAudience: adSet["Targeting"],
      ageRanges: adSet["Age Ranges"] || [],
      genders: adSet["Genders"] || [],
      locations: adSet["Locations"] || [],
      interests: adSet["Interests"] || []
    },
    
    // Scheduling and delivery
    scheduling: {
      startDate: adSet["Start date"],
      endDate: adSet["End date"],
      status: adSet["Status"],
      delivery: adSet["Delivery"],
      optimizationGoal: adSet["Optimization goal"],
      bidStrategy: adSet["Bid strategy"]
    },
    
    // Creative details
    creative: {
      adName: adSet["Ad name"] || 'N/A',
      creativeType: adSet["Creative type"] || 'Unknown',
      primaryText: adSet["Primary text"],
      headline: adSet["Headline"],
      description: adSet["Description"],
      callToAction: adSet["Call to action"],
      imageUrl: adSet["Image URL"],
      videoUrl: adSet["Video URL"]
    },
    
    // Platform-specific metrics
    platformMetrics: {
      platform: adSet["Platform"] || 'unknown',
      placement: adSet["Placement"] || 'Unknown',
      devicePlatforms: adSet["Device Platforms"] || [],
      publisherPlatforms: adSet["Publisher Platforms"] || []
    }
  };
};

module.exports = {
  // Core functions
  getAdMetrics,
  getAdSetMetrics,
  
  // Utility functions
  calculateAdPerformanceScore,
  getPerformanceTier,
  getPerformanceInsights,
  
  // Constants (for reference)
  AD_BENCHMARKS
};
