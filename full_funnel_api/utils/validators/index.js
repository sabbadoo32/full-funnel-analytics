const BaseValidator = require('./BaseValidator');
const EmailAnalyticsValidator = require('./EmailAnalyticsValidator');
const { ValidationError } = require('../errors');

// Export validators
module.exports = {
  // Base classes
  BaseValidator,
  ValidationError,
  
  // Specific validators
  EmailAnalyticsValidator,
  
  // Helper to create a validation middleware
  createValidator(validator, options = {}) {
    return (req, res, next) => {
      try {
        const data = options.source === 'query' ? req.query : 
                   options.source === 'params' ? req.params : 
                   req.body;
        
        const { isValid, errors } = validator.validate(data);
        
        if (!isValid) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors
          });
        }
        
        // Attach validated data to request object
        req.validated = req.validated || {};
        req.validated[options.key || 'data'] = data;
        
        next();
      } catch (error) {
        if (error.name === 'ValidationError') {
          return res.status(error.statusCode || 400).json({
            success: false,
            error: error.message,
            details: error.details
          });
        }
        
        // Pass to error handler
        next(error);
      }
    };
  }
};
