/**
 * Mobilize Analytics Helper
 * Provides functions to process and analyze Mobilize event data
 */

// Event type categories for grouping similar events
const EVENT_CATEGORIES = {
  CANVASS: ['CANVASS', 'PHONE_BANK', 'TEXT_BROADCAST', 'VOTER_REG'],
  TRAINING: ['TRAINING', 'MEETING', 'VOLUNTEER_TEAM_MEETING'],
  FUNDRAISER: ['FUNDRAISER', 'FUNDRAISING', 'HOUSE_PARTY'],
  RALLY: ['RALLY', 'MARCH', 'PROTEST', 'PRESS_CONFERENCE'],
  COMMUNITY: ['COMMUNITY', 'TOWN_HALL', 'FORUM', 'PANEL_DISCUSSION'],
  VIRTUAL: ['VIRTUAL', 'ONLINE_ACTION', 'DIGITAL_TOWN_HALL']
};

// Benchmarks for event performance (can be customized per organization)
const BENCHMARKS = {
  // Attendance rate benchmarks by event type
  attendanceRates: {
    default: 0.6, // 60% attendance rate
    CANVASS: 0.65,
    PHONE_BANK: 0.7,
    TEXT_BROADCAST: 0.75,
    TRAINING: 0.55,
    FUNDRAISER: 0.8,
    RALLY: 0.5,
    VIRTUAL: 0.4
  },
  // Conversion rate from RSVP to attendance
  conversionRate: 0.7, // 70% of RSVPs attend
  // Average no-show rate
  noShowRate: 0.3, // 30% of RSVPs don't show
  // Capacity utilization targets
  capacityUtilization: 0.8 // 80% of capacity is ideal
};

/**
 * Categorize an event type into a broader category
 * @param {string} eventType - The specific event type
 * @returns {string} - The category name
 */
const categorizeEvent = (eventType) => {
  if (!eventType) return 'other';
  
  // Check virtual events first
  const isVirtual = eventType.includes('VIRTUAL') || eventType.includes('ONLINE');
  if (isVirtual) return 'VIRTUAL';
  
  // Check other categories
  for (const [category, types] of Object.entries(EVENT_CATEGORIES)) {
    if (types.some(type => eventType.includes(type) || type.includes(eventType))) {
      return category;
    }
  }
  return 'other';
};

/**
 * Extract event details from a Mobilize event
 * @param {Object} event - The event object from Mobilize
 * @returns {Object} - Processed event details
 */
const getEventDetails = (event) => {
  const eventType = event.event_type || 'other';
  const category = categorizeEvent(eventType);
  const startTime = event.start_time ? new Date(event.start_time) : null;
  const endTime = event.end_time ? new Date(event.end_time) : null;
  const duration = startTime && endTime ? (endTime - startTime) / (1000 * 60 * 60) : 0; // in hours
  const isVirtual = event.is_virtual === true || event.virtual_url ? true : false;
  const maxAttendees = parseInt(event.max_attendees) || 0;
  const currentAttendees = parseInt(event.current_attendees) || 0;
  const volunteerCount = parseInt(event.volunteer_count) || 0;
  const attendanceRate = maxAttendees > 0 ? currentAttendees / maxAttendees : 0;
  const isUpcoming = startTime && startTime > new Date();
  const isPast = startTime && startTime <= new Date();
  
  return {
    id: event.event_id,
    title: event.event_title,
    description: event.event_description,
    type: eventType,
    category,
    isVirtual,
    isUpcoming,
    isPast,
    startTime: startTime ? startTime.toISOString() : null,
    endTime: endTime ? endTime.toISOString() : null,
    duration,
    timezone: event.timezone || 'UTC',
    location: {
      full: event.location,
      address: event.address,
      city: event.city,
      state: event.state,
      zip: event.zip,
      isVirtual,
      virtualUrl: event.virtual_url
    },
    capacity: {
      max: maxAttendees,
      current: currentAttendees,
      volunteers: volunteerCount,
      attendanceRate,
      isFull: maxAttendees > 0 && currentAttendees >= maxAttendees
    },
    organization: {
      id: event.organization_id,
      name: event.organization_name
    },
    campaignId: event.campaign_id,
    status: event.status || 'scheduled',
    url: event.browser_url,
    createdDate: event.created_date ? new Date(event.created_date).toISOString() : null,
    updatedDate: event.updated_date ? new Date(event.updated_date).toISOString() : null,
    metadata: {
      ...event,
      // Remove already extracted fields
      event_id: undefined,
      event_title: undefined,
      event_type: undefined,
      event_description: undefined,
      start_time: undefined,
      end_time: undefined,
      timezone: undefined,
      location: undefined,
      address: undefined,
      city: undefined,
      state: undefined,
      zip: undefined,
      is_virtual: undefined,
      virtual_url: undefined,
      max_attendees: undefined,
      current_attendees: undefined,
      volunteer_count: undefined,
      organization_id: undefined,
      organization_name: undefined,
      campaign_id: undefined,
      status: undefined,
      browser_url: undefined,
      created_date: undefined,
      updated_date: undefined
    }
  };
};

