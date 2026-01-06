/**
 * Video Seek Utilities
 * Helper functions for seeking video to specific frames and timestamps
 */

/**
 * Seek video to a specific frame timestamp
 * @param {Function} seekTo - The video seek function
 * @param {Object} frame - Frame object containing timestamp
 * @param {Object} options - Additional options
 * @param {number} options.offset - Seconds to offset before frame (default: 0)
 * @param {boolean} options.highlight - Whether to highlight the frame (default: true)
 * @param {Function} options.onSeek - Callback after seek completes
 * @returns {number} The actual seek time
 */
export const seekToFrame = (seekTo, frame, options = {}) => {
  const {
    offset = 0,
    highlight = true,
    onSeek = null
  } = options;

  // Calculate seek time with offset
  const seekTime = Math.max(0, frame.timestamp - offset);

  // Perform the seek
  if (typeof seekTo === 'function') {
    seekTo(seekTime);
  }

  // Call onSeek callback if provided
  if (typeof onSeek === 'function') {
    onSeek(seekTime, frame, { highlight });
  }

  return seekTime;
};

/**
 * Find the segment that contains a given timestamp
 * @param {Array} segments - Array of transcript segments
 * @param {number} timestamp - Timestamp in seconds
 * @returns {Object|null} The matching segment or null
 */
export const findSegmentAtTimestamp = (segments, timestamp) => {
  if (!segments || !Array.isArray(segments)) {
    return null;
  }

  return segments.find(segment => {
    return timestamp >= segment.start && timestamp <= segment.end;
  });
};

/**
 * Find the index of the segment that contains a given timestamp
 * @param {Array} segments - Array of transcript segments
 * @param {number} timestamp - Timestamp in seconds
 * @returns {number} The segment index or -1 if not found
 */
export const findSegmentIndexAtTimestamp = (segments, timestamp) => {
  if (!segments || !Array.isArray(segments)) {
    return -1;
  }

  return segments.findIndex(segment => {
    return timestamp >= segment.start && timestamp <= segment.end;
  });
};

/**
 * Scroll to a specific segment in the transcript
 * @param {number} segmentIndex - Index of the segment to scroll to
 * @param {Object} options - Scroll options
 * @param {string} options.behavior - Scroll behavior ('smooth' or 'auto')
 * @param {string} options.block - Vertical alignment ('start', 'center', 'end', 'nearest')
 */
export const scrollToSegment = (segmentIndex, options = {}) => {
  const {
    behavior = 'smooth',
    block = 'center'
  } = options;

  // Find the segment element by index
  const segmentElement = document.querySelector(
    `[data-segment-index="${segmentIndex}"]`
  );

  if (segmentElement) {
    segmentElement.scrollIntoView({
      behavior,
      block,
      inline: 'nearest'
    });
  }
};
