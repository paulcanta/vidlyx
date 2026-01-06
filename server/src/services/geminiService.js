/**
 * Gemini Vision API Service
 * Handles frame analysis using Google's Gemini 1.5 Flash model
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    this.initialized = false;
    this.rateLimitDelay = 4000; // 4 seconds for 15 RPM free tier
    this.lastCallTime = 0;
  }

  /**
   * Initialize Gemini API
   */
  initialize() {
    if (this.initialized) {
      return;
    }

    if (!this.apiKey || this.apiKey === 'your-gemini-api-key') {
      throw new Error('GEMINI_API_KEY not configured in environment variables');
    }

    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    this.initialized = true;
    console.log('Gemini Vision API initialized successfully (model: gemini-2.0-flash)');
  }

  /**
   * Wait for rate limit delay
   */
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    if (timeSinceLastCall < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastCallTime = Date.now();
  }

  /**
   * Convert image file to base64 data
   */
  async imageToGenerativePart(imagePath) {
    try {
      const imageData = await fs.readFile(imagePath);
      const base64Data = imageData.toString('base64');
      const ext = path.extname(imagePath).toLowerCase();

      let mimeType = 'image/jpeg';
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.webp') mimeType = 'image/webp';

      return {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };
    } catch (error) {
      throw new Error(`Failed to read image file: ${error.message}`);
    }
  }

  /**
   * Analyze a single frame using Gemini Vision API
   * @param {string} framePath - Path to the frame image file
   * @returns {Object} Analysis results
   */
  async analyzeFrame(framePath) {
    this.initialize();

    try {
      // Wait for rate limit
      await this.waitForRateLimit();

      // Check if file exists
      try {
        await fs.access(framePath);
      } catch (error) {
        throw new Error(`Frame file not found: ${framePath}`);
      }

      // Convert image to format Gemini can process
      const imagePart = await this.imageToGenerativePart(framePath);

      // Prompt for comprehensive frame analysis
      const prompt = `Analyze this video frame and provide a detailed JSON response with the following structure:
{
  "scene_description": "A brief description of the overall scene (1-2 sentences)",
  "visual_elements": {
    "objects": ["list of visible objects"],
    "people": ["description of people if any"],
    "text_elements": ["any visible text or UI elements"],
    "colors": ["dominant colors"],
    "composition": "brief description of visual composition"
  },
  "on_screen_text": "Any readable text visible in the frame",
  "content_type": "category of content (e.g., 'tutorial', 'presentation', 'gaming', 'vlog', 'documentary', 'entertainment', 'educational', 'commercial', 'news', 'other')"
}

Provide ONLY the JSON response, no additional text.`;

      // Call Gemini API
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      let analysis;
      try {
        // Remove markdown code blocks if present
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        analysis = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('Failed to parse Gemini response as JSON');
      }

      // Validate response structure
      if (!analysis.scene_description || !analysis.visual_elements || !analysis.content_type) {
        throw new Error('Invalid response structure from Gemini API');
      }

      return {
        scene_description: analysis.scene_description,
        visual_elements: analysis.visual_elements,
        on_screen_text: analysis.on_screen_text || '',
        content_type: analysis.content_type,
        raw_analysis: analysis
      };

    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Frame analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze multiple frames in batch with rate limiting
   * @param {Array<string>} framePaths - Array of frame paths
   * @param {Function} progressCallback - Optional progress callback
   * @returns {Array<Object>} Array of analysis results
   */
  async analyzeFramesBatch(framePaths, progressCallback = null) {
    this.initialize();

    const results = [];
    const total = framePaths.length;

    for (let i = 0; i < total; i++) {
      const framePath = framePaths[i];

      try {
        const analysis = await this.analyzeFrame(framePath);
        results.push({
          framePath,
          success: true,
          analysis
        });

        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total,
            percentage: Math.round(((i + 1) / total) * 100),
            framePath
          });
        }

      } catch (error) {
        console.error(`Failed to analyze frame ${framePath}:`, error.message);
        results.push({
          framePath,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Check API quota and service status
   * @returns {Object} Quota information
   */
  checkQuota() {
    return {
      service: 'Gemini 1.5 Flash',
      tier: 'Free',
      limits: {
        rpm: 15, // Requests per minute
        rpd: 1500, // Requests per day
        rateLimit: '15 RPM',
        dailyLimit: '1500 RPD'
      },
      rateLimitDelay: `${this.rateLimitDelay / 1000} seconds`,
      configured: this.apiKey && this.apiKey !== 'your-gemini-api-key',
      initialized: this.initialized
    };
  }

  /**
   * Test API connection
   */
  async testConnection() {
    this.initialize();

    try {
      // Create a simple test with text only
      const result = await this.model.generateContent('Say "test successful" in JSON format: {"status": "test successful"}');
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        message: 'Gemini API connection successful',
        response: text
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gemini API connection failed',
        error: error.message
      };
    }
  }

  /**
   * Generate text response using Gemini (text-only, no vision)
   * @param {string} prompt - The text prompt to send to Gemini
   * @returns {string} Generated text response
   */
  async generateText(prompt) {
    this.initialize();

    try {
      // Wait for rate limit
      await this.waitForRateLimit();

      // Call Gemini API with text-only prompt
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text;

    } catch (error) {
      console.error('Gemini text generation error:', error);
      throw new Error(`Text generation failed: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new GeminiService();
