/**
 * Impactive Analytics Helper
 * Provides functions to process and analyze Impactive action data
 */

// Action type categories for grouping similar actions
const ACTION_CATEGORIES = {
  SOCIAL: ['social_share', 'social_comment', 'social_like', 'social_retweet'],
  ENGAGEMENT: ['email_sent', 'email_opened', 'email_clicked', 'link_clicked'],
  DONATION: ['donation', 'recurring_donation', 'donation_upsell'],
  PETITION: ['petition_signed', 'petition_shared'],
  EVENT: ['event_rsvp', 'event_attended', 'event_shared'],
  FUNDRAISING: ['fundraiser_created', 'fundraiser_shared', 'fundraiser_donated'],
  CONTACT: ['contact_congress', 'contact_rep', 'contact_senator']
};

// Benchmarks for action performance (can be customized per campaign)
const BENCHMARKS = {
  // Completion rate benchmarks by action type
  completionRates: {
    default: 0.3, // 30% completion rate
    petition_signed: 0.4,
    email_sent: 0.25,
    donation: 0.15,
    social_share: 0.35
  },
  // Conversion rate from started to completed actions
  conversionRate: 0.25, // 25% conversion rate
  // Average time to complete an action (in minutes)
  avgCompletionTime: 2,
  // User engagement metrics
  userEngagement: {
    actionsPerUser: 3, // Average actions per user
    sessionDuration: 5, // Minutes
    returnRate: 0.2 // 20% of users return
  }
};

/**
 * Categorize an action type into a broader category
 * @param {string} actionType - The specific action type
 * @returns {string} - The category name
 */
const categorizeAction = (actionType) => {
  if (!actionType) return 'other';
  
  for (const [category, types] of Object.entries(ACTION_CATEGORIES)) {
    if (types.includes(actionType)) {
      return category.toLowerCase();
    }
  }
  return 'other';
};

/**
 * Extract action details from an Impactive action
 * @param {Object} action - The action object from Impactive
 * @returns {Object} - Processed action details
 */
const getActionDetails = (action) => {
  const actionType = action.action_type || 'unknown';
  const category = categorizeAction(actionType);
  const isCompleted = action.completed === true || action.completed === 'true';
  const isOptIn = action.opt_in === true || action.opt_in === 'true';
  const createdAt = action.action_created_at ? new Date(action.action_created_at) : new Date();
  
  return {
    id: action.action_id,
    userId: action.user_id,
    campaignId: action.campaign_id,
    campaignName: action.campaign_name,
    actionType,
    category,
    isCompleted,
    isOptIn,
    timestamp: createdAt,
    date: createdAt.toISOString().split('T')[0],
    hour: createdAt.getHours(),
    dayOfWeek: createdAt.getDay(),
    metadata: {
      ...action,
      // Remove already extracted fields
      action_id: undefined,
      user_id: undefined,
      campaign_id: undefined,
      campaign_name: undefined,
      action_type: undefined,
      completed: undefined,
      opt_in: undefined,
      action_created_at: undefined
    }
  };
};

/**
 * Calculate action performance metrics
 * @param {Array} actions - Array of action details
 * @returns {Object} - Performance metrics
 */
const calculateActionMetrics = (actions) => {
  if (!actions?.length) {
    return {
      totalActions: 0,
      completedActions: 0,
      completionRate: 0,
      optInRate: 0,
      byActionType: {},
      byCategory: {},
      byTime: {
        byHour: Array(24).fill(0),
        byDay: Array(7).fill(0)
      },
      performanceScore: 0
    };
  }

  const metrics = {
    totalActions: actions.length,
    completedActions: 0,
    startedActions: 0,
    optedIn: 0,
    uniqueUsers: new Set(),
    byActionType: {},
    byCategory: {},
    byTime: {
      byHour: Array(24).fill(0),
      byDay: Array(7).fill(0)
    },
    // Performance metrics
    completionRate: 0,
    optInRate: 0,
    actionsPerUser: 0,
    performanceScore: 0
  };

  // Process each action
  actions.forEach(action => {
    const { userId, isCompleted, isOptIn, actionType, category, hour, dayOfWeek } = action;
    
    // Track unique users
    if (userId) {
      metrics.uniqueUsers.add(userId);
    }
    
    // Track completed and started actions
    if (isCompleted) {
      metrics.completedActions++;
    } else {
      metrics.startedActions++;
    }
    
    // Track opt-ins
    if (isOptIn) {
      metrics.optedIn++;
    }
    
    // Track by action type
    if (!metrics.byActionType[actionType]) {
      metrics.byActionType[actionType] = {
        count: 0,
        completed: 0,
        optIns: 0
      };
    }
    metrics.byActionType[actionType].count++;
    if (isCompleted) metrics.byActionType[actionType].completed++;
    if (isOptIn) metrics.byActionType[actionType].optIns++;
    
    // Track by category
    if (!metrics.byCategory[category]) {
      metrics.byCategory[category] = {
        count: 0,
        completed: 0,
        optIns: 0
      };
    }
    metrics.byCategory[category].count++;
    if (isCompleted) metrics.byCategory[category].completed++;
    if (isOptIn) metrics.byCategory[category].optIns++;
    
    // Track by time
    if (hour !== undefined) {
      metrics.byTime.byHour[hour]++;
    }
    if (dayOfWeek !== undefined) {
      metrics.byTime.byDay[dayOfWeek]++;
    }
  });
  
  // Calculate rates
  metrics.completionRate = metrics.totalActions > 0 
    ? metrics.completedActions / metrics.totalActions 
    : 0;
    
  metrics.optInRate = metrics.totalActions > 0 
    ? metrics.optedIn / metrics.totalActions 
    : 0;
    
  metrics.actionsPerUser = metrics.uniqueUsers.size > 0
    ? metrics.totalActions / metrics.uniqueUsers.size
    : 0;
  
  // Calculate performance score (0-100)
  metrics.performanceScore = calculatePerformanceScore(metrics);
  
  return metrics;
};

