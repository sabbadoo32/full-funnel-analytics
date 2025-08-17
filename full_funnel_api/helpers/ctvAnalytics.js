/**
 * Connected TV (CTV) analytics helper functions
 */

const getCTVMetrics = (campaign) => {
  return {
    // Core CTV metrics
    households: campaign["Households"] || 0,
    impressionsPerHousehold: campaign["Impressons per Household"] || 0,
    viewThroughRate: campaign["View-Through Rate"] || 0,
    costPerView: campaign["Cost Per View"] || 0,
    completedView: campaign["Completed View"] || 0,
    
    // Audience preferences and targeting
    inMarketAndInterests: campaign["In-market & interests"],
    detailedDemographic: campaign["Detailed demographic"],
    ageBracket: campaign["Age bracket"],
    hourOfDay: campaign["Hour of day"],
    strategy: campaign["Strategy"],
    
    // Geographic targeting
    state: campaign["State"],
    zipCode: campaign["ZIP code"],
    region: campaign["Region"],
    country: campaign["Country"],
    
    // Performance metrics
    frequency: campaign["Frequency"] || 0,
    objective: campaign["Objective"],
    resultType: campaign["Result type"],
    results: campaign["Results"] || 0
  };
};

const getCTVPreferenceInsights = (campaign) => {
  return {
    // Viewing patterns
    timeOfDay: {
      hour: campaign["Hour of day"],
      dayOfWeek: campaign["Day"]
    },
    
    // Audience segments
    demographics: {
      age: campaign["Age bracket"],
      detailedDemographic: campaign["Detailed demographic"],
      interests: campaign["In-market & interests"]
    },
    
    // Geographic patterns
    geography: {
      state: campaign["State"],
      zipCode: campaign["ZIP code"],
      region: campaign["Region"]
    },
    
    // Campaign strategy
    targeting: {
      strategy: campaign["Strategy"],
      objective: campaign["Objective"],
      frequency: campaign["Frequency"] || 0
    }
  };
};

const getCTVPerformanceByDemo = (campaign) => {
  return {
    // Performance by demographic
    byAge: {
      bracket: campaign["Age bracket"],
      completedViews: campaign["Completed View"] || 0,
      viewThroughRate: campaign["View-Through Rate"] || 0
    },
    
    // Performance by interest group
    byInterest: {
      segment: campaign["In-market & interests"],
      results: campaign["Results"] || 0,
      costPerResult: campaign["Cost per result"] || 0
    },
    
    // Performance by location
    byLocation: {
      state: campaign["State"],
      region: campaign["Region"],
      households: campaign["Households"] || 0,
      impressionsPerHousehold: campaign["Impressons per Household"] || 0
    }
  };
};

module.exports = {
  getCTVMetrics,
  getCTVPreferenceInsights,
  getCTVPerformanceByDemo
};
