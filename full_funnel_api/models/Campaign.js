const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  status: String,
  role: String,
  eventName: String,
  eventDate: Date,
  eventType: String,
  congressionalDistrict: String,
  stateHouseDistrict: String,
  stateSenateDistrict: String,
  city: String,
  emailMetrics: {
    sent: Number,
    opened: Number,
    clicked: Number,
    converted: Number,
    bounced: Number,
    unsubscribed: Number
  },
  subjectLine: String,
  variant: String,
  analytics: {
    gaSessions: Number,
    pageViews: Number
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
  const metrics = this.emailMetrics;
  return {
    ...metrics,
    openRate: metrics.sent ? (metrics.opened / metrics.sent * 100).toFixed(2) + '%' : '0%',
    clickRate: metrics.opened ? (metrics.clicked / metrics.opened * 100).toFixed(2) + '%' : '0%',
    conversionRate: metrics.clicked ? (metrics.converted / metrics.clicked * 100).toFixed(2) + '%' : '0%'
  };
};

module.exports = mongoose.model('Campaign', campaignSchema);
