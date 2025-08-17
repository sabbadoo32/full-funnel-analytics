// CTV analytics helpers
exports.getCTVMetrics = (campaign) => {
  const data = campaign.toObject ? campaign.toObject() : campaign;
  return {
    households: data['Households'] || 0,
    impressionsPerHousehold: data['Impressons per Household'] || 0,
    viewThroughRate: data['View-Through Rate'] || 0,
    frequency: data['CTV Frequency'] || 0
  };
};

exports.getCTVPreferenceInsights = (campaign) => {
  return {
    interests: campaign['In-market & interests'] || '',
    hourOfDay: campaign['Hour of day'] || 0,
    strategy: campaign['CTV Strategy'] || '',
    targeting: {
      state: campaign['State targeting'] || '',
      zip: campaign['ZIP targeting'] || ''
    }
  };
};

exports.getCTVPerformanceByDemo = (campaign) => {
  return {
    ageBracket: campaign['Age bracket'] || '',
    gender: campaign['Gender'] || '',
    household: {
      income: campaign['Household Income'] || '',
      size: campaign['Household Size'] || 0
    }
  };
};

// P2P/F2F analytics helpers
exports.getP2PMetrics = (campaign) => {
  return {
    initialMessages: campaign['p2p_initial_messages'] || 0,
    responses: campaign['p2p_responses'] || 0,
    optOuts: campaign['p2p_opt_outs'] || 0,
    conversions: campaign['p2p_conversions'] || 0
  };
};

exports.getF2FMetrics = (campaign) => {
  return {
    attempts: campaign['f2f_attempts'] || 0,
    contacts: campaign['f2f_contacts'] || 0,
    conversations: campaign['f2f_conversations'] || 0,
    signups: campaign['f2f_signups'] || 0
  };
};

exports.getDialerMetrics = (campaign) => {
  return {
    calls: campaign['dialer_calls'] || 0,
    connects: campaign['dialer_connects'] || 0,
    conversations: campaign['dialer_conversations'] || 0,
    commitments: campaign['dialer_commitments'] || 0
  };
};

exports.getOpenCanvassMetrics = (campaign) => {
  return {
    doors: campaign['canvass_doors'] || 0,
    contacts: campaign['canvass_contacts'] || 0,
    conversations: campaign['canvass_conversations'] || 0,
    signups: campaign['canvass_signups'] || 0
  };
};

// Demographics analytics helpers
exports.getSelfReportedDemographics = (campaign) => {
  return {
    ethnicity: campaign['Self Reported Ethnicity'] || '',
    language: campaign['Self Reported Language'] || '',
    age: campaign['Self Reported Age'] || '',
    gender: campaign['Self Reported Gender'] || ''
  };
};

exports.getDetailedDemographics = (campaign) => {
  return {
    byAge: {
      bracket: campaign['Age bracket'] || '',
      distribution: campaign['Age distribution'] || {}
    },
    byLanguage: {
      language: campaign['Language preference'] || '',
      distribution: campaign['Language distribution'] || {}
    },
    byGender: {
      gender: campaign['Gender'] || '',
      distribution: campaign['Gender distribution'] || {}
    }
  };
};

exports.getGeographicMetrics = (campaign) => {
  return {
    state: campaign['State'] || '',
    city: campaign['City'] || '',
    zip: campaign['ZIP'] || '',
    district: campaign['District'] || '',
    region: campaign['Region'] || ''
  };
};

exports.getContactInfo = (campaign) => {
  return {
    email: campaign['Email Address'] || '',
    phone: campaign['Phone'] || '',
    address: campaign['Address'] || '',
    preferredContact: campaign['Contact preference'] || ''
  };
};

exports.getDemographicEngagement = (campaign) => {
  const data = campaign.toObject ? campaign.toObject() : campaign;
  return {
    byAge: {
      bracket: data['Age bracket'] || '',
      engagement: data['Age engagement'] || {}
    },
    byLanguage: {
      language: data['Self Reported Language'] || '',
      engagement: data['Language engagement'] || {}
    },
    byLocation: {
      region: data['Region'] || '',
      engagement: data['Geographic engagement'] || {}
    }
  };
};

