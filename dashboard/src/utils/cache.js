/**
 * Request Cache Utility
 *
 * Caches API requests to reduce server load and improve performance
 * Uses in-memory cache with automatic expiration
 */

class RequestCache {
  constructor(maxAge = 5 * 60 * 1000) { // Default: 5 minutes
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  /**
   * Generate cache key from URL and params
   */
  _generateKey(url, params = {}) {
    const paramString = JSON.stringify(params);
    return `${url}::${paramString}`;
  }

  /**
   * Get cached data if available and not expired
   */
  get(url, params = {}) {
    const key = this._generateKey(url, params);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const now = Date.now();
    const age = now - cached.timestamp;

    if (age > this.maxAge) {
      // Expired, remove from cache
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache data
   */
  set(url, params = {}, data) {
    const key = this._generateKey(url, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Invalidate cache entries matching URL pattern
   */
  invalidate(urlPattern) {
    const regex = new RegExp(urlPattern);
    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      const url = key.split('::')[0];
      if (regex.test(url)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Clean expired entries
   */
  cleanExpired() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, value] of this.cache.entries()) {
      const age = now - value.timestamp;
      if (age > this.maxAge) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }
}

// Export singleton instance
export const requestCache = new RequestCache();

// Export class for custom instances
export default RequestCache;
