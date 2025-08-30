/**
 * Connected TV (CTV) analytics helper functions
 * Aligned with master schema field names
 */

const getCTVMetrics = (campaign) => {
  // Core metrics from master schema
  const metrics = {
    // Core CTV metrics
    totalHouseholds: campaign["Households"] || 0,
    totalImpressions: (campaign["Households"] || 0) * (campaign["Impressons per Household"] || 0),
    totalCompletedViews: campaign["Completed View"] || 0,
    totalViews: campaign["Views"] || 0,
    totalReach: campaign["Reach"] || 0,
    
    // Performance metrics
    viewThroughRate: campaign["View-Through Rate"] || 0,
    costPerView: campaign["Cost Per View"] || 0,
    totalSpend: (campaign["Completed View"] || 0) * (campaign["Cost Per View"] || 0),
    totalResults: campaign["Results"] || 0,
    costPerResult: (campaign["Results"] > 0) ? 
      ((campaign["Completed View"] || 0) * (campaign["Cost Per View"] || 0)) / campaign["Results"] : 0,
    
    // Campaign metadata
    campaignInfo: {
      campaignId: campaign["campaign_id"],
      campaignName: campaign["Campaign Name"] || 'Unnamed Campaign',
      objective: campaign["Objective"],
      strategy: campaign["Strategy"],
      frequency: campaign["Frequency"] || 0,
      platform: campaign["platform"] || 'Unknown'
    },
    
    // Timestamp
    lastUpdated: new Date().toISOString()
  };
  
  return metrics;
};

const getCTVPreferenceInsights = (campaign) => {
  // Process interests from campaign data
  const interests = typeof campaign["In-market & interests"] === 'string' 
    ? campaign["In-market & interests"].split(',').map(i => i.trim())
    : (Array.isArray(campaign["In-market & interests"]) ? campaign["In-market & interests"] : []);
  
  // Determine optimal viewing times
  const hour = campaign["Hour of day"] || new Date().getHours();
  const dayOfWeek = campaign["Day"] || new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  return {
    // Viewing patterns with enhanced insights
    viewingPatterns: {
      hour: hour,
      dayOfWeek: dayOfWeek,
      dayPart: getDayPart(hour),
      peakViewingTime: `${hour}:00 ${hour >= 12 ? 'PM' : 'AM'} on ${dayOfWeek}s`,
      recommendedPostingTime: getOptimalPostingTime(dayOfWeek, hour)
    },
    
    // Audience segments with enhanced insights
    audienceSegments: {
      demographics: {
        ageBracket: campaign["Age bracket"],
        gender: campaign["Self Reported Gender"],
        race: campaign["Self Reported Race"],
        ethnicity: campaign["Self Reported Ethnicity"],
        language: campaign["Self Reported Language"]
      },
      interests: interests,
      topInterests: interests.slice(0, 3),
      householdIncome: campaign["Household Income"] || 'Not Specified',
      educationLevel: campaign["Education Level"] || 'Not Specified'
    },
    
    // Geographic patterns with enhanced insights
    geographicInsights: {
      state: campaign["State"],
      zipCode: campaign["ZIP code"],
      region: campaign["Region"],
      country: campaign["Country"] || 'US',
      congressionalDistrict: campaign["Congressional District"],
      stateHouseDistrict: campaign["State House District"],
      stateSenateDistrict: campaign["State Senate District"]
    },
    
    // Campaign performance insights
    performanceInsights: {
      bestPerformingCreative: campaign["Best Performing Creative"] || 'Not Available',
      bestPerformingDay: campaign["Best Performing Day"] || dayOfWeek,
      bestPerformingHour: campaign["Best Performing Hour"] || hour,
      conversionRate: calculateConversionRate(campaign),
      engagementRate: calculateEngagementRate(campaign)
    },
    
    // Timestamp
    lastUpdated: new Date().toISOString()
  };
};

// Helper function to determine day part based on hour
function getDayPart(hour) {
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Prime Time';
  return 'Late Night';
}

