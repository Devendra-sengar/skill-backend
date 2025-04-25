// utils/formatter.js

/**
 * Standardizes API responses across the application
 * @param {boolean} success - Indicates if the operation was successful
 * @param {object|null} data - Data to be returned (null if operation failed)
 * @param {string|null} message - Error message in case of failure
 * @returns {object} Formatted response object
 */
exports.formatResponse = (success, data, message = null) => {
    return {
      success,
      data: data || null,
      message: success ? message || 'Operation successful' : message || 'Operation failed'
    };
  };
  
  /**
   * Formats validation errors from Express-Validator
   * @param {array} errors - Array of validation errors
   * @returns {object} Formatted validation error response
   */
  exports.formatValidationErrors = (errors) => {
    const formattedErrors = {};
    
    errors.forEach(error => {
      formattedErrors[error.param] = error.msg;
    });
    
    return exports.formatResponse(false, { errors: formattedErrors }, 'Validation failed');
  };
  
  /**
   * Formats paginated responses
   * @param {array} data - The paginated data
   * @param {number} page - Current page number
   * @param {number} limit - Items per page
   * @param {number} total - Total number of items
   * @returns {object} Formatted paginated response
   */
  exports.formatPaginatedResponse = (data, page, limit, total) => {
    return exports.formatResponse(true, {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  };
  
  /**
   * Formats error response for specific HTTP status codes
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Custom error message
   * @returns {object} Formatted error response
   */
  exports.formatErrorResponse = (statusCode, message) => {
    let defaultMessage;
    
    switch (statusCode) {
      case 400:
        defaultMessage = 'Bad request';
        break;
      case 401:
        defaultMessage = 'Unauthorized';
        break;
      case 403:
        defaultMessage = 'Forbidden';
        break;
      case 404:
        defaultMessage = 'Resource not found';
        break;
      case 500:
        defaultMessage = 'Internal server error';
        break;
      default:
        defaultMessage = 'Something went wrong';
    }
    
    return exports.formatResponse(false, null, message || defaultMessage);
  };