/**
 * Calculate event performance metrics
 * @param {Array} events - Array of event details
 * @returns {Object} - Performance metrics
 */
const calculateEventMetrics = (events) => {
  if (!events?.length) {
    return {
      totalEvents: 0,
      totalAttendees: 0,
      totalCapacity: 0,
      totalVolunteers: 0,
      avgAttendanceRate: 0,
      byEventType: {},
      byCategory: {},
      byState: {},
      byOrganization: {},
      byTime: {
        byHour: Array(24).fill(0),
        byDay: Array(7).fill(0)
      },
      upcomingEvents: 0,
      pastEvents: 0,
      virtualEvents: 0,
      inPersonEvents: 0,
      performanceScore: 0
    };
  }

  const metrics = {
    totalEvents: events.length,
    totalAttendees: 0,
    totalCapacity: 0,
    totalVolunteers: 0,
    byEventType: {},
    byCategory: {},
    byState: {},
    byOrganization: {},
    byTime: {
      byHour: Array(24).fill(0),
      byDay: Array(7).fill(0)
    },
    upcomingEvents: 0,
    pastEvents: 0,
    virtualEvents: 0,
    inPersonEvents: 0,
    // Performance metrics
    avgAttendanceRate: 0,
    avgVolunteerRatio: 0,
    performanceScore: 0
  };

  // Process each event
  events.forEach(event => {
    const { 
      isVirtual, 
      isUpcoming, 
      isPast, 
      type, 
      category, 
      state, 
      organization, 
      capacity,
      startTime
    } = event;
    
    // Track event types
    if (type) {
      if (!metrics.byEventType[type]) {
        metrics.byEventType[type] = {
          count: 0,
          attendees: 0,
          capacity: 0,
          volunteers: 0
        };
      }
      metrics.byEventType[type].count++;
      metrics.byEventType[type].attendees += capacity.current;
      metrics.byEventType[type].capacity += capacity.max;
      metrics.byEventType[type].volunteers += capacity.volunteers;
    }
    
    // Track categories
    if (category) {
      if (!metrics.byCategory[category]) {
        metrics.byCategory[category] = {
          count: 0,
          attendees: 0,
          capacity: 0,
          volunteers: 0
        };
      }
      metrics.byCategory[category].count++;
      metrics.byCategory[category].attendees += capacity.current;
      metrics.byCategory[category].capacity += capacity.max;
      metrics.byCategory[category].volunteers += capacity.volunteers;
    }
    
    // Track states
    if (state) {
      if (!metrics.byState[state]) {
        metrics.byState[state] = {
          count: 0,
          attendees: 0,
          capacity: 0,
          volunteers: 0
        };
      }
      metrics.byState[state].count++;
      metrics.byState[state].attendees += capacity.current;
      metrics.byState[state].capacity += capacity.max;
      metrics.byState[state].volunteers += capacity.volunteers;
    }
    
    // Track organizations
    if (organization?.id) {
      const orgId = organization.id;
      if (!metrics.byOrganization[orgId]) {
        metrics.byOrganization[orgId] = {
          name: organization.name || 'Unknown',
          count: 0,
          attendees: 0,
          capacity: 0,
          volunteers: 0
        };
      }
      metrics.byOrganization[orgId].count++;
      metrics.byOrganization[orgId].attendees += capacity.current;
      metrics.byOrganization[orgId].capacity += capacity.max;
      metrics.byOrganization[orgId].volunteers += capacity.volunteers;
    }
    
    // Track time-based metrics
    if (startTime) {
      const date = new Date(startTime);
      const hour = date.getHours();
      const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      metrics.byTime.byHour[hour]++;
      metrics.byTime.byDay[day]++;
    }
    
    // Update totals
    metrics.totalAttendees += capacity.current;
    metrics.totalCapacity += capacity.max;
    metrics.totalVolunteers += capacity.volunteers;
    
    // Track event status
    if (isUpcoming) metrics.upcomingEvents++;
    if (isPast) metrics.pastEvents++;
    if (isVirtual) metrics.virtualEvents++;
    else metrics.inPersonEvents++;
  });
  
  // Calculate averages
  metrics.avgAttendanceRate = metrics.totalCapacity > 0 
    ? metrics.totalAttendees / metrics.totalCapacity 
    : 0;
    
  metrics.avgVolunteerRatio = metrics.totalAttendees > 0 
    ? metrics.totalVolunteers / metrics.totalAttendees 
    : 0;
  
  // Calculate performance score
  metrics.performanceScore = calculatePerformanceScore(metrics);
  
  return metrics;
};

/**
 * Calculate a performance score based on event metrics
 * @param {Object} metrics - Event metrics
 * @returns {number} - Performance score (0-100)
 */
