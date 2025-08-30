const BaseValidator = require('./BaseValidator');

class EmailAnalyticsValidator extends BaseValidator {
  constructor() {
    super();
    
    // Define validation rules
    this.rules = {
      campaignId: {
        type: 'string',
        required: true,
        validate: (value) => {
          if (!/^[a-f\d]{24}$/i.test(value)) {
            return 'Invalid campaign ID format';
          }
          return true;
        }
      },
      startDate: {
        type: 'date',
        required: false,
        validate: (value, data) => {
          const date = new Date(value);
          const now = new Date();
          
          if (isNaN(date.getTime())) {
            return 'Invalid date format';
          }
          
          if (date > now) {
            return 'Start date cannot be in the future';
          }
          
          if (data.endDate) {
            const endDate = new Date(data.endDate);
            if (date > endDate) {
              return 'Start date must be before end date';
            }
          }
          
          return true;
        }
      },
      endDate: {
        type: 'date',
        required: false,
        validate: (value) => {
          const date = new Date(value);
          const now = new Date();
          
          if (isNaN(date.getTime())) {
            return 'Invalid date format';
          }
          
          if (date > now) {
            return 'End date cannot be in the future';
          }
          
          return true;
        }
      },
      metrics: {
        type: 'array',
        required: false,
        validate: (value) => {
          const allowedMetrics = [
            'opens', 'clicks', 'conversions', 'bounces', 
            'unsubscribes', 'spamReports', 'forwards'
          ];
          
          if (!Array.isArray(value)) {
            return 'Metrics must be an array';
          }
          
          const invalidMetrics = value.filter(
            metric => !allowedMetrics.includes(metric)
          );
          
          if (invalidMetrics.length > 0) {
            return `Invalid metrics: ${invalidMetrics.join(', ')}`;
          }
          
          return true;
        }
      },
      groupBy: {
        type: 'string',
        required: false,
        validate: (value) => {
          const allowedGroups = [
            'day', 'week', 'month', 'campaign', 'subject', 'audience'
          ];
          
          if (!allowedGroups.includes(value)) {
            return `Group by must be one of: ${allowedGroups.join(', ')}`;
          }
          
          return true;
        }
      },
      includeBenchmarks: {
        type: 'boolean',
        required: false
      },
      includeSuggestions: {
        type: 'boolean',
        required: false
      }
    };
    
    // Custom error messages
    this.messages = {
      'campaignId.required': 'Campaign ID is required',
      'startDate.invalid': 'Start date is invalid',
      'endDate.invalid': 'End date is invalid',
      'metrics.invalid': 'One or more metrics are invalid',
      'groupBy.invalid': 'Invalid group by value'
    };
  }
  
  /**
   * Validate email analytics query parameters
   * @param {Object} query - Query parameters to validate
   * @returns {Object} - Validation result
   */
  validateQuery(query) {
    return this.validate(query);
  }
  
  /**
   * Validate email campaign data
   * @param {Object} campaign - Campaign data to validate
   * @returns {Object} - Validation result
   */
  validateCampaign(campaign) {
    const campaignRules = {
      name: { type: 'string', required: true },
      subject: { type: 'string', required: true },
      fromName: { type: 'string', required: true },
      fromEmail: { type: 'email', required: true },
      sendTime: { type: 'date', required: true },
      audienceId: { type: 'string', required: true },
      templateId: { type: 'string', required: true },
      status: {
        type: 'string',
        required: true,
        validate: (value) => {
          const validStatuses = ['draft', 'scheduled', 'sending', 'sent', 'cancelled'];
          if (!validStatuses.includes(value)) {
            return `Status must be one of: ${validStatuses.join(', ')}`;
          }
          return true;
        }
      },
      tags: {
        type: 'array',
        required: false,
        validate: (value) => {
          if (!Array.isArray(value)) {
            return 'Tags must be an array';
          }
          
          const invalidTags = value.filter(
            tag => typeof tag !== 'string' || tag.trim() === ''
          );
          
          if (invalidTags.length > 0) {
            return 'Tags must be non-empty strings';
          }
          
          return true;
        }
      },
      metadata: {
        type: 'object',
        required: false
      }
    };
    
    return this.validate(campaign, campaignRules);
  }
}

module.exports = EmailAnalyticsValidator;
