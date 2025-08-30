const BaseConnector = require('./BaseConnector');
const mongoose = require('mongoose');
const {
  getAttributionMetrics,
  getCampaignPerformance,
  getChannelReach,
  CROSS_CHANNEL_BENCHMARKS,
  getPerformanceTier
} = require('../helpers/crossChannelAnalytics');

class CrossChannelConnector extends BaseConnector {
  constructor() {
    super();
    this.collection = 'full_funnel';
    this.requiredFields = [
      'Campaign',
      'Period',
      'Spend',
      'Revenue',
      'Users',
      'Engaged sessions',
      'Engagement rate',
      'First user primary channel group (Default Channel Group)',
      'Facebook reach',
      'Facebook visits',
      'Instagram reach',
      'Instagram profile visits',
      'Sessions',
      'Pageviews',
      'Email Sent',
      'Email Opens',
      'Email Clicks',
      'Conversion Rate',
      'Bounce Rate',
      'Avg. Session Duration',
      'Pages / Session'
    ];
  }

  async query(filters = {}) {
    try {
      const Campaign = mongoose.model('Campaign');
      return await Campaign.find(filters)
        .select(this.requiredFields.join(' '))
        .lean()
        .exec();
    } catch (error) {
      console.error('Error querying cross-channel data:', error);
      throw new Error('Failed to fetch cross-channel data');
    }
  }

  async getMetrics(query = {}) {
    const campaigns = await this.query(query);
    if (!campaigns?.length) return { total: 0, metrics: {} };

    // Group campaigns by period for trend analysis
    const campaignsByPeriod = {};
    campaigns.forEach(campaign => {
      const period = campaign.Period || 'unknown';
      if (!campaignsByPeriod[period]) {
        campaignsByPeriod[period] = [];
      }
      campaignsByPeriod[period].push(campaign);
    });

    // Get current and previous period data
    const periods = Object.keys(campaignsByPeriod).sort();
    const currentPeriod = periods[periods.length - 1];
    const previousPeriod = periods.length > 1 ? periods[periods.length - 2] : null;
    
    // Process current period campaigns
    const currentCampaigns = campaignsByPeriod[currentPeriod] || [];
    const previousCampaigns = previousPeriod ? (campaignsByPeriod[previousPeriod] || []) : [];

    // Process all campaigns with enhanced analytics
    const processedCampaigns = currentCampaigns.map(campaign => {
      // Get previous period campaign for comparison if available
      const previousCampaign = previousCampaigns.find(
        c => c.Campaign === campaign.Campaign
      ) || null;

      // Get enhanced metrics
      const attribution = getAttributionMetrics(campaign);
      const performance = getCampaignPerformance(campaign, previousCampaign);
      const reach = getChannelReach(campaign);

      return {
        id: campaign._id,
        name: campaign.Campaign,
        period: campaign.Period,
        attribution,
        performance,
        reach,
        raw: campaign // Keep raw data for reference
      };
    });

    // Calculate aggregate metrics
    const aggregateMetrics = this.calculateAggregateMetrics(processedCampaigns);
    
    // Generate insights and recommendations
    const insights = this.generateInsights(processedCampaigns, aggregateMetrics);

    return {
      total: processedCampaigns.length,
      period: currentPeriod,
      previousPeriod: previousPeriod,
      metrics: aggregateMetrics,
      campaigns: processedCampaigns,
      insights,
      lastUpdated: new Date().toISOString()
    };
  }

