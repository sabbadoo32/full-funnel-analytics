const { ValidationError } = require('../errors');

class BaseValidator {
  constructor() {
    this.rules = {};
    this.messages = {};
  }

  /**
   * Validate data against schema rules
   * @param {Object} data - Data to validate
   * @param {Object} [rules] - Optional rules to override default
   * @returns {Object} - Validation result { isValid: boolean, errors: Object }
   */
  validate(data, rules = null) {
    const validationRules = rules || this.rules;
    const errors = {};
    let isValid = true;

    for (const [field, rule] of Object.entries(validationRules)) {
      const fieldValue = data[field];
      const fieldErrors = [];

      // Skip validation if field is optional and not provided
      if (rule.optional && (fieldValue === undefined || fieldValue === null)) {
        continue;
      }

      // Check required fields
      if (rule.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
        fieldErrors.push(this.getMessage(field, 'required'));
        isValid = false;
        continue;
      }

      // Skip further validation if field is empty and not required
      if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
        continue;
      }

      // Type validation
      if (rule.type && !this.validateType(fieldValue, rule.type)) {
        fieldErrors.push(this.getMessage(field, 'type', { type: rule.type }));
        isValid = false;
      }

      // Custom validation functions
      if (rule.validate && typeof rule.validate === 'function') {
        const customValidation = rule.validate(fieldValue, data);
        if (customValidation !== true) {
          fieldErrors.push(customValidation || this.getMessage(field, 'invalid'));
          isValid = false;
        }
      }

      // Add field errors if any
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }

    if (!isValid) {
      throw new ValidationError('Validation failed', { errors });
    }

    return { isValid: true, data };
  }

  /**
   * Validate field type
   * @private
   */
  validateType(value, type) {
    const typeCheckers = {
      string: v => typeof v === 'string',
      number: v => typeof v === 'number' && !isNaN(v),
      boolean: v => typeof v === 'boolean',
      array: v => Array.isArray(v),
      object: v => v !== null && typeof v === 'object' && !Array.isArray(v),
      date: v => v instanceof Date || !isNaN(Date.parse(v)),
      email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      url: v => {
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
    };

    const checker = typeCheckers[type];
    return checker ? checker(value) : true;
  }

  /**
   * Get validation message
   * @private
   */
  getMessage(field, type, params = {}) {
    const defaultMessages = {
      required: `${field} is required`,
      type: `${field} must be a ${params.type}`,
      invalid: `${field} is invalid`,
    };

    return this.messages[`${field}.${type}`] || 
           this.messages[type] || 
           defaultMessages[type] || 
           defaultMessages.invalid;
  }
}

module.exports = BaseValidator;
