/**
 * YouTube utility functions for URL validation and video ID extraction
 */

/**
 * Extract video ID from various YouTube URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} - 11-character video ID or null if invalid
 */
function extractVideoId(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Remove whitespace
  url = url.trim();

  try {
    // Pattern 1: youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (watchMatch) {
      return watchMatch[1];
    }

    // Pattern 2: youtu.be/VIDEO_ID
    const shortMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (shortMatch) {
      return shortMatch[1];
    }

    // Pattern 3: youtube.com/embed/VIDEO_ID
    const embedMatch = url.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (embedMatch) {
      return embedMatch[1];
    }

    // Pattern 4: youtube.com/v/VIDEO_ID
    const vMatch = url.match(/(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/);
    if (vMatch) {
      return vMatch[1];
    }

    // Pattern 5: Direct video ID (if 11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validate if URL is a valid YouTube URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid YouTube URL
 */
function isValidYouTubeUrl(url) {
  const videoId = extractVideoId(url);
  return videoId !== null && videoId.length === 11;
}

/**
 * Build standard YouTube watch URL from video ID
 * @param {string} videoId - 11-character video ID
 * @returns {string} - Standard YouTube watch URL
 */
function buildYouTubeUrl(videoId) {
  if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) {
    throw new Error('Invalid video ID');
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Get thumbnail URL for a video ID
 * @param {string} videoId - 11-character video ID
 * @param {string} quality - Thumbnail quality (default, hq, mq, sd, maxres)
 * @returns {string} - Thumbnail URL
 */
function getThumbnailUrl(videoId, quality = 'hq') {
  if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) {
    throw new Error('Invalid video ID');
  }

  const qualityMap = {
    default: 'default.jpg',
    hq: 'hqdefault.jpg',
    mq: 'mqdefault.jpg',
    sd: 'sddefault.jpg',
    maxres: 'maxresdefault.jpg'
  };

  const fileName = qualityMap[quality] || qualityMap.hq;
  return `https://img.youtube.com/vi/${videoId}/${fileName}`;
}

module.exports = {
  extractVideoId,
  isValidYouTubeUrl,
  buildYouTubeUrl,
  getThumbnailUrl
};
