const mongoose = require('mongoose');
const Campaign = require('../../models/Campaign');
const {
  getEmailMetrics,
  getSocialMetrics,
  getAdMetrics,
  getWebMetrics,
  getCTVMetrics,
  getP2PMetrics,
  getDemographicEngagement,
  getEventDetails,
  getTechnicalMetrics,
  getTestingMetrics
} = require('../../helpers');

describe('Analytics Helpers Integration Tests', () => {
  let testCampaign;

  const testConfig = require('../test.config');

  beforeAll(async () => {
    try {
      const uri = await testConfig.getMongodUri();
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    } catch (error) {
      console.error('Failed to connect to test database:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await testConfig.stopMongod();
  });

  beforeEach(async () => {
    // Clear any existing data
    await mongoose.connection.dropDatabase();
    
    // Create test campaign data
    const campaignData = {
      // Email data
      "Email Address": "test@example.com",
      "Subject Line": "Test Campaign",
      "Opened": 100,
      "Clicked": 50,
      "Converted": 25,
      
      // Social data
      "Reactions": 1000,
      "Comments": 200,
      "Shares": 300,
      "Reach": 10000,
      
      // Ad data
      "Ad impressions": 50000,
      "Total clicks": 2500,
      "Cost per result": 1.50,
      "Amount spent (USD)": 7500,
      
      // Web data
      "Sessions": 15000,
      "Active users": 12000,
      "New users": 3000,
      "Average engagement time": 180,
      
      // CTV data
      "Households": 25000,
      "Impressons per Household": 2.5,
      "View-Through Rate": 0.75,
      "Hour of day": 20,
      "In-market & interests": "Sports, News",
      
      // P2P data
      "p2p_initial_messages": 5000,
      "p2p_responses": 2000,
      "p2p_opt_outs": 100,
      
      // Demographics
      "Self Reported Ethnicity": "Hispanic",
      "Self Reported Language": "Spanish",
      "Age bracket": "25-34",
      "Gender": "F",
      
      // Event data
      "Event Name": "Community Forum",
      "Event Type": "Town Hall",
      "Event Date": new Date("2025-08-01"),
      
      // Technical data
      "Browser": "Chrome",
      "Device Type": "mobile",
      "OS": "iOS",
      "Screen Resolution": "1920x1080",
      
      // Testing data
      "Control Visits": 5000,
      "Control Conversions": 250,
      "Variant Visits": 5000,
      "Variant Conversions": 300
    };
    
    console.log('Creating campaign with data:', JSON.stringify(campaignData, null, 2));
    
    // Create and save test campaign
    testCampaign = await new Campaign(campaignData).save();
    
    console.log('Saved campaign data:', JSON.stringify(testCampaign.toObject(), null, 2));
  });

  test('Email analytics integration', async () => {
    const metrics = getEmailMetrics(testCampaign);
    expect(metrics).toBeDefined();
    expect(metrics.opened).toBe(100);
    expect(metrics.clicked).toBe(50);
    expect(metrics.converted).toBe(25);
  });

  test('Social analytics integration', async () => {
    const metrics = getSocialMetrics(testCampaign);
    expect(metrics).toBeDefined();
    expect(metrics.reactions).toBe(1000);
    expect(metrics.comments).toBe(200);
    expect(metrics.shares).toBe(300);
  });

  test('Ad analytics integration', async () => {
    const metrics = getAdMetrics(testCampaign);
    expect(metrics).toBeDefined();
    expect(metrics.impressions).toBe(50000);
    expect(metrics.clicks).toBe(2500);
    expect(metrics.costPerResult).toBe(1.50);
  });

  test('Web analytics integration', async () => {
    const metrics = getWebMetrics(testCampaign);
    expect(metrics).toBeDefined();
    expect(metrics.sessions).toBe(15000);
    expect(metrics.activeUsers).toBe(12000);
    expect(metrics.newUsers).toBe(3000);
  });

  test('CTV analytics integration', async () => {
    const metrics = getCTVMetrics(testCampaign);
    expect(metrics).toBeDefined();
    expect(metrics.households).toBe(25000);
    expect(metrics.impressionsPerHousehold).toBe(2.5);
    expect(metrics.viewThroughRate).toBe(0.75);
  });

  test('P2P analytics integration', async () => {
    const metrics = getP2PMetrics(testCampaign);
    expect(metrics).toBeDefined();
    expect(metrics.initialMessages).toBe(5000);
    expect(metrics.responses).toBe(2000);
    expect(metrics.optOuts).toBe(100);
  });

  test('Demographics analytics integration', async () => {
    const metrics = getDemographicEngagement(testCampaign);
    expect(metrics).toBeDefined();
    expect(metrics.byAge.bracket).toBe("25-34");
    expect(metrics.byLanguage.language).toBe("Spanish");
  });

  test('Event analytics integration', async () => {
    const details = getEventDetails(testCampaign);
    expect(details).toBeDefined();
    expect(details.eventName).toBe("Community Forum");
    expect(details.eventType).toBe("Town Hall");
  });

  test('Technical analytics integration', async () => {
    const metrics = getTechnicalMetrics(testCampaign);
    expect(metrics).toBeDefined();
    expect(metrics.browser.name).toBe("Chrome");
    expect(metrics.device.type).toBe("mobile");
    expect(metrics.os.name).toBe("iOS");
  });

  test('Testing analytics integration', async () => {
    console.log('Raw test campaign:', testCampaign);
    console.log('Test campaign data:', JSON.stringify(testCampaign.toObject(), null, 2));
    console.log('Control visits value:', testCampaign['Control Visits']);
    const metrics = getTestingMetrics(testCampaign);
    console.log('Testing metrics:', JSON.stringify(metrics, null, 2));
    expect(metrics).toBeDefined();
    expect(metrics.control.visits).toBe(5000);
    expect(metrics.control.conversions).toBe(250);
    expect(metrics.variant.visits).toBe(5000);
    expect(metrics.variant.conversions).toBe(300);
  });

  test('Full analytics overview integration', async () => {
    const overview = testCampaign.getAnalyticsOverview();
    expect(overview).toBeDefined();
    expect(overview.email).toBeDefined();
    expect(overview.social).toBeDefined();
    expect(overview.ads).toBeDefined();
    expect(overview.web).toBeDefined();
    expect(overview.ctv).toBeDefined();
    expect(overview.p2p).toBeDefined();
    expect(overview.demographics).toBeDefined();
    expect(overview.events).toBeDefined();
    expect(overview.technical).toBeDefined();
    expect(overview.testing).toBeDefined();
  });
});
