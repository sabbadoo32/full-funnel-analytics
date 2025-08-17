/**
 * Peer-to-Peer (P2P) and Field (F2F) analytics helper functions
 */

const getP2PMetrics = (campaign) => {
  return {
    // Initial outreach
    initialMessages: campaign["p2p_initial_messages"] || 0,
    followUps: campaign["p2p_follow_ups"] || 0,
    responses: campaign["p2p_responses"] || 0,
    optOuts: campaign["p2p_opt_outs"] || 0,
    
    // Message status
    messagesRemaining: campaign["p2p_messages_remaining"] || 0,
    needsAttention: campaign["p2p_needs_attention"] || 0,
    undelivered: campaign["p2p_undelivered"] || 0,
    
    // Response rates
    responseRate: campaign["p2p_responses"] && campaign["p2p_initial_messages"] ?
      ((campaign["p2p_responses"] / campaign["p2p_initial_messages"]) * 100).toFixed(2) + '%' : '0%',
    optOutRate: campaign["p2p_opt_outs"] && campaign["p2p_initial_messages"] ?
      ((campaign["p2p_opt_outs"] / campaign["p2p_initial_messages"]) * 100).toFixed(2) + '%' : '0%'
  };
};

const getF2FMetrics = (campaign) => {
  return {
    // Initial contact
    initialMessagesSent: campaign["f2f_initial_messages_sent"] || 0,
    uniquePhonesReached: campaign["f2f_unique_phones_reached"] || 0,
    contactsFollowedUp: campaign["f2f_contacts_followed_up_with"] || 0,
    
    // Contact network
    suggestedContactsKnown: campaign["f2f_suggested_contacts_known"] || 0,
    suggestedContactsReached: campaign["f2f_suggested_contacts_reached"] || 0,
    
    // Contact success rates
    reachRate: campaign["f2f_unique_phones_reached"] && campaign["f2f_initial_messages_sent"] ?
      ((campaign["f2f_unique_phones_reached"] / campaign["f2f_initial_messages_sent"]) * 100).toFixed(2) + '%' : '0%',
    followUpRate: campaign["f2f_contacts_followed_up_with"] && campaign["f2f_unique_phones_reached"] ?
      ((campaign["f2f_contacts_followed_up_with"] / campaign["f2f_unique_phones_reached"]) * 100).toFixed(2) + '%' : '0%'
  };
};

const getDialerMetrics = (campaign) => {
  return {
    // Call metrics
    callsConnected: campaign["dialer_calls_connected"] || 0,
    contactsConnected: campaign["dialer_contacts_connected"] || 0,
    droppedCalls: campaign["dialer_dropped_call_count"] || 0,
    reportsFilled: campaign["dialer_report_filled_count"] || 0,
    
    // Performance rates
    connectionRate: campaign["dialer_contacts_connected"] && campaign["dialer_calls_connected"] ?
      ((campaign["dialer_contacts_connected"] / campaign["dialer_calls_connected"]) * 100).toFixed(2) + '%' : '0%',
    dropRate: campaign["dialer_dropped_call_count"] && campaign["dialer_calls_connected"] ?
      ((campaign["dialer_dropped_call_count"] / campaign["dialer_calls_connected"]) * 100).toFixed(2) + '%' : '0%',
    reportRate: campaign["dialer_report_filled_count"] && campaign["dialer_contacts_connected"] ?
      ((campaign["dialer_report_filled_count"] / campaign["dialer_contacts_connected"]) * 100).toFixed(2) + '%' : '0%'
  };
};

const getOpenCanvassMetrics = (campaign) => {
  return {
    personalContactReports: campaign["open_canvass_personal_contact_reports"] || 0,
    campaignContactReports: campaign["open_canvass_campaign_contact_reports"] || 0,
    contactNumbersProvided: campaign["open_canvass_contact_numbers_provided"] || 0,
    
    // Contact info collection rate
    numberCollectionRate: campaign["open_canvass_contact_numbers_provided"] && 
      (campaign["open_canvass_personal_contact_reports"] + campaign["open_canvass_campaign_contact_reports"]) ?
      ((campaign["open_canvass_contact_numbers_provided"] / 
        (campaign["open_canvass_personal_contact_reports"] + campaign["open_canvass_campaign_contact_reports"])) * 100).toFixed(2) + '%' : '0%'
  };
};

module.exports = {
  getP2PMetrics,
  getF2FMetrics,
  getDialerMetrics,
  getOpenCanvassMetrics
};