/**
 * Calculate a performance score based on action metrics
 * @param {Object} metrics - Action metrics
 * @returns {number} - Performance score (0-100)
 */
const calculatePerformanceScore = (metrics) => {
  if (metrics.totalActions === 0) return 0;
  
  // Weights for different metrics (sum to 1.0)
  const weights = {
    completionRate: 0.4,
    optInRate: 0.3,
    actionsPerUser: 0.2,
    userRetention: 0.1
  };
  
  // Calculate component scores (0-100)
  const completionScore = Math.min(100, (metrics.completionRate / 0.5) * 100); // 50% is perfect
  const optInScore = Math.min(100, metrics.optInRate * 200); // 50% opt-in is perfect
  const actionsPerUserScore = Math.min(100, (metrics.actionsPerUser / 5) * 100); // 5 actions/user is perfect
  
  // Simple user retention estimate (can be enhanced with actual retention data)
  const userRetentionScore = Math.min(100, metrics.uniqueUsers.size / (metrics.totalActions / 10) * 100);
  
  // Calculate weighted score
  const score = Math.round(
    (completionScore * weights.completionRate) +
    (optInScore * weights.optInRate) +
    (actionsPerUserScore * weights.actionsPerUser) +
    (userRetentionScore * weights.userRetention)
  );
  
  return Math.min(100, Math.max(0, score)); // Ensure score is between 0-100
};

/**
 * Generate insights based on action metrics
 * @param {Object} metrics - Action metrics
 * @returns {Object} - Insights object
 */
const generateInsights = (metrics) => {
  const insights = {
    keyStrengths: [],
    improvementAreas: [],
    recommendations: []
  };
  
  if (metrics.totalActions === 0) {
    insights.recommendations.push('No action data available. Consider promoting your campaigns to drive more engagement.');
    return insights;
  }
  
  // Completion rate insights
  if (metrics.completionRate > 0.4) {
    insights.keyStrengths.push('High action completion rate');
  } else if (metrics.completionRate < 0.2) {
    insights.improvementAreas.push('Low action completion rate');
    insights.recommendations.push('Simplify your call-to-action or reduce the number of steps required to complete actions.');
  }
  
  // Opt-in rate insights
  if (metrics.optInRate > 0.3) {
    insights.keyStrengths.push('Strong user opt-in rate');
  } else if (metrics.optInRate < 0.1) {
    insights.improvementAreas.push('Low opt-in rate');
    insights.recommendations.push('Make the value proposition clearer for opting in or reduce the number of required fields.');
  }
  
  // Actions per user insights
  if (metrics.actionsPerUser > 2) {
    insights.keyStrengths.push('High user engagement with multiple actions per user');
  } else if (metrics.actionsPerUser < 1.2) {
    insights.improvementAreas.push('Low repeat engagement');
    insights.recommendations.push('Encourage users to take additional actions after their first engagement.');
  }
  
  // Time-based insights
  const peakHour = metrics.byTime.byHour.indexOf(Math.max(...metrics.byTime.byHour));
  if (peakHour >= 0) {
    insights.recommendations.push(`Peak engagement time is around ${peakHour}:00. Consider timing your campaigns accordingly.`);
  }
  
  // Action type insights
  if (Object.keys(metrics.byActionType).length > 0) {
    const sortedActions = Object.entries(metrics.byActionType)
      .sort((a, b) => b[1].count - a[1].count);
      
    if (sortedActions.length > 0) {
      const [mostPopularType, mostPopularData] = sortedActions[0];
      insights.keyStrengths.push(`Most popular action type: ${mostPopularType} (${mostPopularData.count} actions)`);
      
      // Find action types with low completion rates
      const lowCompletionActions = sortedActions
        .filter(([_, data]) => (data.completed / data.count) < 0.2)
        .map(([type]) => type);
        
      if (lowCompletionActions.length > 0) {
        insights.improvementAreas.push(`Low completion rates for: ${lowCompletionActions.join(', ')}`);
      }
    }
  }
  
  // Add performance tier
  const performanceTier = getPerformanceTier(metrics.performanceScore);
  insights.performanceTier = performanceTier;
  
  // Add overall assessment
  if (performanceTier === 'excellent') {
    insights.summary = 'Your campaign is performing exceptionally well with high engagement and completion rates.';
  } else if (performanceTier === 'good') {
    insights.summary = 'Your campaign is performing well, with some opportunities for improvement.';
  } else if (performanceTier === 'average') {
    insights.summary = 'Your campaign performance is average. Consider implementing the recommended improvements.';
  } else {
    insights.summary = 'Your campaign needs improvement. Focus on the key areas identified above.';
  }
  
  return insights;
};

/**
 * Get performance tier based on score
 * @param {number} score - Performance score (0-100)
 * @returns {string} - Performance tier
 */
const getPerformanceTier = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 50) return 'average';
  return 'needs_improvement';
};

module.exports = {
  categorizeAction,
  getActionDetails,
  calculateActionMetrics,
  calculatePerformanceScore,
  generateInsights,
  getPerformanceTier,
  BENCHMARKS
};
