import React, { useState, useRef, useEffect } from 'react';
import { X, CircleNotch } from '@phosphor-icons/react';

/**
 * VideoInput Component
 * Large input field for YouTube URLs with validation
 */
function VideoInput({ onSubmit, disabled = false }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const inputRef = useRef(null);

  // YouTube URL patterns for validation
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
  ];

  /**
   * Validate YouTube URL format
   */
  const validateUrl = (urlString) => {
    if (!urlString || !urlString.trim()) {
      return { valid: false, error: '' };
    }

    const trimmedUrl = urlString.trim();
    const isValid = youtubePatterns.some(pattern => pattern.test(trimmedUrl));

    if (!isValid) {
      return {
        valid: false,
        error: 'Invalid YouTube URL. Please use a valid format.'
      };
    }

    return { valid: true, error: '' };
  };

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError('');
  };

  /**
   * Handle paste event - auto-detect valid URLs
   */
  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    const validation = validateUrl(pastedText);

    if (validation.valid) {
      setUrl(pastedText);
      setError('');
      e.preventDefault();
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    const validation = validateUrl(url);

    if (!validation.valid) {
      setError(validation.error || 'Please enter a YouTube URL');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      await onSubmit(url.trim());
      // Clear input on success
      setUrl('');
    } catch (err) {
      setError(err.message || 'Failed to process video URL');
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /**
   * Clear input
   */
  const handleClear = () => {
    setUrl('');
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div className="video-input-container">
      <form onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={handleChange}
            onPaste={handlePaste}
            onKeyPress={handleKeyPress}
            placeholder="Paste a YouTube URL to analyze..."
            disabled={disabled || isValidating}
            className={`video-input ${error ? 'error' : ''}`}
            autoFocus
          />
          {url && !isValidating && (
            <button
              type="button"
              onClick={handleClear}
              className="clear-button"
              aria-label="Clear input"
            >
              <X size={20} weight="bold" />
            </button>
          )}
          {isValidating && (
            <div className="loading-indicator">
              <CircleNotch size={20} weight="bold" className="spinning" />
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!url.trim() || disabled || isValidating}
          className="analyze-button"
        >
          {isValidating ? 'Validating...' : 'Analyze Video'}
        </button>
      </form>

      <style>{`
        .video-input-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }

        .input-wrapper {
          position: relative;
          margin-bottom: 1rem;
        }

        .video-input {
          width: 100%;
          padding: 1.25rem 3rem 1.25rem 1.25rem;
          font-size: 1.125rem;
          border: 2px solid #d1d5db;
          border-radius: 12px;
          outline: none;
          transition: all 0.2s;
          font-family: inherit;
          background: white;
        }

        .video-input:focus {
          border-color: #1a73e8;
          box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.1);
        }

        .video-input.error {
          border-color: #dc2626;
        }

        .video-input.error:focus {
          box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
        }

        .video-input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .clear-button {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .clear-button:hover {
          color: #374151;
          background-color: #f3f4f6;
        }

        .loading-indicator {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #1a73e8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .error-message {
          color: #dc2626;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          padding: 0.5rem 0.75rem;
          background-color: #fef2f2;
          border-radius: 6px;
          border-left: 3px solid #dc2626;
        }

        .analyze-button {
          width: 100%;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          background-color: #1a73e8;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .analyze-button:hover:not(:disabled) {
          background-color: #1557b0;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
        }

        .analyze-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .analyze-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

export default VideoInput;
