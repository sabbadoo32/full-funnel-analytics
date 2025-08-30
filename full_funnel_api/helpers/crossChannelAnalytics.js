/**
 * Cross-channel analytics and attribution helper functions
 */

/**
 * Get comprehensive attribution metrics with cross-channel insights
 */
const getAttributionMetrics = (campaign) => {
  // Core metrics
  const engagementRate = campaign["Engagement rate"] || 0;
  const conversionRate = campaign["Conversion Rate"] || 0;
  const roas = campaign["ROAS"] || 0;
  const costPerAcquisition = campaign["Cost Per Acquisition"] || 0;
  const averageOrderValue = campaign["Average Order Value"] || 0;
  const clickThroughRate = campaign["Click-Through Rate"] || 0;
  const bounceRate = campaign["Bounce Rate"] || 0;
  
  // Calculate performance score
  const performanceScore = calculateCrossChannelScore({
    engagementRate,
    roas,
    conversionRate,
    clickThroughRate,
    bounceRate,
    costPerAcquisition,
    averageOrderValue
  });
  
  // Get performance tier
  const performanceTier = getPerformanceTier(performanceScore);
  
  return {
    // Channel attribution
    source: {
      firstUserSourceMedium: campaign["First user source / medium"],
      firstUserPrimaryChannelGroup: campaign["First user primary channel group (Default Channel Group)"],
      appOrChannel: campaign["App or Channel"],
      campaignSource: campaign["Campaign Source"],
      campaignMedium: campaign["Campaign Medium"],
      campaignName: campaign["Campaign Name"]
    },
    
    // Engagement metrics
    engagement: {
      engagedSessions: campaign["Engaged sessions"] || 0,
      engagementRate: parseFloat(engagementRate.toFixed(4)),
      engagedSessionsPerUser: campaign["Engaged sessions per user"] || 0,
      avgEngagementTime: campaign["Average engagement time"] || 0,
      pagesPerSession: campaign["Pages / Session"] || 0,
      avgSessionDuration: campaign["Avg. Session Duration"] || 0
    },
    
    // Conversion metrics
    conversions: {
      eventCount: campaign["Event count"] || 0,
      userKeyEventRate: campaign["User key event rate"] || 0,
      conversionRate: parseFloat(conversionRate.toFixed(4)),
      goalCompletions: campaign["Goal Completions"] || 0,
      goalValue: campaign["Goal Value"] || 0,
      transactions: campaign["Transactions"] || 0,
      revenue: campaign["Revenue"] || 0,
      ecommerceConversionRate: campaign["Ecommerce Conversion Rate"] || 0
    },
    
    // Cost metrics
    cost: {
      spend: campaign["Spend"] || 0,
      costPerSession: campaign["Cost Per Session"] || 0,
      costPerLead: campaign["Cost Per Lead"] || 0,
      costPerPurchase: campaign["Cost Per Purchase"] || 0,
      costPerAcquisition: parseFloat(costPerAcquisition.toFixed(2)),
      roas: parseFloat(roas.toFixed(2)),
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2))
    },
    
    // Performance analysis
    performance: {
      score: performanceScore,
      tier: performanceTier,
      benchmark: CROSS_CHANNEL_BENCHMARKS,
      lastUpdated: new Date().toISOString(),
      
      // Performance indicators
      indicators: {
        isAboveAverageEngagement: engagementRate > CROSS_CHANNEL_BENCHMARKS.ENGAGEMENT_RATE,
        isAboveAverageRoas: roas > CROSS_CHANNEL_BENCHMARKS.ROAS,
        isBelowAverageCpa: costPerAcquisition < CROSS_CHANNEL_BENCHMARKS.COST_PER_ACQUISITION,
        isAboveAverageAov: averageOrderValue > CROSS_CHANNEL_BENCHMARKS.AVERAGE_ORDER_VALUE
      },
      
      // Performance insights
      insights: {
        topPerformingChannel: null, // Will be populated by channel analysis
        bestPerformingCampaign: null, // Will be populated by campaign analysis
        improvementOpportunities: [] // Will be populated by analysis
      }
    },
    
    // Channel-specific metrics
    channels: {
      email: {
        sent: campaign["Email Sent"] || 0,
        opens: campaign["Email Opens"] || 0,
        clicks: campaign["Email Clicks"] || 0,
        bounces: campaign["Email Bounces"] || 0,
        unsubscribes: campaign["Email Unsubscribes"] || 0,
        openRate: campaign["Email Open Rate"] || 0,
        clickRate: campaign["Email Click Rate"] || 0
      },
      facebook: {
        reach: campaign["Facebook reach"] || 0,
        visits: campaign["Facebook visits"] || 0,
        impressions: campaign["Facebook Impressions"] || 0,
        engagementRate: campaign["Facebook Engagement Rate"] || 0,
        costPerResult: campaign["Facebook Cost Per Result"] || 0
      },
      instagram: {
        reach: campaign["Instagram reach"] || 0,
        visits: campaign["Instagram profile visits"] || 0,
        impressions: campaign["Instagram Impressions"] || 0,
        engagementRate: campaign["Instagram Engagement Rate"] || 0,
        costPerResult: campaign["Instagram Cost Per Result"] || 0
      },
      web: {
        sessions: campaign["Sessions"] || 0,
        users: campaign["Users"] || 0,
        pageviews: campaign["Pageviews"] || 0,
        pagesPerSession: campaign["Pages / Session"] || 0,
        avgSessionDuration: campaign["Avg. Session Duration"] || 0,
        bounceRate: campaign["Bounce Rate"] || 0
      }
    },
    
    // Audience metrics
    audience: {
      demographics: {
        ageRanges: campaign["Age Ranges"] || {},
        genders: campaign["Genders"] || {},
        locations: campaign["Locations"] || {},
        interests: campaign["Interests"] || {}
      },
      devices: {
        deviceCategories: campaign["Device Categories"] || {},
        browsers: campaign["Browsers"] || {},
        operatingSystems: campaign["Operating Systems"] || {}
      }
    },
    
    // Timestamp
    lastUpdated: new Date().toISOString()
};

