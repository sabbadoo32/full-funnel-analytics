/**
 * Email analytics helper functions
 * Aligned with master schema and enhanced with advanced metrics
 */

const calculatePerformanceScore = (metrics) => {
  const weights = {
    openRate: 0.3,
    clickRate: 0.3,
    conversionRate: 0.2,
    bounceRate: 0.1,
    unsubscribeRate: 0.1
  };

  // Normalize metrics to 0-100 scale
  const normalized = {
    openRate: Math.min(100, metrics.openRate * 100),
    clickRate: Math.min(100, metrics.clickRate * 100),
    conversionRate: Math.min(100, metrics.conversionRate * 100),
    bounceRate: Math.max(0, 100 - (metrics.bounceRate * 1000)), // Lower is better
    unsubscribeRate: Math.max(0, 100 - (metrics.unsubscribeRate * 1000)) // Lower is better
  };

  // Calculate weighted score
  return Object.entries(weights).reduce((score, [metric, weight]) => {
    return score + (normalized[metric] * weight);
  }, 0).toFixed(1);
};

const getEmailMetrics = (campaign) => {
  // Core metrics
  const sent = campaign["Emails Sent"] || 0;
  const opened = campaign["Opened"] || 0;
  const clicked = campaign["Clicked"] || 0;
  const converted = campaign["Converted"] || 0;
  const bounced = campaign["Bounced"] || 0;
  const unsubscribed = campaign["Unsubscribed"] || 0;
  const spamReports = campaign["Spam Reports"] || 0;
  const forwards = campaign["Forwards"] || 0;
  
  // Calculate rates
  const openRate = sent > 0 ? opened / sent : 0;
  const clickRate = opened > 0 ? clicked / opened : 0;
  const conversionRate = clicked > 0 ? converted / clicked : 0;
  const bounceRate = sent > 0 ? bounced / sent : 0;
  const unsubscribeRate = sent > 0 ? unsubscribed / sent : 0;
  const spamRate = sent > 0 ? spamReports / sent : 0;
  const forwardRate = opened > 0 ? forwards / opened : 0;
  
  // Calculate performance score
  const performanceScore = calculatePerformanceScore({
    openRate,
    clickRate,
    conversionRate,
    bounceRate,
    unsubscribeRate
  });

  return {
    // Core metrics
    totalSent: sent,
    totalOpens: opened,
    totalClicks: clicked,
    totalConversions: converted,
    totalBounces: bounced,
    totalUnsubscribes: unsubscribed,
    totalSpamReports: spamReports,
    totalForwards: forwards,
    
    // Rate metrics (as decimals for calculations)
    rates: {
      openRate,
      clickRate,
      conversionRate,
      bounceRate,
      unsubscribeRate,
      spamRate,
      forwardRate,
      clickToOpenRate: openRate > 0 ? clickRate / openRate : 0
    },
    
    // Performance metrics
    performance: {
      score: parseFloat(performanceScore),
      tier: getPerformanceTier(performanceScore),
      industryBenchmark: getIndustryBenchmark('email'),
      keyStrengths: getKeyStrengths({
        openRate,
        clickRate,
        conversionRate,
        bounceRate,
        unsubscribeRate
      }),
      improvementAreas: getImprovementAreas({
        openRate,
        clickRate,
        conversionRate,
        bounceRate,
        unsubscribeRate
      })
    },
    
    // Engagement metrics
    engagement: {
      averageTimeToOpen: campaign["Avg. Time to Open"] || 0,
      averageTimeToClick: campaign["Avg. Time to Click"] || 0,
      totalUniqueClicks: campaign["Unique Clicks"] || 0,
      clickToOpenRate: openRate > 0 ? (clickRate / openRate) * 100 : 0
    },
    
    // Device and client data
    devices: {
      desktopOpens: campaign["Desktop Opens"] || 0,
      mobileOpens: campaign["Mobile Opens"] || 0,
      webmailOpens: campaign["Webmail Opens"] || 0,
      topEmailClient: campaign["Top Email Client"] || 'Unknown'
    },
    
    // Timestamp
    lastUpdated: new Date().toISOString()
  };
};

const getEmailToMobilizeMetrics = (campaign) => {
  const sent = campaign["Emails Sent"] || 0;
  const clicked = campaign["Clicked"] || 0;
  const rsvps = campaign["Mobilize RSVPs"] || 0;
  
  // Calculate rates
  const emailToRsvpRate = sent > 0 ? rsvps / sent : 0;
  const clickToRsvpRate = clicked > 0 ? rsvps / clicked : 0;
  
  return {
    totalRsvps: rsvps,
    rates: {
      emailToRsvpRate,
      clickToRsvpRate
    },
    performance: {
      score: calculateRsvpPerformanceScore(emailToRsvpRate, clickToRsvpRate),
      benchmark: getRsvpBenchmark()
    }
  };
};

// Helper functions
function getPerformanceTier(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Needs Improvement';
}

function getIndustryBenchmark(type) {
  // These would ideally come from a configuration or database
  const benchmarks = {
    email: {
      openRate: 0.21, // 21%
      clickRate: 0.10, // 10%
      bounceRate: 0.01, // 1%
      unsubscribeRate: 0.002 // 0.2%
    }
  };
  return benchmarks[type] || {};
}

function getKeyStrengths(metrics) {
  const strengths = [];
  const benchmark = getIndustryBenchmark('email');
  
  if (metrics.openRate > benchmark.openRate * 1.5) {
    strengths.push('High open rate');
  }
  if (metrics.clickRate > benchmark.clickRate * 1.5) {
    strengths.push('Strong click-through rate');
  }
  if (metrics.bounceRate < benchmark.bounceRate * 0.5) {
    strengths.push('Low bounce rate');
  }
  
  return strengths.length > 0 ? strengths : ['Consistent performance'];
}

function getImprovementAreas(metrics) {
  const areas = [];
  const benchmark = getIndustryBenchmark('email');
  
  if (metrics.openRate < benchmark.openRate * 0.8) {
    areas.push('Low open rate');
  }
  if (metrics.clickRate < benchmark.clickRate * 0.8) {
    areas.push('Low click-through rate');
  }
  if (metrics.bounceRate > benchmark.bounceRate * 1.5) {
    areas.push('High bounce rate');
  }
  if (metrics.unsubscribeRate > benchmark.unsubscribeRate * 2) {
    areas.push('High unsubscribe rate');
  }
  
  return areas.length > 0 ? areas : ['No significant areas for improvement'];
}

function calculateRsvpPerformanceScore(emailToRsvpRate, clickToRsvpRate) {
  // Normalize to 0-100 scale
  const normalizedEmailRate = Math.min(100, emailToRsvpRate * 1000);
  const normalizedClickRate = Math.min(100, clickToRsvpRate * 100);
  
  // Weighted average (60% click-to-RSVP, 40% email-to-RSVP)
  return (normalizedClickRate * 0.6 + normalizedEmailRate * 0.4).toFixed(1);
}

function getRsvpBenchmark() {
  return {
    emailToRsvpRate: 0.02, // 2%
    clickToRsvpRate: 0.10  // 10%
  };
}

module.exports = {
  getEmailMetrics,
  getEmailToMobilizeMetrics,
  // Export helper functions for testing
  _test: {
    calculatePerformanceScore,
    getPerformanceTier,
    calculateRsvpPerformanceScore
  }
};
