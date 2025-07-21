const mongoose = require('mongoose');

// Reference schema for tracking user interactions across channels
const userInteractionSchema = new mongoose.Schema({
  userId: String,
  sourceChannel: String,  // email, social, web, p2p, f2f
  interactionType: String,  // view, click, signup, share
  timestamp: Date,
  metadata: mongoose.Schema.Types.Mixed
});

// Reference schema for conversion tracking
const conversionSchema = new mongoose.Schema({
  sourceType: String,  // ad, email, social, p2p
  targetType: String,  // signup, donation, volunteer
  conversionValue: Number,
  conversionPath: [userInteractionSchema],
  timeToConversion: Number
});

const campaignSchema = new mongoose.Schema({
  // Basic Event Info
  status: String,
  role: String,
  eventName: String,
  eventDate: Date,
  eventType: String,
  
  // Geographic Info
  congressionalDistrict: String,
  stateHouseDistrict: String,
  stateSenateDistrict: String,
  city: String,

  // Demographic Data
  demographics: {
    ethnicity: String,
    language: String,
    race: String,
    gender: String,
    sexualOrientation: String
  },

  // Web Analytics
  webAnalytics: {
    landingPage: String,
    firstUserSourceMedium: String,
    sessions: Number,
    activeUsers: Number,
    newUsers: Number,
    avgEngagementTimePerSession: Number,
    keyEvents: Number,
    sessionKeyEventRate: Number,
    pageViews: Number
  },

  // Social Media
  socialMedia: {
    postId: String,
    pageId: String,
    pageName: String,
    title: String,
    description: String,
    durationSec: Number,
    publishTime: Date,
    captionType: String,
    permalink: String,
    isCrosspost: Boolean,
    isShare: Boolean,
    postType: String,
    engagement: {
      reactions: Number,
      comments: Number,
      shares: Number
    },
    video: {
      secondsViewed: Number,
      avgSecondsViewed: Number
    }
  },

  // Advertising
  advertising: {
    estimatedEarningsUSD: Number,
    adImpressions: Number,
    uniqueUsers: Number,
    views: Number,
    reach: Number,
    clicks: {
      total: Number,
      other: Number,
      link: Number
    },
    cpmUSD: Number,
    matchedAudiencePhotoClick: Number,
    negativeFeedback: {
      hideAll: Number
    }
  },

  // Email Campaign
  emailCampaign: {
    subjectLine: String,
    variant: String,
    metrics: {
      sent: Number,
      opened: Number,
      clicked: Number,
      converted: Number,
      bounced: Number,
      unsubscribed: Number
    }
  },

  // Mobilize Integration
  mobilize: {
    rsvps: Number,
    attendees: Number,
    eventId: String,
    sourceEmail: String,  // Reference to the email campaign that led to signup
    conversionPath: {
      emailOpened: Boolean,
      emailClicked: Boolean,
      landingPageVisited: Boolean,
      signupCompleted: Boolean,
      timeToConversion: Number  // Time in minutes from email open to signup
    }
  },

  // Revenue Tracking
  revenue: {
    total: Number,
    roas: Number
  },

  // Cross-channel Tracking
  crossChannel: {
    // Track user interactions across all channels
    interactions: [userInteractionSchema],
    
    // Track conversions and their sources
    conversions: [conversionSchema],
    
    // Track relationships between channels
    channelRelationships: {
      emailToSocial: [{
        emailId: String,
        socialPostId: String,
        relationshipType: String,  // share, mention, link
        engagement: Number
      }],
      socialToWeb: [{
        postId: String,
        landingPage: String,
        sessions: Number,
        conversions: Number
      }],
      p2pToEmail: [{
        messageId: String,
        emailId: String,
        signups: Number
      }]
    },

    // Unified contact history
    contactHistory: [{
      contactId: String,
      channels: [String],  // email, social, p2p, f2f
      totalTouchpoints: Number,
      firstContact: Date,
      lastContact: Date,
      conversions: [conversionSchema]
    }],

    // Attribution tracking
    attribution: {
      firstTouch: {
        channel: String,
        campaign: String,
        timestamp: Date
      },
      lastTouch: {
        channel: String,
        campaign: String,
        timestamp: Date
      },
      touchpoints: [{
        channel: String,
        campaign: String,
        timestamp: Date,
        weight: Number  // For multi-touch attribution
      }]
    }
  }
}, {
  timestamps: true,
  strict: true // Enable strict mode now that we have a defined schema
});

