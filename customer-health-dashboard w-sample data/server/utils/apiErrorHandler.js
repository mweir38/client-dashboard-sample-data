/**
 * Centralized API Error Handling Utility
 * Provides consistent error handling and logging for all API integrations
 */

class APIError extends Error {
  constructor(message, service, statusCode = null, originalError = null) {
    super(message);
    this.name = 'APIError';
    this.service = service;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

class APIErrorHandler {
  /**
   * Handle API errors with consistent logging and response formatting
   * @param {Error} error - The original error
   * @param {string} service - Service name (jira, zendesk, hubspot)
   * @param {string} operation - Operation being performed
   * @param {any} fallbackValue - Default value to return on error
   * @returns {any} Fallback value or throws formatted error
   */
  static handle(error, service, operation, fallbackValue = null) {
    const statusCode = error.response?.status;
    const errorMessage = error.response?.data?.message || error.message;
    
    // Log the error with context
    console.error(`[${service.toUpperCase()}] ${operation} failed:`, {
      message: errorMessage,
      statusCode,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });

    // Create structured error
    const apiError = new APIError(
      `${service} ${operation} failed: ${errorMessage}`,
      service,
      statusCode,
      error
    );

    // Return fallback value for non-critical operations
    if (fallbackValue !== null) {
      console.warn(`[${service.toUpperCase()}] Returning fallback value for ${operation}`);
      return fallbackValue;
    }

    // Throw formatted error for critical operations
    throw apiError;
  }

  /**
   * Handle authentication errors specifically
   * @param {Error} error - The original error
   * @param {string} service - Service name
   * @returns {Object} Error details with suggestions
   */
  static handleAuthError(error, service) {
    const statusCode = error.response?.status;
    
    if (statusCode === 401) {
      return {
        error: 'Authentication failed',
        service,
        suggestion: `Check your ${service.toUpperCase()} API credentials in .env file`,
        statusCode: 401
      };
    }
    
    if (statusCode === 403) {
      return {
        error: 'Access forbidden',
        service,
        suggestion: `Your ${service.toUpperCase()} API token may not have sufficient permissions`,
        statusCode: 403
      };
    }

    return {
      error: error.message,
      service,
      suggestion: 'Check your API configuration',
      statusCode
    };
  }

  /**
   * Check if error is due to missing configuration
   * @param {Error} error - The error to check
   * @returns {boolean} True if configuration is missing
   */
  static isConfigurationError(error) {
    return error.message.includes('not configured') || 
           error.message.includes('credentials not configured');
  }

  /**
   * Check if error is due to rate limiting
   * @param {Error} error - The error to check
   * @returns {boolean} True if rate limited
   */
  static isRateLimitError(error) {
    const statusCode = error.response?.status;
    return statusCode === 429 || 
           error.message.includes('rate limit') ||
           error.message.includes('too many requests');
  }

  /**
   * Get retry delay for rate limit errors
   * @param {Error} error - The rate limit error
   * @returns {number} Delay in milliseconds
   */
  static getRetryDelay(error) {
    const retryAfter = error.response?.headers['retry-after'];
    if (retryAfter) {
      return parseInt(retryAfter) * 1000; // Convert to milliseconds
    }
    return 60000; // Default 1 minute
  }

  /**
   * Format error for API responses
   * @param {Error} error - The error to format
   * @returns {Object} Formatted error response
   */
  static formatForResponse(error) {
    if (error instanceof APIError) {
      return {
        error: true,
        message: error.message,
        service: error.service,
        statusCode: error.statusCode,
        timestamp: error.timestamp
      };
    }

    return {
      error: true,
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Log successful API operations
   * @param {string} service - Service name
   * @param {string} operation - Operation performed
   * @param {any} result - Operation result
   */
  static logSuccess(service, operation, result) {
    const resultSize = Array.isArray(result) ? result.length : 
                      typeof result === 'object' ? Object.keys(result).length : 1;
    
    console.log(`[${service.toUpperCase()}] ${operation} successful:`, {
      resultSize,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  APIError,
  APIErrorHandler
};