// Event analytics helpers
exports.getEventDetails = (campaign) => {
  return {
    eventName: campaign['Event Name'] || '',
    eventType: campaign['Event Type'] || '',
    eventDate: campaign['Event Date'] || null,
    location: campaign['Event Location'] || '',
    capacity: campaign['Event Capacity'] || 0
  };
};

exports.getEventPerformance = (campaign) => {
  return {
    registrations: campaign['Event Registrations'] || 0,
    attendees: campaign['Event Attendees'] || 0,
    noShows: campaign['Event No Shows'] || 0,
    satisfaction: campaign['Event Satisfaction'] || 0
  };
};

exports.getEventReferrals = (campaign) => {
  return {
    referrals: campaign['Event Referrals'] || 0,
    referralConversions: campaign['Referral Conversions'] || 0,
    referralRate: campaign['Referral Rate'] || '0%'
  };
};

// Technical analytics helpers
exports.getTechnicalMetrics = (campaign) => {
  const data = campaign.toObject ? campaign.toObject() : campaign;
  return {
    browser: {
      name: data['Browser'] || '',
      version: data['Browser Version'] || ''
    },
    device: {
      type: data['Device Type'] || '',
      model: data['Device Model'] || ''
    },
    os: {
      name: data['OS'] || '',
      version: data['OS Version'] || ''
    },
    screen: {
      resolution: data['Screen Resolution'] || '',
      orientation: data['Screen Orientation'] || ''
    }
  };
};

exports.getTrafficMetrics = (campaign) => {
  return {
    source: campaign['Traffic Source'] || '',
    medium: campaign['Traffic Medium'] || '',
    campaign: campaign['Traffic Campaign'] || '',
    referrer: campaign['Referrer'] || ''
  };
};

exports.getConversionMetrics = (campaign) => {
  return {
    funnelStage: campaign['Funnel Stage'] || '',
    conversionPath: campaign['Conversion Path'] || [],
    touchpoints: campaign['Touchpoints'] || 0,
    timeToConvert: campaign['Time to Convert'] || 0
  };
};

exports.getCustomMetrics = (campaign) => {
  return {
    custom1: campaign['Custom Metric 1'] || null,
    custom2: campaign['Custom Metric 2'] || null,
    custom3: campaign['Custom Metric 3'] || null,
    customFlags: campaign['Custom Flags'] || {}
  };
};

// Testing analytics helpers
exports.getTestingMetrics = (campaign) => {
  // Convert to plain object if it's a Mongoose document
  const data = campaign.toObject ? campaign.toObject() : campaign;
  
  return {
    control: {
      visits: data['Control Visits'] || 0,
      conversions: data['Control Conversions'] || 0,
      revenue: data['Control Revenue'] || 0
    },
    variant: {
      visits: data['Variant Visits'] || 0,
      conversions: data['Variant Conversions'] || 0,
      revenue: data['Variant Revenue'] || 0
    }
  };
};

exports.getEmailTestingMetrics = (campaign) => {
  return {
    subjectTests: campaign['Subject Line Tests'] || [],
    previewTests: campaign['Preview Text Tests'] || [],
    contentTests: campaign['Email Content Tests'] || [],
    timingTests: campaign['Send Time Tests'] || []
  };
};

exports.getAdTestingMetrics = (campaign) => {
  return {
    creativeTests: campaign['Ad Creative Tests'] || [],
    audienceTests: campaign['Ad Audience Tests'] || [],
    placementTests: campaign['Ad Placement Tests'] || [],
    bidTests: campaign['Ad Bid Tests'] || []
  };
};

exports.getCustomTestMetrics = (campaign) => {
  return {
    customTests: campaign['Custom Tests'] || [],
    testResults: campaign['Test Results'] || {},
    significance: campaign['Test Significance'] || {},
    recommendations: campaign['Test Recommendations'] || []
  };
};
