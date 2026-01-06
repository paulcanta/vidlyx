import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoCamera, CheckCircle, XCircle } from '@phosphor-icons/react';
import VideoInput from '../../components/Video/VideoInput';
import videoService from '../../services/videoService';

function NewVideo() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle video URL submission
   */
  const handleSubmit = async (url) => {
    setError('');
    setIsSubmitting(true);

    try {
      const response = await videoService.create(url);
      const { video, existing } = response.data;

      // Navigate to video analysis page
      navigate(`/app/video/${video.id}`, {
        state: { video, existing }
      });
    } catch (err) {
      console.error('Error creating video:', err);

      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to process video. Please try again.');
      }

      throw err; // Re-throw to let VideoInput handle loading state
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <VideoCamera size={32} weight="duotone" />
        <h1>Analyze New Video</h1>
      </div>

      <div className="card">
        <div className="intro-section">
          <p className="intro-text">
            Enter a YouTube URL to start analyzing the video. We'll extract insights,
            generate summaries, and help you understand the content better.
          </p>
        </div>

        <VideoInput onSubmit={handleSubmit} disabled={isSubmitting} />

        {error && (
          <div className="error-alert">
            <XCircle size={20} weight="fill" />
            <span>{error}</span>
          </div>
        )}

        <div className="supported-formats">
          <h3>Supported URL Formats:</h3>
          <ul>
            <li>
              <CheckCircle size={18} weight="fill" />
              <code>https://www.youtube.com/watch?v=VIDEO_ID</code>
            </li>
            <li>
              <CheckCircle size={18} weight="fill" />
              <code>https://youtu.be/VIDEO_ID</code>
            </li>
            <li>
              <CheckCircle size={18} weight="fill" />
              <code>https://www.youtube.com/embed/VIDEO_ID</code>
            </li>
            <li>
              <CheckCircle size={18} weight="fill" />
              <code>https://www.youtube.com/v/VIDEO_ID</code>
            </li>
          </ul>
        </div>
      </div>

      <style>{`
        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
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
          padding: 2.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }

        .intro-section {
          margin-bottom: 2rem;
          text-align: center;
        }

        .intro-text {
          color: #6b7280;
          font-size: 1rem;
          line-height: 1.6;
          margin: 0;
          max-width: 600px;
          margin: 0 auto;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          margin-top: 1.5rem;
          font-size: 0.875rem;
        }

        .supported-formats {
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .supported-formats h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 1rem 0;
        }

        .supported-formats ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .supported-formats li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #059669;
          font-size: 0.875rem;
        }

        .supported-formats code {
          background-color: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.8125rem;
          color: #374151;
        }

        @media (max-width: 768px) {
          .page-container {
            padding: 1rem;
          }

          .card {
            padding: 1.5rem;
          }

          .page-header h1 {
            font-size: 1.5rem;
          }

          .supported-formats ul {
            gap: 0.5rem;
          }

          .supported-formats li {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

export default NewVideo;
