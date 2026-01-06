/**
 * Utility functions for formatting values
 */

/**
 * Format duration from seconds to HH:MM:SS or MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format view count with K/M suffixes
 * @param {number} count - View count
 * @returns {string} - Formatted count
 */
export function formatViewCount(count) {
  if (!count || isNaN(count)) return '0';

  if (count >= 1000000000) {
    return (count / 1000000000).toFixed(1) + 'B';
  }
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toLocaleString();
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string or YYYYMMDD format
 * @returns {string} - Formatted date
 */
export function formatDate(dateString) {
  if (!dateString) return '--';

  // Handle YYYYMMDD format from YouTube
  if (/^\d{8}$/.test(dateString)) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    dateString = `${year}-${month}-${day}`;
  }

  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '--';
  }
}

/**
 * Format timestamp for display (minutes:seconds)
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted timestamp
 */
export function formatTimestamp(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Escape regex special characters for search highlighting
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */
export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Group transcript segments by minute
 * @param {Array} segments - Transcript segments
 * @returns {Object} - Segments grouped by minute
 */
export function groupSegmentsByMinute(segments) {
  const groups = {};
  segments.forEach(segment => {
    const minute = Math.floor(segment.start / 60);
    if (!groups[minute]) {
      groups[minute] = [];
    }
    groups[minute].push(segment);
  });
  return groups;
}
