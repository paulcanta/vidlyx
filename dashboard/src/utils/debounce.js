/**
 * Debounce and Throttle Utilities
 *
 * Utility functions to optimize performance by limiting function execution frequency
 */

/**
 * Debounce function
 *
 * Delays function execution until after a specified wait time has elapsed
 * since the last time it was invoked.
 *
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function with cancel method
 *
 * @example
 * const handleSearch = debounce((query) => {
 *   fetchSearchResults(query);
 * }, 300);
 *
 * // Cancel pending execution
 * handleSearch.cancel();
 */
export function debounce(func, wait = 300) {
  let timeoutId = null;

  const debounced = function (...args) {
    const context = this;

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      timeoutId = null;
      func.apply(context, args);
    }, wait);
  };

  // Add cancel method
  debounced.cancel = function () {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Throttle function
 *
 * Ensures function is called at most once per specified time limit.
 * First call executes immediately, subsequent calls are throttled.
 *
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 *
 * @example
 * const handleScroll = throttle(() => {
 *   updateScrollPosition();
 * }, 100);
 */
export function throttle(func, limit = 100) {
  let inThrottle = false;
  let lastResult;

  return function (...args) {
    const context = this;

    if (!inThrottle) {
      lastResult = func.apply(context, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }

    return lastResult;
  };
}

/**
 * Leading edge debounce
 *
 * Executes function immediately on first call, then debounces subsequent calls
 *
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounceLeading(func, wait = 300) {
  let timeoutId = null;
  let lastCallTime = 0;

  return function (...args) {
    const context = this;
    const now = Date.now();

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Execute immediately if enough time has passed
    if (now - lastCallTime >= wait) {
      lastCallTime = now;
      return func.apply(context, args);
    }

    // Otherwise, debounce
    timeoutId = setTimeout(() => {
      lastCallTime = Date.now();
      func.apply(context, args);
    }, wait);
  };
}

export default {
  debounce,
  throttle,
  debounceLeading
};
