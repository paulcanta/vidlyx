/**
 * Claude API Service
 * Handles AI text generation using Anthropic's Claude API
 */

const Anthropic = require('@anthropic-ai/sdk');

class ClaudeService {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.client = null;
    this.initialized = false;
    this.model = 'claude-sonnet-4-20250514'; // Fast and capable
  }

  /**
   * Initialize Claude API client
   */
  initialize() {
    if (this.initialized) {
      return;
    }

    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured in environment variables');
    }

    this.client = new Anthropic({
      apiKey: this.apiKey
    });

    this.initialized = true;
    console.log(`Claude API initialized successfully (model: ${this.model})`);
  }

  /**
   * Generate text response using Claude
   * @param {string} prompt - The text prompt to send to Claude
   * @param {Function} onProgress - Optional callback for streaming progress
   * @returns {string} Generated text response
   */
  async generateText(prompt, onProgress = null) {
    this.initialize();

    try {
      if (onProgress) {
        // Use streaming for progress updates
        return await this.generateTextStreaming(prompt, onProgress);
      }

      // Non-streaming request
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // Extract text from response
      const text = message.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');

      return text;

    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Text generation failed: ${error.message}`);
    }
  }

  /**
   * Generate text with streaming for progress updates
   * @param {string} prompt - The text prompt
   * @param {Function} onProgress - Callback for each chunk
   * @returns {string} Complete generated text
   */
  async generateTextStreaming(prompt, onProgress) {
    this.initialize();

    let fullText = '';
    let chunkCount = 0;

    try {
      const stream = this.client.messages.stream({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const chunk = event.delta.text;
          fullText += chunk;
          chunkCount++;

          if (onProgress) {
            onProgress({
              type: 'chunk',
              chunk,
              chunkCount,
              totalLength: fullText.length
            });
          }
        }
      }

      if (onProgress) {
        onProgress({
          type: 'complete',
          totalChunks: chunkCount,
          totalLength: fullText.length
        });
      }

      return fullText;

    } catch (error) {
      console.error('Claude streaming error:', error);
      throw new Error(`Streaming text generation failed: ${error.message}`);
    }
  }

  /**
   * Check API configuration status
   * @returns {Object} Configuration information
   */
  checkStatus() {
    return {
      service: 'Claude API',
      model: this.model,
      configured: !!this.apiKey,
      initialized: this.initialized
    };
  }

  /**
   * Test API connection
   */
  async testConnection() {
    this.initialize();

    try {
      const result = await this.generateText('Respond with exactly: {"status": "connected"}');

      return {
        success: true,
        message: 'Claude API connection successful',
        response: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Claude API connection failed',
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new ClaudeService();
