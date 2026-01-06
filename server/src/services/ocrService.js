/**
 * OCR Service for extracting text from video frames using Tesseract.js
 */

const Tesseract = require('tesseract.js');
const db = require('./db');
const path = require('path');
const fs = require('fs').promises;

class OCRService {
  constructor() {
    this.workers = [];
    this.workerCount = 2; // Pool of 2 workers
    this.initialized = false;
  }

  /**
   * Initialize Tesseract worker pool
   */
  async initWorkers() {
    if (this.initialized) {
      console.log('OCR workers already initialized');
      return;
    }

    console.log(`Initializing ${this.workerCount} Tesseract workers...`);

    try {
      for (let i = 0; i < this.workerCount; i++) {
        const worker = await Tesseract.createWorker('eng', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              // Only log progress for first worker to reduce noise
              if (i === 0 && m.progress) {
                console.log(`Worker ${i} OCR Progress: ${Math.round(m.progress * 100)}%`);
              }
            }
          }
        });
        this.workers.push(worker);
        console.log(`Worker ${i} initialized`);
      }

      this.initialized = true;
      console.log('All OCR workers initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR workers:', error);
      throw error;
    }
  }

  /**
   * Get an available worker (round-robin)
   */
  getWorker(index = 0) {
    if (!this.initialized || this.workers.length === 0) {
      throw new Error('OCR workers not initialized. Call initWorkers() first.');
    }
    return this.workers[index % this.workers.length];
  }

  /**
   * Extract text from a single frame image
   * @param {string} framePath - Absolute path to the frame image
   * @param {number} workerIndex - Index of worker to use (optional)
   * @returns {Object} OCR result with text, confidence, and words
   */
  async extractTextFromFrame(framePath, workerIndex = 0) {
    try {
      // Check if file exists
      await fs.access(framePath);

      const worker = this.getWorker(workerIndex);
      const { data } = await worker.recognize(framePath);

      return {
        text: data.text.trim(),
        confidence: data.confidence,
        words: data.words.map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox
        }))
      };
    } catch (error) {
      console.error(`Error extracting text from ${framePath}:`, error.message);
      return {
        text: '',
        confidence: 0,
        words: [],
        error: error.message
      };
    }
  }

  /**
   * Process all frames for a video and extract text
   * @param {string} videoId - UUID of the video
   * @param {Function} onProgress - Optional progress callback
   * @returns {Object} Processing results
   */
  async processVideoFrames(videoId, onProgress = null) {
    try {
      // Ensure workers are initialized
      if (!this.initialized) {
        await this.initWorkers();
      }

      // Get all frames for the video
      const framesResult = await db.query(
        'SELECT id, frame_path, timestamp_seconds FROM frames WHERE video_id = $1 ORDER BY timestamp_seconds ASC',
        [videoId]
      );

      const frames = framesResult.rows;

      if (frames.length === 0) {
        return {
          success: false,
          message: 'No frames found for this video',
          processed: 0,
          total: 0
        };
      }

      console.log(`Processing OCR for ${frames.length} frames from video ${videoId}`);

      let processed = 0;
      let succeeded = 0;
      let failed = 0;

      // Process frames in parallel using both workers
      const promises = frames.map(async (frame, index) => {
        try {
          const workerIndex = index % this.workerCount;
          const ocrResult = await this.extractTextFromFrame(frame.frame_path, workerIndex);

          // Update frame with OCR results
          await this.updateFrameOCR(frame.id, ocrResult);

          processed++;
          succeeded++;

          if (onProgress) {
            onProgress({
              current: processed,
              total: frames.length,
              percentage: Math.round((processed / frames.length) * 100),
              frameId: frame.id,
              timestamp: frame.timestamp_seconds
            });
          }

          return { success: true, frameId: frame.id };
        } catch (error) {
          processed++;
          failed++;
          console.error(`Failed to process frame ${frame.id}:`, error.message);
          return { success: false, frameId: frame.id, error: error.message };
        }
      });

      await Promise.all(promises);

      return {
        success: true,
        processed,
        succeeded,
        failed,
        total: frames.length
      };
    } catch (error) {
      console.error('Error processing video frames:', error);
      throw error;
    }
  }

  /**
   * Update a frame with OCR results
   * @param {string} frameId - UUID of the frame
   * @param {Object} ocrResult - OCR result object
   */
  async updateFrameOCR(frameId, ocrResult) {
    try {
      await db.query(
        `UPDATE frames
         SET on_screen_text = $1,
             ocr_confidence = $2,
             ocr_words = $3
         WHERE id = $4`,
        [
          ocrResult.text || null,
          ocrResult.confidence || null,
          ocrResult.words ? JSON.stringify(ocrResult.words) : null,
          frameId
        ]
      );
    } catch (error) {
      console.error(`Error updating frame ${frameId} with OCR results:`, error);
      throw error;
    }
  }

  /**
   * Search frames by OCR text
   * @param {string} videoId - UUID of the video
   * @param {string} searchText - Text to search for
   * @returns {Array} Array of matching frames
   */
  async searchFramesByText(videoId, searchText) {
    try {
      const result = await db.query(
        `SELECT
           id,
           video_id,
           timestamp_seconds,
           frame_path,
           thumbnail_path,
           on_screen_text,
           ocr_confidence,
           ocr_words,
           is_keyframe,
           created_at,
           similarity(on_screen_text, $2) as text_similarity
         FROM frames
         WHERE video_id = $1
           AND on_screen_text IS NOT NULL
           AND on_screen_text ILIKE $3
         ORDER BY text_similarity DESC, timestamp_seconds ASC
         LIMIT 100`,
        [videoId, searchText, `%${searchText}%`]
      );

      return result.rows;
    } catch (error) {
      // If pg_trgm extension is not available, fall back to basic search
      console.warn('Full-text search failed, using basic ILIKE search:', error.message);

      const result = await db.query(
        `SELECT
           id,
           video_id,
           timestamp_seconds,
           frame_path,
           thumbnail_path,
           on_screen_text,
           ocr_confidence,
           ocr_words,
           is_keyframe,
           created_at
         FROM frames
         WHERE video_id = $1
           AND on_screen_text IS NOT NULL
           AND on_screen_text ILIKE $2
         ORDER BY timestamp_seconds ASC
         LIMIT 100`,
        [videoId, `%${searchText}%`]
      );

      return result.rows;
    }
  }

  /**
   * Get frames with OCR text for a video
   * @param {string} videoId - UUID of the video
   * @param {Object} options - Query options
   * @returns {Object} Frames with pagination
   */
  async getFramesWithOCR(videoId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      minConfidence = 0,
      onlyWithText = false
    } = options;

    try {
      let whereClause = 'WHERE video_id = $1';
      const params = [videoId];
      let paramCount = 1;

      if (onlyWithText) {
        whereClause += ` AND on_screen_text IS NOT NULL AND on_screen_text != ''`;
      }

      if (minConfidence > 0) {
        paramCount++;
        whereClause += ` AND ocr_confidence >= $${paramCount}`;
        params.push(minConfidence);
      }

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM frames ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].total);

      // Get frames
      paramCount++;
      const limitParam = paramCount;
      paramCount++;
      const offsetParam = paramCount;

      const result = await db.query(
        `SELECT
           id,
           video_id,
           timestamp_seconds,
           frame_path,
           thumbnail_path,
           on_screen_text,
           ocr_confidence,
           ocr_words,
           is_keyframe,
           created_at
         FROM frames
         ${whereClause}
         ORDER BY timestamp_seconds ASC
         LIMIT $${limitParam} OFFSET $${offsetParam}`,
        [...params, limit, offset]
      );

      return {
        frames: result.rows,
        total,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error getting frames with OCR:', error);
      throw error;
    }
  }

  /**
   * Terminate all workers and cleanup
   */
  async terminateWorkers() {
    if (!this.initialized) {
      console.log('No workers to terminate');
      return;
    }

    console.log('Terminating OCR workers...');

    try {
      await Promise.all(this.workers.map(worker => worker.terminate()));
      this.workers = [];
      this.initialized = false;
      console.log('All OCR workers terminated');
    } catch (error) {
      console.error('Error terminating workers:', error);
      throw error;
    }
  }
}

// Export singleton instance
const ocrService = new OCRService();

module.exports = ocrService;