// Helper function to calculate optimal posting time
function getOptimalPostingTime(dayOfWeek, hour) {
  // Simple algorithm - could be enhanced with historical performance data
  const optimalHours = {
    'Monday': 19, 'Tuesday': 20, 'Wednesday': 20, 'Thursday': 19, 
    'Friday': 18, 'Saturday': 15, 'Sunday': 14
  };
  
  const optimalHour = optimalHours[dayOfWeek] || 19;
  const timeDiff = (optimalHour - hour + 24) % 24;
  
  if (timeDiff === 0) return 'Now is the optimal time to post';
  if (timeDiff <= 2) return `Optimal time is in ${timeDiff} hour${timeDiff > 1 ? 's' : ''}`;
  return `Optimal time is at ${optimalHour}:00`;
}

// Calculate conversion rate based on campaign data
function calculateConversionRate(campaign) {
  const completedViews = campaign["Completed View"] || 0;
  const results = campaign["Results"] || 0;
  
  if (completedViews === 0) return 0;
  return (results / completedViews * 100).toFixed(2);
}

// Calculate engagement rate based on campaign data
function calculateEngagementRate(campaign) {
  const views = campaign["Views"] || 0;
  const totalEngagement = (campaign["Reactions"] || 0) + 
                         (campaign["Comments"] || 0) + 
                         (campaign["Shares"] || 0);
  
  if (views === 0) return 0;
  return ((totalEngagement / views) * 100).toFixed(2);
}

const getCTVPerformanceByDemo = (campaign) => {
  // Calculate performance metrics
  const completedViews = campaign["Completed View"] || 0;
  const totalViews = campaign["Views"] || 0;
  const viewThroughRate = totalViews > 0 ? (completedViews / totalViews * 100).toFixed(2) : 0;
  const engagementRate = calculateEngagementRate(campaign);
  const conversionRate = calculateConversionRate(campaign);
  
  // Process interests
  const interests = typeof campaign["In-market & interests"] === 'string' 
    ? campaign["In-market & interests"].split(',').map(i => i.trim())
    : (Array.isArray(campaign["In-market & interests"]) ? campaign["In-market & interests"] : []);
  
  // Calculate performance score
  const performanceScore = calculatePerformanceScore(campaign);
  
  return {
    // Overall performance metrics
    performanceMetrics: {
      totalImpressions: campaign["Households"] * (campaign["Impressons per Household"] || 0),
      totalViews: totalViews,
      completedViews: completedViews,
      viewThroughRate: parseFloat(viewThroughRate),
      completionRate: totalViews > 0 ? ((completedViews / totalViews) * 100).toFixed(2) : 0,
      engagementRate: parseFloat(engagementRate),
      conversionRate: parseFloat(conversionRate),
      costPerView: campaign["Cost Per View"] || 0,
      costPerCompletedView: completedViews > 0 
        ? ((campaign["Cost Per View"] || 0) * totalViews / completedViews).toFixed(2)
        : 0
    },
    
    // Performance by demographic
    byDemographic: {
      age: {
        bracket: campaign["Age bracket"] || 'Unknown',
        completedViews: completedViews,
        viewThroughRate: parseFloat(viewThroughRate),
        conversionRate: parseFloat(conversionRate)
      },
      gender: {
        value: campaign["Self Reported Gender"] || 'Unknown',
        completedViews: completedViews,
        viewThroughRate: parseFloat(viewThroughRate),
        conversionRate: parseFloat(conversionRate)
      },
      ethnicity: {
        value: campaign["Self Reported Ethnicity"] || 'Not Specified',
        completedViews: completedViews,
        viewThroughRate: parseFloat(viewThroughRate)
      },
      income: {
        bracket: campaign["Household Income"] || 'Not Specified',
        completedViews: completedViews,
        engagementRate: parseFloat(engagementRate)
      }
    },
    
    // Performance by geography
    byGeography: {
      region: {
        name: campaign["Region"] || 'Unknown',
        completedViews: completedViews,
        viewThroughRate: parseFloat(viewThroughRate)
      },
      state: {
        name: campaign["State"] || 'Unknown',
        completedViews: completedViews,
        viewThroughRate: parseFloat(viewThroughRate)
      },
      district: {
        congressional: campaign["Congressional District"] || 'Not Available',
        stateHouse: campaign["State House District"] || 'Not Available',
        stateSenate: campaign["State Senate District"] || 'Not Available'
      }
    },
    
    // Performance by interest
    byInterest: {
      interests: interests,
      topPerformingInterest: interests[0] || 'Not Available',
      completedViews: completedViews,
      engagementRate: parseFloat(engagementRate)
    },
    
    // Performance scoring
    performanceScoring: {
      overallScore: performanceScore,
      performanceTier: getPerformanceTier(performanceScore),
      keyStrengths: getKeyStrengths(campaign, performanceScore),
      improvementAreas: getImprovementAreas(campaign, performanceScore)
    },
    
    // Timestamp
    lastUpdated: new Date().toISOString()
  };
};

