const mongoose = require('mongoose');
const {
  // Email analytics
  getEmailMetrics,
  getEmailPerformance,
  getEmailEngagement,
  
  // Social analytics
  getSocialMetrics,
  getSocialEngagement,
  getSocialReach,
  
  // Ad analytics
  getAdMetrics,
  getAdPerformance,
  getAdROI,
  
  // Web analytics
  getWebMetrics,
  getWebEngagement,
  getWebConversions,
  
  // CTV analytics
  getCTVMetrics,
  getCTVPreferenceInsights,
  getCTVPerformanceByDemo,
  
  // P2P/F2F analytics
  getP2PMetrics,
  getF2FMetrics,
  getDialerMetrics,
  getOpenCanvassMetrics,
  
  // Demographics analytics
  getSelfReportedDemographics,
  getDetailedDemographics,
  getGeographicMetrics,
  getContactInfo,
  getDemographicEngagement,
  
  // Event analytics
  getEventDetails,
  getEventPerformance,
  getEventReferrals,
  
  // Technical analytics
  getTechnicalMetrics,
  getTrafficMetrics,
  getConversionMetrics,
  getCustomMetrics,
  
  // Testing analytics
  getTestingMetrics,
  getEmailTestingMetrics,
  getAdTestingMetrics,
  getCustomTestMetrics
} = require('../helpers');

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
  // Email fields
  "Email Address": String,
  "Subject Line": String,
  "Opened": { type: Number, default: 0 },
  "Clicked": { type: Number, default: 0 },
  "Converted": { type: Number, default: 0 },

  // Web fields
  "Average engagement time": { type: Number, default: 0 },

  // CTV fields
  "Households": { type: Number, default: 0 },
  "Impressons per Household": { type: Number, default: 0 },
  "View-Through Rate": { type: Number, default: 0 },
  "Hour of day": { type: Number, default: 0 },
  "In-market & interests": String,

  // P2P fields
  "p2p_initial_messages": { type: Number, default: 0 },
  "p2p_responses": { type: Number, default: 0 },
  "p2p_opt_outs": { type: Number, default: 0 },

  // Demographics fields
  "Age bracket": String,
  "Gender": String,

  // Technical fields
  "Browser": String,
  "Device Type": String,
  "OS": String,
  "Screen Resolution": String,

  // Cost fields
  "Cost per result": { type: Number, default: 0 },
  "Amount spent (USD)": { type: Number, default: 0 },

  // Testing fields
  "Control Visits": { type: Number, default: 0 },
  "Control Conversions": { type: Number, default: 0 },
  "Control Revenue": { type: Number, default: 0 },
  "Variant Visits": { type: Number, default: 0 },
  "Variant Conversions": { type: Number, default: 0 },
  "Variant Revenue": { type: Number, default: 0 },

  // Fields aligned with master_list aggregations
  Status: String,
  Role: String,
  "Event Name": String,
  "Event Type": String,
  "Event Date": Date,
  "Congressional District": String,
  "Self Reported Ethnicity": String,
  "Self Reported Language": String,
  "Self Reported Race": String,
  "State House District": String,
  "State Senate District": String,
  "Self Reported Gender": String,
  "Self Reported Sexual Orientation": String,
  "Landing page": String,
  "First user source / medium": String,
  "Sessions": Number,
  "Active users": Number,
  "New users": Number,
  "Average engagement time per session": Number,
  "Key events": Number,
  "Total revenue": Number,
  "Session key event rate": Number,
  "Post ID": String,
  "Page ID": String,
  "Page name": String,
  Title: String,
  Description: String,
  "Duration (sec)": Number,
  "Publish time": Date,
  "Caption type": String,
  Permalink: String,
  "Is crosspost": Boolean,
  "Is share": Boolean,
  "Post type": String,
  "Reactions, Comments and Shares": Number,
  Reactions: Number,
  Comments: Number,
  Shares: Number,
  "Seconds viewed": Number,
  "Average Seconds viewed": Number,
  "Estimated earnings (USD)": Number,
  "Ad impressions": Number,
  "IMPRESSION:UNIQUE_USERS": Number,
  Views: Number,
  Reach: Number,
  "Total clicks": Number,
  "Other Clicks": Number,
  "Link Clicks": Number,
  "Ad CPM (USD)": Number,
  "Matched Audience Targeting Consumption (Photo Click)": Number,
  "Negative feedback from users: Hide all": Number,
  "Account ID": String,
  "Account username": String,
  "Account name": String,
  Likes: Number,
  Saves: Number,
  Follows: Number,
  "title": String,  // IG title
  "description": String,  // IG description
  "Publish Date": Date,  // IG publish date
  "privacy_setting": String,
  "impressions": Number,  // IG impressions
  "clicks": Number,  // IG clicks
  "seen": Number,
  "started": Number,
  "completions": Number,
  "Impactive Performs": Number,
  "contact_list_name": String,
  "p2p_initial_messages": Number,
  "p2p_follow_ups": Number,
  "p2p_responses": Number,
  "p2p_opt_outs": Number,
  "p2p_messages_remaining": Number,
  "p2p_needs_attention": Number,
  "p2p_undelivered": Number,
  "dialer_calls_connected": Number,
  "dialer_contacts_connected": Number,
  "dialer_dropped_call_count": Number,

  // Testing fields
  "Control Visits": Number,
  "Control Conversions": Number,
  "Control Revenue": Number,
  "Variant Visits": Number,
  "Variant Conversions": Number,
  "Variant Revenue": Number,
  "dialer_report_filled_count": Number,
  "f2f_initial_messages_sent": Number,
  "f2f_unique_phones_reached": Number,
  "f2f_contacts_followed_up_with": Number,
  "f2f_suggested_contacts_known": Number,
  "f2f_suggested_contacts_reached": Number,
  "open_canvass_personal_contact_reports": Number,
  "open_canvass_campaign_contact_reports": Number,
  "open_canvass_contact_numbers_provided": Number,

  // Cross-channel Tracking
  interactions: [userInteractionSchema],
  conversions: [conversionSchema],
  
  // Contact History
  contactHistory: [{
    contactId: String,
    channels: [String],  // email, social, p2p, f2f
    totalTouchpoints: Number,
    firstContact: Date,
    lastContact: Date,
    conversions: [conversionSchema]
  }],

  // Attribution
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
  return {
    ...getEmailMetrics(this),
    ...getEmailPerformance(this),
    ...getEmailEngagement(this),
    testing: getEmailTestingMetrics(this)
  };
};

