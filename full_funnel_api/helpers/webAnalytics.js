/**
 * Web analytics helper functions with enhanced metrics and performance analysis
 */

// Industry benchmarks for web performance
const WEB_BENCHMARKS = {
  BOUNCE_RATE: 0.45, // 45% average bounce rate
  AVG_SESSION_DURATION: 120, // 2 minutes
  PAGES_PER_SESSION: 2.5, // 2.5 pages per session
  CONVERSION_RATE: 0.023, // 2.3% average conversion rate
  NEW_SESSION_RATE: 0.6, // 60% new sessions
  AVG_LOAD_TIME: 3.5, // 3.5 seconds
  EXIT_RATE: 0.5 // 50% average exit rate
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
 * Calculate web performance score (0-100)
 */
const calculateWebPerformanceScore = (metrics) => {
  const {
    bounceRate = 0,
    avgSessionDuration = 0,
    pagesPerSession = 0,
    conversionRate = 0,
    newSessionRate = 0,
    avgLoadTime = 0,
    exitRate = 0,
    engagementRate = 0
  } = metrics;

  // Normalize metrics against benchmarks (0-100 scale)
  const bounceRateScore = Math.max(0, 100 - (bounceRate * 100));
  const sessionDurationScore = Math.min(100, (avgSessionDuration / (WEB_BENCHMARKS.AVG_SESSION_DURATION * 1.5)) * 100);
  const pagesScore = Math.min(100, (pagesPerSession / (WEB_BENCHMARKS.PAGES_PER_SESSION * 1.5)) * 100);
  const conversionScore = Math.min(100, (conversionRate / (WEB_BENCHMARKS.CONVERSION_RATE * 1.5)) * 100);
  const newSessionScore = Math.min(100, (newSessionRate / (WEB_BENCHMARKS.NEW_SESSION_RATE * 1.3)) * 100);
  const loadTimeScore = Math.max(0, 100 - ((avgLoadTime / (WEB_BENCHMARKS.AVG_LOAD_TIME * 2)) * 100));
  const exitRateScore = Math.max(0, 100 - (exitRate * 100));
  
  // Calculate weighted score (adjust weights as needed)
  const score = (
    (bounceRateScore * 0.15) +
    (sessionDurationScore * 0.15) +
    (pagesScore * 0.1) +
    (conversionScore * 0.25) +
    (newSessionScore * 0.1) +
    (loadTimeScore * 0.15) +
    (exitRateScore * 0.1)
  );

  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Get comprehensive web metrics with performance analysis
 */
const getWebMetrics = (campaign) => {
  // Core metrics
  const sessions = campaign["Sessions"] || 0;
  const users = campaign["Active users"] || 0;
  const newUsers = campaign["New users"] || 0;
  const pageviews = campaign["Pageviews"] || 0;
  const avgSessionDuration = campaign["Average engagement time per session"] || 0;
  const bounceRate = campaign["Bounce rate"] || 0;
  const exitRate = campaign["Exit rate"] || 0;
  const pagesPerSession = sessions > 0 ? pageviews / sessions : 0;
  const newSessionRate = sessions > 0 ? (campaign["New Sessions"] || 0) / sessions : 0;
  const avgLoadTime = campaign["Avg. Page Load Time (sec)"] || 0;
  const conversionRate = campaign["Conversion Rate"] || 0;
  
  // Calculate performance score
  const performanceScore = calculateWebPerformanceScore({
    bounceRate,
    avgSessionDuration,
    pagesPerSession,
    conversionRate,
    newSessionRate,
    avgLoadTime,
    exitRate,
    engagementRate: avgSessionDuration / 60 // Convert to minutes for engagement rate
  });
  
  // Get performance tier
  const performanceTier = getPerformanceTier(performanceScore);
  
  // Calculate trend metrics (if previous period data is available)
  const prevPeriodData = campaign["previousPeriod"] || {};
  const getTrend = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  return {
    // Core metrics
    overview: {
      sessions,
      users,
      newUsers,
      pageviews,
      pagesPerSession: parseFloat(pagesPerSession.toFixed(2)),
      avgSessionDuration: parseFloat(avgSessionDuration.toFixed(2)),
      bounceRate: parseFloat(bounceRate.toFixed(4)),
      exitRate: parseFloat(exitRate.toFixed(4)),
      newSessionRate: parseFloat(newSessionRate.toFixed(4)),
      avgLoadTime: parseFloat(avgLoadTime.toFixed(2)),
      conversionRate: parseFloat(conversionRate.toFixed(4)),
      lastUpdated: new Date().toISOString()
    },
    
    // Performance analysis
    performance: {
      score: performanceScore,
      tier: performanceTier,
      benchmark: WEB_BENCHMARKS,
      lastUpdated: new Date().toISOString()
    },
    
    // Traffic sources
    trafficSources: {
      sourceMedium: campaign["First user source / medium"],
      channels: campaign["Channels"] || [],
      campaigns: campaign["Campaigns"] || [],
      landingPage: campaign["Landing page"]
    },
    
    // User behavior
    userBehavior: {
      sessionsPerUser: users > 0 ? sessions / users : 0,
      newVsReturning: {
        newUsers,
        returningUsers: Math.max(0, users - newUsers),
        newUserPercentage: users > 0 ? (newUsers / users) * 100 : 0
      },
      sessionDuration: {
        avg: avgSessionDuration,
        distribution: campaign["Session Duration Distribution"] || {}
      },
      pageTiming: {
        avgLoadTime,
        avgServerResponseTime: campaign["Avg. Server Response Time (sec)"] || 0,
        avgPageDownloadTime: campaign["Avg. Page Download Time (sec)"] || 0
      }
    },
    
    // Conversion metrics
    conversions: {
      goalCompletions: campaign["Goal Completions"] || 0,
      goalValue: campaign["Goal Value"] || 0,
      goalConversionRate: campaign["Goal Conversion Rate"] || 0,
      transactions: campaign["Transactions"] || 0,
      revenue: campaign["Revenue"] || 0,
      ecommerceConversionRate: campaign["Ecommerce Conversion Rate"] || 0
    },
    
    // Technical metrics
    technical: {
      browsers: campaign["Browsers"] || [],
      operatingSystems: campaign["Operating Systems"] || [],
      screenResolutions: campaign["Screen Resolutions"] || [],
      mobileDeviceInfo: campaign["Mobile Device Info"] || [],
      countries: campaign["Countries"] || []
    },
    
    // Key events
    events: {
      totalEvents: campaign["Total Events"] || 0,
      eventsPerSession: campaign["Events Per Session"] || 0,
      eventValue: campaign["Event Value"] || 0,
      topEvents: campaign["Top Events"] || []
    },
    
    // Trends (if previous period data is available)
    trends: prevPeriodData.sessions ? {
      sessions: getTrend(sessions, prevPeriodData.sessions || 0),
      users: getTrend(users, prevPeriodData.users || 0),
      pageviews: getTrend(pageviews, prevPeriodData.pageviews || 0),
      avgSessionDuration: getTrend(avgSessionDuration, prevPeriodData.avgSessionDuration || 0),
      bounceRate: getTrend(bounceRate, prevPeriodData.bounceRate || 0),
      conversionRate: getTrend(conversionRate, prevPeriodData.conversionRate || 0)
    } : null
  };
};

/**
 * Get comprehensive conversion metrics with performance analysis
 */
const getConversionMetrics = (campaign) => {
  // Core metrics
  const sessions = campaign["Sessions"] || 0;
  const users = campaign["Active users"] || 0;
  const conversions = campaign["Conversions"] || 0;
  const conversionRate = campaign["Conversion Rate"] || 0;
  const revenue = campaign["Total revenue"] || 0;
  const cost = campaign["Cost"] || 0;
  const roas = cost > 0 ? revenue / cost : 0;
  const avgOrderValue = conversions > 0 ? revenue / conversions : 0;
  
  // E-commerce metrics
  const transactions = campaign["Transactions"] || 0;
  const revenuePerUser = users > 0 ? revenue / users : 0;
  const transactionsPerUser = users > 0 ? transactions / users : 0;
  
  // Multi-touch attribution (if available)
  const attributionModel = campaign["Attribution Model"] || 'Last Click';
  const assistedConversions = campaign["Assisted Conversions"] || 0;
  const firstClickConversions = campaign["First Click Conversions"] || 0;
  const lastClickConversions = campaign["Last Click Conversions"] || 0;
  
  // Calculate conversion performance score
  const conversionScore = calculateConversionPerformanceScore({
    conversionRate,
    roas,
    avgOrderValue,
    transactionsPerUser,
    bounceRate: campaign["Bounce Rate"] || 0,
    sessionsToTransaction: campaign["Sessions to Transaction"] || 1
  });
  
  // Get performance tier
  const performanceTier = getPerformanceTier(conversionScore);
  
  // Calculate trends if previous period data is available
  const prevPeriodData = campaign["previousPeriod"] || {};
  const getTrend = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  return {
    // Core conversion metrics
    overview: {
      sessions,
      users,
      conversions,
      conversionRate: parseFloat(conversionRate.toFixed(4)),
      revenue: parseFloat(revenue.toFixed(2)),
      cost: parseFloat(cost.toFixed(2)),
      roas: parseFloat(roas.toFixed(2)),
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      transactions,
      transactionsPerUser: parseFloat(transactionsPerUser.toFixed(2)),
      revenuePerUser: parseFloat(revenuePerUser.toFixed(2)),
      lastUpdated: new Date().toISOString()
    },
    
    // Performance analysis
    performance: {
      score: conversionScore,
      tier: performanceTier,
      benchmark: {
        conversionRate: WEB_BENCHMARKS.CONVERSION_RATE,
        roas: 4.0, // Industry average ROAS
        avgOrderValue: 100.00 // Industry benchmark
      },
      lastUpdated: new Date().toISOString()
    },
    
    // Attribution data
    attribution: {
      model: attributionModel,
      assistedConversions,
      firstClickConversions,
      lastClickConversions,
      timeToConversion: campaign["Time to Conversion"] || {},
      pathLength: campaign["Path Length"] || {}
    },
    
    // Conversion paths
    conversionPaths: {
      topPaths: campaign["Top Conversion Paths"] || [],
      channelGroupings: campaign["Channel Groupings"] || {},
      sourceMedium: campaign["Source/Medium"] || {}
    },
    
    // E-commerce metrics
    ecommerce: {
      productPerformance: campaign["Product Performance"] || [],
      productListPerformance: campaign["Product List Performance"] || [],
      shoppingBehavior: campaign["Shopping Behavior"] || {},
      checkoutBehavior: campaign["Checkout Behavior"] || {},
      productCouponUsage: campaign["Product Coupon Usage"] || {}
    },
    
    // Funnel visualization
    funnel: {
      steps: campaign["Funnel Steps"] || [],
      dropOffRates: campaign["Drop-off Rates"] || {},
      completionRate: campaign["Funnel Completion Rate"] || 0
    },
    
    // Trends (if previous period data is available)
    trends: prevPeriodData.conversions ? {
      conversions: getTrend(conversions, prevPeriodData.conversions || 0),
      conversionRate: getTrend(conversionRate, prevPeriodData.conversionRate || 0),
      revenue: getTrend(revenue, prevPeriodData.revenue || 0),
      roas: getTrend(roas, prevPeriodData.roas || 0),
      avgOrderValue: getTrend(avgOrderValue, prevPeriodData.avgOrderValue || 0)
    } : null
  };
};

/**
 * Calculate conversion performance score (0-100)
 */
const calculateConversionPerformanceScore = (metrics) => {
  const {
    conversionRate = 0,
    roas = 0,
    avgOrderValue = 0,
    transactionsPerUser = 0,
    bounceRate = 0,
    sessionsToTransaction = 1
  } = metrics;
  
  // Normalize metrics (0-100 scale)
  const conversionRateScore = Math.min(100, (conversionRate / (WEB_BENCHMARKS.CONVERSION_RATE * 2)) * 100);
  const roasScore = Math.min(100, (roas / 8) * 100); // Cap at 800% ROAS
  const aovScore = Math.min(100, (avgOrderValue / 200) * 100); // Cap at $200 AOV
  const tpuScore = Math.min(100, transactionsPerUser * 50); // Cap at 2 transactions per user
  const bounceRateScore = Math.max(0, 100 - (bounceRate * 100));
  const efficiencyScore = Math.max(0, 100 - ((sessionsToTransaction - 1) * 20)); // Penalize more sessions per transaction
  
  // Calculate weighted score
  const score = (
    (conversionRateScore * 0.25) +
    (roasScore * 0.3) +
    (aovScore * 0.15) +
    (tpuScore * 0.1) +
    (bounceRateScore * 0.1) +
    (efficiencyScore * 0.1)
  );
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

module.exports = {
  // Core functions
  getWebMetrics,
  getConversionMetrics,
  
  // Utility functions
  calculateWebPerformanceScore,
  calculateConversionPerformanceScore,
  getPerformanceTier,
  
  // Constants (for reference)
  WEB_BENCHMARKS
};