const calculatePerformanceScore = (metrics) => {
  if (metrics.totalEvents === 0) return 0;
  
  // Weights for different metrics (sum to 1.0)
  const weights = {
    attendanceRate: 0.5,
    capacityUtilization: 0.3,
    volunteerRatio: 0.2
  };
  
  // Calculate component scores (0-100)
  const attendanceScore = Math.min(100, (metrics.avgAttendanceRate / 0.8) * 100); // 80% is perfect
  const capacityScore = Math.min(100, (metrics.totalAttendees / metrics.totalCapacity) * 100);
  const volunteerScore = Math.min(100, (metrics.avgVolunteerRatio / 0.2) * 100); // 1 volunteer per 5 attendees is ideal
  
  // Calculate weighted score
  const score = Math.round(
    (attendanceScore * weights.attendanceRate) +
    (capacityScore * weights.capacityUtilization) +
    (volunteerScore * weights.volunteerRatio)
  );
  
  return Math.min(100, Math.max(0, score)); // Ensure score is between 0-100
};

/**
 * Generate insights based on event metrics
 * @param {Object} metrics - Event metrics
 * @returns {Object} - Insights object
 */
const generateInsights = (metrics) => {
  const insights = {
    keyStrengths: [],
    improvementAreas: [],
    recommendations: []
  };
  
  if (metrics.totalEvents === 0) {
    insights.recommendations.push('No event data available. Consider creating and promoting more events.');
    return insights;
  }
  
  // Attendance rate insights
  if (metrics.avgAttendanceRate > 0.7) {
    insights.keyStrengths.push('High average attendance rate');
  } else if (metrics.avgAttendanceRate < 0.4) {
    insights.improvementAreas.push('Low average attendance rate');
    insights.recommendations.push('Improve event marketing and reminders to boost attendance.');
  }
  
  // Volunteer ratio insights
  if (metrics.avgVolunteerRatio > 0.15) {
    insights.keyStrengths.push('Strong volunteer support');
  } else if (metrics.avgVolunteerRatio < 0.05) {
    insights.improvementAreas.push('Low volunteer-to-attendee ratio');
    insights.recommendations.push('Recruit more volunteers to support your events.');
  }
  
  // Event type insights
  if (Object.keys(metrics.byEventType).length > 0) {
    const sortedTypes = Object.entries(metrics.byEventType)
      .sort((a, b) => b[1].count - a[1].count);
      
    if (sortedTypes.length > 0) {
      const [mostPopularType, mostPopularData] = sortedTypes[0];
      insights.keyStrengths.push(`Most popular event type: ${mostPopularType} (${mostPopularData.count} events)`);
      
      // Find event types with low attendance
      const lowAttendanceTypes = sortedTypes
        .filter(([_, data]) => data.capacity > 0 && (data.attendees / data.capacity) < 0.3)
        .map(([type]) => type);
        
      if (lowAttendanceTypes.length > 0) {
        insights.improvementAreas.push(`Low attendance for: ${lowAttendanceTypes.join(', ')}`);
      }
    }
  }
  
  // Time-based insights
  if (metrics.byTime) {
    const peakHour = metrics.byTime.byHour.indexOf(Math.max(...metrics.byTime.byHour));
    const peakDay = metrics.byTime.byDay.indexOf(Math.max(...metrics.byTime.byDay));
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    if (peakHour >= 0) {
      insights.recommendations.push(`Peak event time is around ${peakHour}:00. Consider scheduling more events at this time.`);
    }
    
    if (peakDay >= 0 && metrics.byTime.byDay[peakDay] > 0) {
      insights.recommendations.push(`Most events are on ${days[peakDay]}s. Consider diversifying your event schedule.`);
    }
  }
  
  // Virtual vs in-person insights
  if (metrics.virtualEvents > 0 && metrics.inPersonEvents > 0) {
    const virtualPct = (metrics.virtualEvents / metrics.totalEvents) * 100;
    if (virtualPct > 70) {
      insights.recommendations.push('Most of your events are virtual. Consider adding more in-person events to build stronger connections.');
    } else if (virtualPct < 30) {
      insights.recommendations.push('Most of your events are in-person. Consider adding more virtual events to increase accessibility.');
    }
  }
  
  // Add performance tier
  const performanceTier = getPerformanceTier(metrics.performanceScore);
  insights.performanceTier = performanceTier;
  
  // Add overall assessment
  if (performanceTier === 'excellent') {
    insights.summary = 'Your events are performing exceptionally well with high attendance and engagement.';
  } else if (performanceTier === 'good') {
    insights.summary = 'Your events are performing well, with some opportunities for improvement.';
  } else if (performanceTier === 'average') {
    insights.summary = 'Your event performance is average. Consider implementing the recommended improvements.';
  } else {
    insights.summary = 'Your events need improvement. Focus on the key areas identified above.';
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
  categorizeEvent,
  getEventDetails,
  calculateEventMetrics,
  calculatePerformanceScore,
  generateInsights,
  getPerformanceTier,
  BENCHMARKS
};