// Add indexes for common queries
campaignSchema.index({ eventDate: 1 });
campaignSchema.index({ city: 1 });
campaignSchema.index({ eventType: 1 });

// Virtual for full district info
campaignSchema.virtual('districtInfo').get(function() {
  return {
    congressional: this.congressionalDistrict,
    stateHouse: this.stateHouseDistrict,
    stateSenate: this.stateSenateDistrict
  };
});

// Method to get email performance metrics
campaignSchema.methods.getEmailPerformance = function() {
  const metrics = this.emailCampaign.metrics;
  return {
    ...metrics,
    openRate: metrics.sent ? (metrics.opened / metrics.sent * 100).toFixed(2) + '%' : '0%',
    clickRate: metrics.opened ? (metrics.clicked / metrics.opened * 100).toFixed(2) + '%' : '0%',
    conversionRate: metrics.clicked ? (metrics.converted / metrics.clicked * 100).toFixed(2) + '%' : '0%',
    bounceRate: metrics.sent ? (metrics.bounced / metrics.sent * 100).toFixed(2) + '%' : '0%',
    unsubscribeRate: metrics.sent ? (metrics.unsubscribed / metrics.sent * 100).toFixed(2) + '%' : '0%'
  };
};

// Method to get social media engagement metrics
campaignSchema.methods.getSocialEngagement = function() {
  const social = this.socialMedia;
  if (!social) return null;
  
  const engagement = social.engagement;
  const total = engagement.reactions + engagement.comments + engagement.shares;
  
  return {
    ...engagement,
    totalEngagement: total,
    engagementRate: social.reach ? (total / social.reach * 100).toFixed(2) + '%' : '0%',
    videoMetrics: social.video || null
  };
};

// Method to get advertising performance
campaignSchema.methods.getAdPerformance = function() {
  const ad = this.advertising;
  if (!ad) return null;

  return {
    ...ad,
    ctr: ad.clicks.total && ad.impressions ? (ad.clicks.total / ad.impressions * 100).toFixed(2) + '%' : '0%',
    roi: ad.estimatedEarningsUSD && this.revenue?.total ? 
      ((this.revenue.total - ad.estimatedEarningsUSD) / ad.estimatedEarningsUSD * 100).toFixed(2) + '%' : '0%'
  };
};

// Method to get full analytics overview
campaignSchema.methods.getAnalyticsOverview = function() {
  const web = this.webAnalytics;
  if (!web) return null;

  return {
    ...web,
    userEngagement: {
      avgTimePerSession: web.avgEngagementTimePerSession,
      keyEventRate: web.sessionKeyEventRate,
      newUserRate: web.activeUsers ? (web.newUsers / web.activeUsers * 100).toFixed(2) + '%' : '0%'
    }
  };
};

// Method to get email-to-mobilize conversion metrics
campaignSchema.methods.getEmailToMobilizeMetrics = function() {
  if (!this.mobilize || !this.emailCampaign) return null;

  const emailMetrics = this.emailCampaign.metrics;
  const mobilizeData = this.mobilize;

  return {
    sourceEmail: mobilizeData.sourceEmail,
    conversionPath: mobilizeData.conversionPath,
    metrics: {
      emailToSignupRate: emailMetrics.sent ? 
        (mobilizeData.rsvps / emailMetrics.sent * 100).toFixed(2) + '%' : '0%',
      clickToSignupRate: emailMetrics.clicked ? 
        (mobilizeData.rsvps / emailMetrics.clicked * 100).toFixed(2) + '%' : '0%',
      avgTimeToConversion: mobilizeData.conversionPath?.timeToConversion || null,
      totalSignups: mobilizeData.rsvps,
      actualAttendees: mobilizeData.attendees,
      attendanceRate: mobilizeData.rsvps ? 
        (mobilizeData.attendees / mobilizeData.rsvps * 100).toFixed(2) + '%' : '0%'
    }
  };
};

module.exports = mongoose.model('Campaign', campaignSchema);
