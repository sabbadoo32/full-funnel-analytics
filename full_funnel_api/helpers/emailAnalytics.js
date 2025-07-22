/**
 * Email analytics helper functions
 */

const getEmailMetrics = (campaign) => {
  return {
    sent: campaign["Emails Sent"] || 0,
    opened: campaign["Opened"] || 0,
    clicked: campaign["Clicked"] || 0,
    converted: campaign["Converted"] || 0,
    bounced: campaign["Bounced"] || 0,
    unsubscribed: campaign["Unsubscribed"] || 0,
    openRate: campaign["Opened"] && campaign["Emails Sent"] ? 
      ((campaign["Opened"] / campaign["Emails Sent"]) * 100).toFixed(2) + '%' : '0%',
    clickRate: campaign["Clicked"] && campaign["Opened"] ?
      ((campaign["Clicked"] / campaign["Opened"]) * 100).toFixed(2) + '%' : '0%',
    conversionRate: campaign["Converted"] && campaign["Clicked"] ?
      ((campaign["Converted"] / campaign["Clicked"]) * 100).toFixed(2) + '%' : '0%'
  };
};

const getEmailToMobilizeMetrics = (campaign) => {
  return {
    rsvps: campaign["Mobilize RSVPs"] || 0,
    emailToRsvpRate: campaign["Mobilize RSVPs"] && campaign["Emails Sent"] ?
      ((campaign["Mobilize RSVPs"] / campaign["Emails Sent"]) * 100).toFixed(2) + '%' : '0%',
    clickToRsvpRate: campaign["Mobilize RSVPs"] && campaign["Clicked"] ?
      ((campaign["Mobilize RSVPs"] / campaign["Clicked"]) * 100).toFixed(2) + '%' : '0%'
  };
};

module.exports = {
  getEmailMetrics,
  getEmailToMobilizeMetrics
};
