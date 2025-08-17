/**
 * Event and organization analytics helper functions
 */

const getEventDetails = (campaign) => {
  return {
    // Core event data
    eventId: campaign["Event ID"],
    eventName: campaign["Event Name"] || campaign["Event name"],
    eventType: campaign["Event Type"] || campaign["Event type"],
    eventDate: campaign["Event Date"],
    
    // Organization details
    organization: {
      name: campaign["Event organization name"],
      id: campaign["Event organization ID"],
      url: campaign["Event organization URL"]
    },
    
    // Affiliated organization
    affiliatedOrg: {
      name: campaign["Affiliated organization name"],
      id: campaign["Affiliated organization ID"],
      url: campaign["Affiliated organization URL"]
    },
    
    // Time and scheduling
    timeslotId: campaign["Timeslot ID"],
    
    // Status and attendance
    status: campaign["Status"],
    attendanceStatus: campaign["Attendance status"],
    attended: campaign["Attended"],
    
    // Participant info
    groupLeader: campaign["Group leader"],
    rating: campaign["Rating"],
    feedback: campaign["Feedback"]
  };
};

const getEventPerformance = (campaign) => {
  return {
    // Core metrics
    totalAttended: campaign["Attended"] || 0,
    conversionRate: campaign["Conversion Rate"] || 0,
    
    // Testing metrics
    controlGroup: {
      visits: campaign["Control Visits"] || 0,
      conversions: campaign["Control Conversions"] || 0
    },
    variantGroup: {
      visits: campaign["Variant Visits"] || 0,
      conversions: campaign["Variant Conversions"] || 0
    },
    
    // Engagement
    engagedSessions: campaign["Engaged sessions"] || 0,
    engagementRate: campaign["Engagement rate"] || 0,
    avgEngagementTime: campaign["Average engagement time"] || 0
  };
};

const getEventReferrals = (campaign) => {
  return {
    // Traffic sources
    referrer: campaign["Referrer"],
    trafficSource: campaign["Traffic Source"],
    firstUserSourceMedium: campaign["First user source / medium"],
    firstUserPrimaryChannelGroup: campaign["First user primary channel group (Default Channel Group)"],
    
    // URLs and landing
    landingPage: campaign["Landing page"],
    referringUrl: campaign["Referring URL"],
    url: campaign["URL"]
  };
};

module.exports = {
  getEventDetails,
  getEventPerformance,
  getEventReferrals
};