/**
 * Get comprehensive campaign performance metrics with trend analysis
 */
const getCampaignPerformance = (campaign, previousPeriodData = null) => {
  // Core metrics
  const spend = campaign["Spend"] || 0;
  const revenue = campaign["Revenue"] || 0;
  const roas = campaign["ROAS"] || 0;
  const users = campaign["Users"] || 0;
  const newUsers = campaign["New Users"] || 0;
  const sessions = campaign["Sessions"] || 0;
  const conversionRate = campaign["Conversion Rate"] || 0;
  const averageOrderValue = campaign["Average Order Value"] || 0;
  
  // Calculate metrics
  const costPerAcquisition = spend / (users || 1);
  const newUserRate = users > 0 ? (newUsers / users) * 100 : 0;
  const revenuePerUser = users > 0 ? revenue / users : 0;
  
  // Calculate trends if previous period data is available
  let trends = null;
  if (previousPeriodData) {
    const prevSpend = previousPeriodData.spend || 0;
    const prevRevenue = previousPeriodData.revenue || 0;
    const prevUsers = previousPeriodData.users || 0;
    const prevSessions = previousPeriodData.sessions || 0;
    const prevConversions = previousPeriodData.conversionRate * (prevSessions || 1) || 0;
    
    const spendChange = prevSpend > 0 ? ((spend - prevSpend) / prevSpend) * 100 : 0;
    const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
    const userChange = prevUsers > 0 ? ((users - prevUsers) / prevUsers) * 100 : 0;
    const sessionChange = prevSessions > 0 ? ((sessions - prevSessions) / prevSessions) * 100 : 0;
    
    const currentConversions = conversionRate * (sessions || 1);
    const conversionChange = prevConversions > 0 ? 
      ((currentConversions - prevConversions) / prevConversions) * 100 : 0;
    
    trends = {
      spend: {
        value: spend,
        change: parseFloat(spendChange.toFixed(2)),
        direction: spendChange >= 0 ? 'up' : 'down'
      },
      revenue: {
        value: revenue,
        change: parseFloat(revenueChange.toFixed(2)),
        direction: revenueChange >= 0 ? 'up' : 'down'
      },
      users: {
        value: users,
        change: parseFloat(userChange.toFixed(2)),
        direction: userChange >= 0 ? 'up' : 'down'
      },
      sessions: {
        value: sessions,
        change: parseFloat(sessionChange.toFixed(2)),
        direction: sessionChange >= 0 ? 'up' : 'down'
      },
      conversions: {
        value: currentConversions,
        change: parseFloat(conversionChange.toFixed(2)),
        direction: conversionChange >= 0 ? 'up' : 'down'
      },
      roas: {
        value: roas,
        change: prevRevenue > 0 ? 
          parseFloat((((revenue / spend) - (prevRevenue / (prevSpend || 1))) / (prevRevenue / (prevSpend || 1)) * 100).toFixed(2)) : 0,
        direction: roas > (prevRevenue / (prevSpend || 1)) ? 'up' : 'down'
      }
    };
  }
  
  // Get performance score
  const performanceScore = calculateCrossChannelScore({
    engagementRate: campaign["Engagement rate"] || 0,
    roas,
    conversionRate,
    clickThroughRate: campaign["Click-Through Rate"] || 0,
    bounceRate: campaign["Bounce Rate"] || 0,
    costPerAcquisition,
    averageOrderValue
  });
  
  // Get performance tier
  const performanceTier = getPerformanceTier(performanceScore);
  
  return {
    // Campaign identification
    campaign: {
      id: campaign["Campaign ID"] || null,
      name: campaign["Campaign"],
      period: campaign["Period"],
      status: campaign["Status"] || 'active',
      startDate: campaign["Start Date"],
      endDate: campaign["End Date"] || null,
      campaignDay: campaign["Campaign Day"]
    },
    
    // Performance metrics
    metrics: {
      // Financial metrics
      financial: {
        spend: parseFloat(spend.toFixed(2)),
        revenue: parseFloat(revenue.toFixed(2)),
        roas: parseFloat(roas.toFixed(2)),
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        costPerAcquisition: parseFloat(costPerAcquisition.toFixed(2)),
        returnOnAdSpend: parseFloat(roas.toFixed(2)),
        profit: parseFloat((revenue - spend).toFixed(2)),
        profitMargin: spend > 0 ? parseFloat((((revenue - spend) / spend) * 100).toFixed(2)) : 0
      },
      
      // User metrics
      users: {
        total: users,
        new: newUsers,
        returning: Math.max(0, users - newUsers),
        newUserRate: parseFloat(newUserRate.toFixed(2)),
        revenuePerUser: parseFloat(revenuePerUser.toFixed(2)),
        lifetimeValue: campaign["Lifetime Value"] || 0
      },
      
      // Engagement metrics
      engagement: {
        sessions: sessions,
        sessionDuration: campaign["Avg. Session Duration"] || 0,
        pagesPerSession: campaign["Pages / Session"] || 0,
        bounceRate: campaign["Bounce Rate"] || 0,
        eventsPerSession: campaign["Events / Session"] || 0
      },
      
      // Conversion metrics
      conversion: {
        rate: parseFloat(conversionRate.toFixed(4)),
        goalCompletions: campaign["Goal Completions"] || 0,
        goalValue: campaign["Goal Value"] || 0,
        ecommerceConversionRate: campaign["Ecommerce Conversion Rate"] || 0,
        transactions: campaign["Transactions"] || 0
      }
    },
    
    // Performance analysis
    performance: {
      score: performanceScore,
      tier: performanceTier,
      benchmark: CROSS_CHANNEL_BENCHMARKS,
      lastUpdated: new Date().toISOString(),
      
      // Performance indicators
      indicators: {
        isProfitable: revenue > spend,
        isAboveAverageRoas: roas > CROSS_CHANNEL_BENCHMARKS.ROAS,
        isBelowAverageCpa: costPerAcquisition < CROSS_CHANNEL_BENCHMARKS.COST_PER_ACQUISITION,
        isAboveAverageAov: averageOrderValue > CROSS_CHANNEL_BENCHMARKS.AVERAGE_ORDER_VALUE
      },
      
      // Performance insights
      insights: {
        topPerformingChannel: null, // Will be populated by channel analysis
        bestPerformingSegment: null, // Will be populated by segment analysis
        improvementOpportunities: [] // Will be populated by analysis
      }
    },
    
    // Trend analysis (if previous period data is available)
    trends: trends,
    
    // Timestamp
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Get comprehensive channel reach and performance metrics
 */
const getChannelReach = (campaign) => {
  // Calculate channel-specific metrics
  const facebookMetrics = {
    reach: campaign["Facebook reach"] || 0,
    impressions: campaign["Facebook Impressions"] || 0,
    visits: campaign["Facebook visits"] || 0,
    engagementRate: campaign["Facebook Engagement Rate"] || 0,
    costPerResult: campaign["Facebook Cost Per Result"] || 0,
    frequency: campaign["Facebook Frequency"] || 0,
    cpm: campaign["Facebook CPM"] || 0,
    cpc: campaign["Facebook CPC"] || 0
  };

  const instagramMetrics = {
    reach: campaign["Instagram reach"] || 0,
    impressions: campaign["Instagram Impressions"] || 0,
    visits: campaign["Instagram profile visits"] || 0,
    engagementRate: campaign["Instagram Engagement Rate"] || 0,
    costPerResult: campaign["Instagram Cost Per Result"] || 0,
    frequency: campaign["Instagram Frequency"] || 0,
    cpm: campaign["Instagram CPM"] || 0,
    cpc: campaign["Instagram CPC"] || 0
  };

  const webMetrics = {
    sessions: campaign["Sessions"] || 0,
    users: campaign["Users"] || 0,
    newUsers: campaign["New Users"] || 0,
    pageviews: campaign["Pageviews"] || 0,
    pagesPerSession: campaign["Pages / Session"] || 0,
    avgSessionDuration: campaign["Avg. Session Duration"] || 0,
    bounceRate: campaign["Bounce Rate"] || 0,
    conversionRate: campaign["Conversion Rate"] || 0
  };

  const emailMetrics = {
    sent: campaign["Email Sent"] || 0,
    delivered: campaign["Email Delivered"] || 0,
    opens: campaign["Email Opens"] || 0,
    clicks: campaign["Email Clicks"] || 0,
    bounces: campaign["Email Bounces"] || 0,
    unsubscribes: campaign["Email Unsubscribes"] || 0,
    openRate: campaign["Email Open Rate"] || 0,
    clickRate: campaign["Email Click Rate"] || 0,
    clickToOpenRate: campaign["Email Click to Open Rate"] || 0
  };

  // Calculate cross-channel metrics
  const totalReach = facebookMetrics.reach + instagramMetrics.reach + webMetrics.users;
  const totalImpressions = facebookMetrics.impressions + instagramMetrics.impressions;
  const totalEngagement = (facebookMetrics.visits || 0) + (instagramMetrics.visits || 0) + (webMetrics.sessions || 0);
  
  // Calculate channel distribution
  const channelDistribution = {
    facebook: {
      reach: totalReach > 0 ? (facebookMetrics.reach / totalReach) * 100 : 0,
      impressions: totalImpressions > 0 ? (facebookMetrics.impressions / totalImpressions) * 100 : 0,
      engagement: totalEngagement > 0 ? ((facebookMetrics.visits || 0) / totalEngagement) * 100 : 0
    },
    instagram: {
      reach: totalReach > 0 ? (instagramMetrics.reach / totalReach) * 100 : 0,
      impressions: totalImpressions > 0 ? (instagramMetrics.impressions / totalImpressions) * 100 : 0,
      engagement: totalEngagement > 0 ? ((instagramMetrics.visits || 0) / totalEngagement) * 100 : 0
    },
    web: {
      reach: totalReach > 0 ? (webMetrics.users / totalReach) * 100 : 0,
      impressions: 0, // Web doesn't have direct impression metrics
      engagement: totalEngagement > 0 ? (webMetrics.sessions / totalEngagement) * 100 : 0
    },
    email: {
      reach: 0, // Email reach is separate
      impressions: emailMetrics.delivered,
      engagement: emailMetrics.openRate
    }
  };

  // Calculate performance scores for each channel
  const calculateChannelScore = (metrics, type) => {
    let score = 0;
    
    switch(type) {
      case 'facebook':
      case 'instagram':
        score = (
          (Math.min(100, (metrics.engagementRate / 0.1) * 100) * 0.4) +
          (Math.max(0, 100 - (metrics.costPerResult / 10) * 100) * 0.3) +
          (Math.min(100, (metrics.reach / 10000) * 100) * 0.2) +
          (Math.min(100, (1 / (metrics.frequency || 1)) * 100) * 0.1)
        );
        break;
        
      case 'web':
        score = (
          (Math.min(100, (1 - metrics.bounceRate) * 100) * 0.3) +
          (Math.min(100, metrics.pagesPerSession * 20) * 0.2) +
          (Math.min(100, (metrics.avgSessionDuration / 180) * 100) * 0.2) +
          (Math.min(100, metrics.conversionRate * 1000) * 0.3)
        );
        break;
        
      case 'email':
        score = (
          (metrics.openRate * 0.3) +
          (metrics.clickRate * 0.4) +
          (Math.max(0, 100 - (metrics.unsubscribes / (metrics.sent || 1)) * 10000) * 0.2) +
          (Math.min(100, (metrics.clicks / (metrics.opens || 1)) * 100) * 0.1)
        );
        break;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  // Get scores and tiers for each channel
  const facebookScore = calculateChannelScore(facebookMetrics, 'facebook');
  const instagramScore = calculateChannelScore(instagramMetrics, 'instagram');
  const webScore = calculateChannelScore(webMetrics, 'web');
  const emailScore = calculateChannelScore(emailMetrics, 'email');

  // Find top performing channel
  const channelScores = [
    { channel: 'facebook', score: facebookScore },
    { channel: 'instagram', score: instagramScore },
    { channel: 'web', score: webScore },
    { channel: 'email', score: emailScore }
  ].sort((a, b) => b.score - a.score);

  const topPerformingChannel = channelScores[0];

  return {
    // Overall reach metrics
    summary: {
      totalReach,
      totalImpressions,
      totalEngagement,
      averageFrequency: (facebookMetrics.frequency + instagramMetrics.frequency) / 2,
      uniqueReach: Math.max(facebookMetrics.reach, instagramMetrics.reach, webMetrics.users) // Approximation
    },
    
    // Channel-specific metrics
    channels: {
      facebook: {
        ...facebookMetrics,
        performance: {
          score: facebookScore,
          tier: getPerformanceTier(facebookScore)
        }
      },
      instagram: {
        ...instagramMetrics,
        performance: {
          score: instagramScore,
          tier: getPerformanceTier(instagramScore)
        }
      },
      web: {
        ...webMetrics,
        performance: {
          score: webScore,
          tier: getPerformanceTier(webScore)
        }
      },
      email: {
        ...emailMetrics,
        performance: {
          score: emailScore,
          tier: getPerformanceTier(emailScore)
        }
      }
    },
    
    // Cross-channel analysis
    analysis: {
      channelDistribution,
      topPerformingChannel: {
        channel: topPerformingChannel.channel,
        score: topPerformingChannel.score,
        tier: getPerformanceTier(topPerformingChannel.score)
      },
      channelEffectiveness: channelScores.map(channel => ({
        channel: channel.channel,
        score: channel.score,
        tier: getPerformanceTier(channel.score),
        contribution: channelDistribution[channel.channel]?.reach || 0
      })),
      lastUpdated: new Date().toISOString()
    }
  };
};

// Industry benchmarks for cross-channel performance
const CROSS_CHANNEL_BENCHMARKS = {
  ENGAGEMENT_RATE: 0.5, // 50% average engagement rate
  ROAS: 4.0, // 4:1 return on ad spend
  COST_PER_ACQUISITION: 50.0, // $50 average CPA
  CONVERSION_RATE: 0.03, // 3% average conversion rate
  CLICK_THROUGH_RATE: 0.02, // 2% average CTR
  BOUNCE_RATE: 0.45, // 45% average bounce rate
  AVERAGE_ORDER_VALUE: 100.0 // $100 average order value
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
 * Calculate cross-channel performance score (0-100)
 */
const calculateCrossChannelScore = (metrics) => {
  const {
    engagementRate = 0,
    roas = 0,
    conversionRate = 0,
    clickThroughRate = 0,
    bounceRate = 0,
    costPerAcquisition = 0,
    averageOrderValue = 0
  } = metrics;

  // Normalize metrics against benchmarks (0-100 scale)
  const engagementScore = Math.min(100, (engagementRate / (CROSS_CHANNEL_BENCHMARKS.ENGAGEMENT_RATE * 1.5)) * 100);
  const roasScore = Math.min(100, (roas / (CROSS_CHANNEL_BENCHMARKS.ROAS * 1.5)) * 100);
  const conversionScore = Math.min(100, (conversionRate / (CROSS_CHANNEL_BENCHMARKS.CONVERSION_RATE * 1.5)) * 100);
  const ctrScore = Math.min(100, (clickThroughRate / (CROSS_CHANNEL_BENCHMARKS.CLICK_THROUGH_RATE * 1.5)) * 100);
  const bounceRateScore = Math.max(0, 100 - (bounceRate * 100));
  const cpaScore = Math.max(0, 100 - ((costPerAcquisition / CROSS_CHANNEL_BENCHMARKS.COST_PER_ACQUISITION) * 100));
  const aovScore = Math.min(100, (averageOrderValue / CROSS_CHANNEL_BENCHMARKS.AVERAGE_ORDER_VALUE) * 100);
  
  // Calculate weighted score (adjust weights as needed)
  const score = (
    (engagementScore * 0.15) +
    (roasScore * 0.25) +
    (conversionScore * 0.2) +
    (ctrScore * 0.1) +
    (bounceRateScore * 0.1) +
    (cpaScore * 0.1) +
    (aovScore * 0.1)
  );

  return Math.max(0, Math.min(100, Math.round(score)));
};

module.exports = {
  getAttributionMetrics,
  getCampaignPerformance,
  getChannelReach,
  CROSS_CHANNEL_BENCHMARKS,
  getPerformanceTier,
  calculateCrossChannelScore
};
