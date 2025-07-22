/**
 * Demographics analytics helper functions
 */

const getSelfReportedDemographics = (campaign) => {
  return {
    ethnicity: campaign["Self Reported Ethnicity"],
    language: campaign["Self Reported Language"],
    race: campaign["Self Reported Race"],
    gender: campaign["Self Reported Gender"],
    sexualOrientation: campaign["Self Reported Sexual Orientation"]
  };
};

const getDetailedDemographics = (campaign) => {
  return {
    age: campaign["Age"],
    ageBracket: campaign["Age bracket"],
    gender: campaign["Gender"],
    detailedDemographic: campaign["Detailed demographic"],
    inMarketAndInterests: campaign["In-market & interests"],
    userLanguage: campaign["User Language"]
  };
};

const getGeographicMetrics = (campaign) => {
  return {
    // Districts
    congressionalDistrict: campaign["Congressional District"],
    stateHouseDistrict: campaign["State House District"],
    stateSenateDistrict: campaign["State Senate District"],
    
    // Location
    city: campaign["City"],
    state: campaign["State"],
    region: campaign["Region"],
    country: campaign["Country"],
    zipCode: campaign["ZIP code"],
    
    // Device/Location data
    ip: campaign["IP"],
    deviceType: campaign["Device Type"],
    device: campaign["Device"],
    screenResolution: campaign["Screen Resolution"]
  };
};

const getContactInfo = (campaign) => {
  return {
    email: campaign["Email"],
    lastName: campaign["Last name"],
    firstName: campaign["First name"],
    mobileNumber: campaign["Mobile number"],
    zip: campaign["ZIP"],
    vanId: campaign["VANID"],
    contactName: campaign["Contact Name"]
  };
};

const getDemographicEngagement = (campaign) => {
  // Cross-reference demographics with engagement metrics
  return {
    byAge: {
      bracket: campaign["Age bracket"],
      sessions: campaign["Sessions"] || 0,
      activeUsers: campaign["Active users"] || 0,
      engagementRate: campaign["Engagement rate"] || 0
    },
    byLanguage: {
      language: campaign["Self Reported Language"],
      userLanguage: campaign["User Language"]
    },
    byLocation: {
      city: campaign["City"],
      state: campaign["State"],
      region: campaign["Region"],
      households: campaign["Households"] || 0
    },
    byInterests: {
      interests: campaign["In-market & interests"],
      detailedDemographic: campaign["Detailed demographic"]
    }
  };
};

module.exports = {
  getSelfReportedDemographics,
  getDetailedDemographics,
  getGeographicMetrics,
  getContactInfo,
  getDemographicEngagement
};
