import React, { useState } from 'react';
import { VideoCamera } from '@phosphor-icons/react';

function NewVideo() {
  const [url, setUrl] = useState('');

  return (
    <div className="page-container">
      <div className="page-header">
        <VideoCamera size={32} weight="duotone" />
        <h1>Analyze New Video</h1>
      </div>
      <div className="card">
        <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
          Enter a YouTube URL to start analyzing the video
        </p>
        <div className="form-group">
          <label htmlFor="youtube-url">YouTube URL</label>
          <input
            id="youtube-url"
            type="text"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input"
          />
        </div>
        <button
          className="button button-primary"
          disabled={!url}
          style={{ marginTop: '1rem' }}
        >
          Start Analysis
        </button>
      </div>

      <style>{`
        .page-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .input {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s;
        }

        .input:focus {
          border-color: #1a73e8;
          box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
        }

        .button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .button-primary {
          background-color: #1a73e8;
          color: white;
        }

        .button-primary:hover:not(:disabled) {
          background-color: #1557b0;
        }

        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default NewVideo;
