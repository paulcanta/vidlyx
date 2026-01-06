/**
 * Frame Analysis Service
 * Provides interface for frame analysis with support for multiple providers
 * Currently: Manual mode (user describes frames)
 * Future: Gemini Vision API, Anthropic Claude Vision
 */

const PROVIDERS = {
  MANUAL: 'manual',
  GEMINI: 'gemini',
  ANTHROPIC: 'anthropic'
};

// Current provider - manual for testing, will be configurable
let currentProvider = PROVIDERS.MANUAL;

/**
 * Frame Analysis Service
 */
const frameAnalysisService = {
  /**
   * Get current provider
   */
  getProvider() {
    return currentProvider;
  },

  /**
   * Set provider (for future use)
   */
  setProvider(provider) {
    if (Object.values(PROVIDERS).includes(provider)) {
      currentProvider = provider;
    }
  },

  /**
   * Analyze a frame
   * @param {Object} frameData - Frame data including image URL
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeFrame(frameData, options = {}) {
    switch (currentProvider) {
      case PROVIDERS.MANUAL:
        return this.manualAnalysis(frameData, options);
      case PROVIDERS.GEMINI:
        return this.geminiAnalysis(frameData, options);
      case PROVIDERS.ANTHROPIC:
        return this.anthropicAnalysis(frameData, options);
      default:
        return this.manualAnalysis(frameData, options);
    }
  },

  /**
   * Manual analysis - no AI, user provides description
   * OCR would be handled server-side with Tesseract.js
   */
  manualAnalysis(frameData, options = {}) {
    return {
      provider: PROVIDERS.MANUAL,
      ocrText: frameData.ocrText || null,
      userDescription: frameData.description || null,
      autoAnalysis: null,
      timestamp: frameData.timestamp,
      analyzed: true,
      analyzedAt: new Date().toISOString()
    };
  },

  /**
   * Gemini Vision API analysis (placeholder for future)
   */
  async geminiAnalysis(frameData, options = {}) {
    // TODO: Implement Gemini Vision API integration
    // This will call the backend which then calls Gemini API
    console.log('Gemini analysis not yet implemented');
    return {
      provider: PROVIDERS.GEMINI,
      ocrText: null,
      userDescription: null,
      autoAnalysis: null,
      error: 'Gemini analysis not yet implemented',
      timestamp: frameData.timestamp,
      analyzed: false
    };
  },

  /**
   * Anthropic Claude Vision analysis (placeholder for future)
   */
  async anthropicAnalysis(frameData, options = {}) {
    // TODO: Implement Anthropic Claude Vision integration
    console.log('Anthropic analysis not yet implemented');
    return {
      provider: PROVIDERS.ANTHROPIC,
      ocrText: null,
      userDescription: null,
      autoAnalysis: null,
      error: 'Anthropic analysis not yet implemented',
      timestamp: frameData.timestamp,
      analyzed: false
    };
  },

  /**
   * Get linked transcript segments for a timestamp
   * @param {Array} segments - All transcript segments
   * @param {number} timestamp - Frame timestamp in seconds
   * @param {number} range - Range in seconds (default ±15s)
   * @returns {Array} Linked segments
   */
  getLinkedTranscript(segments, timestamp, range = 15) {
    if (!segments || !segments.length) return [];

    return segments.filter(segment => {
      const segmentTime = segment.start_time || segment.timestamp || 0;
      return Math.abs(segmentTime - timestamp) <= range;
    }).sort((a, b) => {
      const timeA = a.start_time || a.timestamp || 0;
      const timeB = b.start_time || b.timestamp || 0;
      return timeA - timeB;
    });
  },

  /**
   * Calculate relevance score between frame and transcript segment
   */
  calculateRelevance(frameTimestamp, segmentTimestamp, maxRange = 15) {
    const diff = Math.abs(frameTimestamp - segmentTimestamp);
    if (diff > maxRange) return 0;
    // Linear decay: 1.0 at same time, 0 at maxRange
    return 1 - (diff / maxRange);
  }
};

export default frameAnalysisService;
export { PROVIDERS };
