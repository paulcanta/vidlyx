/**
 * Analysis Configuration
 * Default configuration for frame extraction, OCR, and vision analysis
 */

module.exports = {
  // Frame Extraction Configuration
  frameExtraction: {
    // Default interval between frames in seconds
    defaultInterval: 5,

    // Maximum number of frames to extract
    maxFrames: 200,

    // Frame quality (JPEG quality: 1-31, lower is better quality)
    quality: 2,

    // Output width in pixels (height is auto-calculated)
    width: 1280,

    // Start time in seconds
    startTime: 0
  },

  // OCR Configuration
  ocr: {
    // Whether OCR is enabled by default
    enabled: true,

    // Minimum confidence threshold (0-100)
    minConfidence: 60,

    // Language for OCR (Tesseract language code)
    language: 'eng',

    // Number of worker threads for parallel processing
    workerCount: 2
  },

  // Vision Analysis Configuration
  vision: {
    // Whether vision analysis is enabled by default
    enabled: true,

    // Sample rate: analyze every Nth frame (to reduce API calls)
    // For example: 3 means analyze every 3rd frame
    sampleRate: 3,

    // Maximum frames to analyze per video
    maxFrames: 40,

    // Daily API limit for Gemini free tier
    dailyLimit: 1500,

    // Model to use for vision analysis
    model: 'gemini-1.5-flash',

    // Retry configuration
    maxRetries: 3,
    retryDelay: 2000, // milliseconds

    // Rate limiting (delay between API calls in milliseconds)
    rateLimitDelay: 100
  },

  // Pipeline Configuration
  pipeline: {
    // Pipeline steps and their progress ranges
    steps: {
      EXTRACT: { start: 0, end: 30, label: 'Extracting frames' },
      OCR: { start: 30, end: 60, label: 'Processing OCR' },
      VISION: { start: 60, end: 95, label: 'Running vision analysis' },
      POST_PROCESS: { start: 95, end: 98, label: 'Post-processing' },
      COMPLETE: { start: 98, end: 100, label: 'Complete' }
    },

    // Default options for pipeline
    defaultOptions: {
      frameInterval: 5,
      maxFrames: 200,
      ocrEnabled: true,
      visionEnabled: true,
      visionSampleRate: 3
    },

    // Video status transitions
    statusTransitions: {
      start: 'analyzing_frames',
      success: 'frames_analyzed',
      failure: 'frame_analysis_failed'
    }
  },

  // Keyframe Detection Configuration
  keyframe: {
    // Detect keyframes based on content type changes
    detectOnContentTypeChange: true,

    // Detect keyframes based on significant OCR text changes
    detectOnTextChange: true,

    // Minimum text similarity to consider as "same content" (0-1)
    textSimilarityThreshold: 0.7,

    // Content types that are considered important for keyframe detection
    importantContentTypes: [
      'code',
      'diagram',
      'chart',
      'presentation_slide',
      'title_screen'
    ]
  }
};