// Helper function to calculate overall performance score (0-100)
function calculatePerformanceScore(campaign) {
  const weights = {
    viewThroughRate: 0.3,
    completionRate: 0.25,
    engagementRate: 0.2,
    conversionRate: 0.15,
    costEfficiency: 0.1
  };
  
  const completedViews = campaign["Completed View"] || 0;
  const totalViews = campaign["Views"] || 0;
  const viewThroughRate = campaign["View-Through Rate"] || 0;
  const costPerView = campaign["Cost Per View"] || 0;
  
  // Normalize metrics to 0-100 scale
  const normalizedMetrics = {
    viewThroughRate: Math.min(100, viewThroughRate * 100), // Assuming VTR is 0-1
    completionRate: totalViews > 0 ? Math.min(100, (completedViews / totalViews) * 100) : 0,
    engagementRate: calculateEngagementRate(campaign),
    conversionRate: calculateConversionRate(campaign),
    costEfficiency: costPerView > 0 ? Math.max(0, 100 - (costPerView * 1000)) : 0 // Invert cost (lower is better)
  };
  
  // Calculate weighted score
  return Object.entries(weights).reduce((score, [metric, weight]) => {
    return score + (normalizedMetrics[metric] * weight);
  }, 0).toFixed(1);
}

// Helper function to get performance tier based on score
function getPerformanceTier(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Needs Improvement';
}

// Helper function to identify key strengths
function getKeyStrengths(campaign, score) {
  const strengths = [];
  const vtr = campaign["View-Through Rate"] || 0;
  const engagement = calculateEngagementRate(campaign);
  const conversion = calculateConversionRate(campaign);
  
  if (vtr > 0.5) strengths.push('High view-through rate');
  if (engagement > 5) strengths.push('Strong engagement');
  if (conversion > 2) strengths.push('Good conversion rate');
  if (score > 70) strengths.push('Overall strong performance');
  
  return strengths.length > 0 ? strengths : ['Consistent performance across metrics'];
}

// Helper function to identify improvement areas
function getImprovementAreas(campaign, score) {
  const areas = [];
  const vtr = campaign["View-Through Rate"] || 0;
  const engagement = calculateEngagementRate(campaign);
  const conversion = calculateConversionRate(campaign);
  const cost = campaign["Cost Per View"] || 0;
  
  if (vtr < 0.2) areas.push('Low view-through rate');
  if (engagement < 2) areas.push('Low engagement');
  if (conversion < 0.5) areas.push('Low conversion rate');
  if (cost > 0.1) areas.push('High cost per view');
  if (score < 40) areas.push('Overall performance needs improvement');
  
  return areas.length > 0 ? areas : ['No significant improvement areas identified'];
}

module.exports = {
  getCTVMetrics,
  getCTVPreferenceInsights,
  getCTVPerformanceByDemo
};