// Method to get social media engagement metrics
campaignSchema.methods.getSocialEngagement = function() {
  return {
    ...getSocialMetrics(this),
    ...getSocialEngagement(this),
    reach: getSocialReach(this)
  };
};

// Method to get advertising performance
campaignSchema.methods.getAdPerformance = function() {
  return {
    ...getAdMetrics(this),
    ...getAdPerformance(this),
    roi: getAdROI(this),
    testing: getAdTestingMetrics(this)
  };
};

// Method to get full analytics overview
campaignSchema.methods.getAnalyticsOverview = function() {
  return {
    // Core analytics
    email: this.getEmailPerformance(),
    social: this.getSocialEngagement(),
    ads: this.getAdPerformance(),
    web: {
      ...getWebMetrics(this),
      ...getWebEngagement(this),
      conversions: getWebConversions(this)
    },
    
    // Specialized analytics
    ctv: {
      ...getCTVMetrics(this),
      preferences: getCTVPreferenceInsights(this),
      performance: getCTVPerformanceByDemo(this)
    },
    p2p: {
      ...getP2PMetrics(this),
      f2f: getF2FMetrics(this),
      dialer: getDialerMetrics(this),
      canvass: getOpenCanvassMetrics(this)
    },
    demographics: {
      ...getSelfReportedDemographics(this),
      ...getDetailedDemographics(this),
      geographic: getGeographicMetrics(this),
      contact: getContactInfo(this),
      engagement: getDemographicEngagement(this)
    },
    events: {
      ...getEventDetails(this),
      ...getEventPerformance(this),
      referrals: getEventReferrals(this)
    },
    
    // Technical and testing
    technical: {
      ...getTechnicalMetrics(this),
      traffic: getTrafficMetrics(this),
      conversions: getConversionMetrics(this),
      custom: getCustomMetrics(this)
    },
    testing: {
      ...getTestingMetrics(this),
      email: getEmailTestingMetrics(this),
      ads: getAdTestingMetrics(this),
      custom: getCustomTestMetrics(this)
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