  calculateAggregateMetrics(campaigns) {
    if (!campaigns.length) return {};

    // Initialize aggregates
    const aggregates = {
      financial: {
        totalSpend: 0,
        totalRevenue: 0,
        totalProfit: 0,
        averageROAS: 0,
        averageCPA: 0,
        averageAOV: 0
      },
      engagement: {
        totalSessions: 0,
        totalUsers: 0,
        totalEngagedSessions: 0,
        averageEngagementRate: 0,
        averageSessionDuration: 0,
        averagePagesPerSession: 0,
        averageBounceRate: 0
      },
      conversion: {
        totalConversions: 0,
        totalTransactions: 0,
        averageConversionRate: 0,
        averageEcommerceConversionRate: 0,
        totalGoalCompletions: 0,
        totalGoalValue: 0
      },
      byChannel: {
        facebook: { spend: 0, revenue: 0, reach: 0, impressions: 0 },
        instagram: { spend: 0, revenue: 0, reach: 0, impressions: 0 },
        web: { spend: 0, revenue: 0, sessions: 0, users: 0 },
        email: { sent: 0, opens: 0, clicks: 0, revenue: 0 }
      },
      performance: {
        averageScore: 0,
        scoreDistribution: {
          excellent: 0,
          good: 0,
          average: 0,
          needsImprovement: 0
        }
      }
    };

    // Calculate sums
    campaigns.forEach(campaign => {
      const { performance, attribution, reach } = campaign;
      
      // Financial metrics
      aggregates.financial.totalSpend += performance.metrics.financial.spend;
      aggregates.financial.totalRevenue += performance.metrics.financial.revenue;
      aggregates.financial.totalProfit += performance.metrics.financial.profit;
      aggregates.financial.averageROAS += performance.metrics.financial.roas;
      aggregates.financial.averageCPA += performance.metrics.financial.costPerAcquisition;
      aggregates.financial.averageAOV += performance.metrics.financial.averageOrderValue;
      
      // Engagement metrics
      aggregates.engagement.totalSessions += performance.metrics.engagement.sessions;
      aggregates.engagement.totalUsers += performance.metrics.users.total;
      aggregates.engagement.totalEngagedSessions += attribution.engagement.engagedSessions;
      aggregates.engagement.averageEngagementRate += attribution.engagement.engagementRate;
      aggregates.engagement.averageSessionDuration += performance.metrics.engagement.sessionDuration;
      aggregates.engagement.averagePagesPerSession += performance.metrics.engagement.pagesPerSession;
      aggregates.engagement.averageBounceRate += performance.metrics.engagement.bounceRate;
      
      // Conversion metrics
      aggregates.conversion.totalConversions += performance.metrics.conversion.rate * performance.metrics.engagement.sessions;
      aggregates.conversion.totalTransactions += performance.metrics.conversion.transactions;
      aggregates.conversion.averageConversionRate += performance.metrics.conversion.rate;
      aggregates.conversion.averageEcommerceConversionRate += performance.metrics.conversion.ecommerceConversionRate;
      aggregates.conversion.totalGoalCompletions += performance.metrics.conversion.goalCompletions;
      aggregates.conversion.totalGoalValue += performance.metrics.conversion.goalValue;
      
      // Channel metrics
      if (reach.channels) {
        // Facebook
        if (reach.channels.facebook) {
          aggregates.byChannel.facebook.spend += reach.channels.facebook.costPerResult * reach.channels.facebook.visits;
          aggregates.byChannel.facebook.impressions += reach.channels.facebook.impressions;
          aggregates.byChannel.facebook.reach += reach.channels.facebook.reach;
        }
        
        // Instagram
        if (reach.channels.instagram) {
          aggregates.byChannel.instagram.spend += reach.channels.instagram.costPerResult * reach.channels.instagram.visits;
          aggregates.byChannel.instagram.impressions += reach.channels.instagram.impressions;
          aggregates.byChannel.instagram.reach += reach.channels.instagram.reach;
        }
        
        // Web
        if (reach.channels.web) {
          aggregates.byChannel.web.sessions += reach.channels.web.sessions;
          aggregates.byChannel.web.users += reach.channels.web.users;
        }
        
        // Email
        if (reach.channels.email) {
          aggregates.byChannel.email.sent += reach.channels.email.sent;
          aggregates.byChannel.email.opens += reach.channels.email.opens;
          aggregates.byChannel.email.clicks += reach.channels.email.clicks;
        }
      }
      
      // Performance metrics
      aggregates.performance.averageScore += performance.performance.score;
      const tier = performance.performance.tier.toLowerCase();
      if (aggregates.performance.scoreDistribution[tier] !== undefined) {
        aggregates.performance.scoreDistribution[tier]++;
      }
    });

    // Calculate averages
    const campaignCount = campaigns.length;
    
    // Financial averages
    aggregates.financial.averageROAS = campaignCount > 0 ? 
      aggregates.financial.averageROAS / campaignCount : 0;
    aggregates.financial.averageCPA = campaignCount > 0 ? 
      aggregates.financial.averageCPA / campaignCount : 0;
    aggregates.financial.averageAOV = campaignCount > 0 ? 
      aggregates.financial.averageAOV / campaignCount : 0;
    
    // Engagement averages
    aggregates.engagement.averageEngagementRate = campaignCount > 0 ? 
      aggregates.engagement.averageEngagementRate / campaignCount : 0;
    aggregates.engagement.averageSessionDuration = campaignCount > 0 ? 
      aggregates.engagement.averageSessionDuration / campaignCount : 0;
    aggregates.engagement.averagePagesPerSession = campaignCount > 0 ? 
      aggregates.engagement.averagePagesPerSession / campaignCount : 0;
    aggregates.engagement.averageBounceRate = campaignCount > 0 ? 
      aggregates.engagement.averageBounceRate / campaignCount : 0;
    
    // Conversion averages
    aggregates.conversion.averageConversionRate = campaignCount > 0 ? 
      aggregates.conversion.averageConversionRate / campaignCount : 0;
    aggregates.conversion.averageEcommerceConversionRate = campaignCount > 0 ? 
      aggregates.conversion.averageEcommerceConversionRate / campaignCount : 0;
    
    // Performance average
    aggregates.performance.averageScore = campaignCount > 0 ? 
      aggregates.performance.averageScore / campaignCount : 0;
    
    // Calculate percentages for score distribution
    Object.keys(aggregates.performance.scoreDistribution).forEach(tier => {
      aggregates.performance.scoreDistribution[tier] = 
        (aggregates.performance.scoreDistribution[tier] / campaignCount) * 100;
    });

    return aggregates;
  }

