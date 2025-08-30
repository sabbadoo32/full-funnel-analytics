/**
 * Custom error class for validation errors
 */
class ValidationError extends Error {
  /**
   * Create a ValidationError
   * @param {string} message - Error message
   * @param {Object} [details] - Additional error details
   */
  constructor(message, details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400; // Bad Request
    this.details = details;
    
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  /**
   * Convert error to JSON
   * @returns {Object} - JSON representation of the error
   */
  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        statusCode: this.statusCode,
        ...this.details
      }
    };
  }
}

module.exports = ValidationError;
