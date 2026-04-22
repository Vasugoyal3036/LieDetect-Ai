/**
 * Retry a function with exponential backoff.
 * Handles transient API errors like 503 (Service Unavailable) and 429 (Rate Limit).
 *
 * @param {Function} fn - Async function to retry
 * @param {Object} options
 * @param {number} options.maxRetries - Max number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 2000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 30000)
 * @param {string} options.label - Label for logging (default: "API call")
 * @returns {Promise<*>} - Result of the function
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 2000,
    maxDelay = 30000,
    label = "API call",
  } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = isRetryableError(error);

      if (!isRetryable || attempt === maxRetries) {
        // Not a transient error or we've exhausted retries — rethrow
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );

      console.warn(
        `[Retry] ${label} failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}. Retrying in ${Math.round(delay)}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Check if an error is transient/retryable
 */
function isRetryableError(error) {
  const message = (error.message || "").toLowerCase();
  const status = error.status || error.statusCode || error.httpStatusCode;

  // Explicit HTTP status codes that are retryable
  if ([503, 429, 500, 502, 504].includes(status)) return true;

  // Check error message patterns
  const retryablePatterns = [
    "503",
    "429",
    "service unavailable",
    "rate limit",
    "too many requests",
    "overloaded",
    "high demand",
    "resource exhausted",
    "temporarily unavailable",
    "internal error",
    "econnreset",
    "econnrefused",
    "etimedout",
    "socket hang up",
    "fetch failed",
  ];

  return retryablePatterns.some((pattern) => message.includes(pattern));
}

module.exports = { retryWithBackoff };