  generateInsights(campaigns, aggregates) {
    if (!campaigns.length) return {};

    const insights = {
      topPerformingCampaigns: [],
      channelsPerformance: {},
      keyStrengths: [],
      improvementAreas: [],
      recommendations: []
    };

    // Find top performing campaigns (top 3 by performance score)
    const sortedCampaigns = [...campaigns].sort((a, b) => 
      b.performance.performance.score - a.performance.performance.score
    );
    insights.topPerformingCampaigns = sortedCampaigns.slice(0, 3).map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      score: campaign.performance.performance.score,
      tier: campaign.performance.performance.tier,
      roas: campaign.performance.metrics.financial.roas,
      conversionRate: campaign.performance.metrics.conversion.rate
    }));

    // Analyze channel performance
    insights.channelsPerformance = Object.entries(aggregates.byChannel).reduce((acc, [channel, metrics]) => {
      const channelData = {
        spend: metrics.spend,
        reach: metrics.reach || metrics.users || metrics.sent || 0,
        engagement: metrics.impressions || metrics.clicks || metrics.opens || 0
      };
      
      // Calculate engagement rate based on channel type
      if (channel === 'facebook' || channel === 'instagram') {
        channelData.engagementRate = metrics.impressions > 0 ? 
          ((metrics.reach || 0) / metrics.impressions) * 100 : 0;
      } else if (channel === 'email') {
        channelData.engagementRate = metrics.sent > 0 ? 
          (metrics.opens / metrics.sent) * 100 : 0;
      } else {
        channelData.engagementRate = metrics.sessions > 0 ? 
          ((metrics.users || 0) / metrics.sessions) * 100 : 0;
      }
      
      acc[channel] = channelData;
      return acc;
    }, {});

    // Identify key strengths
    if (aggregates.financial.averageROAS > 4) {
      insights.keyStrengths.push({
        metric: 'ROAS',
        value: aggregates.financial.averageROAS.toFixed(2),
        benchmark: 'Industry average: 3.0',
        insight: 'Your campaigns are generating strong returns on ad spend.'
      });
    }

    if (aggregates.engagement.averageEngagementRate > 50) {
      insights.keyStrengths.push({
        metric: 'Engagement Rate',
        value: `${aggregates.engagement.averageEngagementRate.toFixed(1)}%`,
        benchmark: 'Industry average: 30%',
        insight: 'Your audience is highly engaged with your content.'
      });
    }

    // Identify improvement areas
    if (aggregates.conversion.averageConversionRate < 2) {
      insights.improvementAreas.push({
        metric: 'Conversion Rate',
        value: `${aggregates.conversion.averageConversionRate.toFixed(2)}%`,
        benchmark: 'Industry average: 2.5%',
        insight: 'Consider optimizing your landing pages and CTAs.'
      });
    }

    if (aggregates.engagement.averageBounceRate > 60) {
      insights.improvementAreas.push({
        metric: 'Bounce Rate',
        value: `${aggregates.engagement.averageBounceRate.toFixed(1)}%`,
        benchmark: 'Industry average: 50%',
        insight: 'High bounce rates may indicate content relevance or page load issues.'
      });
    }

    // Generate recommendations
    if (aggregates.performance.averageScore < 70) {
      insights.recommendations.push(
        'Consider reallocating budget from underperforming campaigns to top performers.'
      );
    }

    // Add channel-specific recommendations
    Object.entries(insights.channelsPerformance).forEach(([channel, data]) => {
      if (data.engagementRate < 20) {
        insights.recommendations.push(
          `Optimize content for ${channel} to improve engagement (current: ${data.engagementRate.toFixed(1)}%).`
        );
      }
    });

    // If no specific issues found, add a positive note
    if (insights.recommendations.length === 0) {
      insights.recommendations.push('Your cross-channel performance is strong. Consider testing new strategies for incremental gains.');
    }

    return insights;
  }
}

module.exports = CrossChannelConnector;
