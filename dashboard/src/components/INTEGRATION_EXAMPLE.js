/**
 * INTEGRATION EXAMPLE
 *
 * This file demonstrates how to integrate all error handling and loading state components
 * in a real application. Copy and adapt this code to your own components.
 */

import React, { useState, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { ToastProvider, useToast, setGlobalToast } from './Toast';
import { Spinner, Skeleton, SkeletonCard, SkeletonText } from './Loading';
import EmptyState from './EmptyState';
import { toast } from '../utils/toast';
import { VideoCamera, Plus } from '@phosphor-icons/react';

// =============================================================================
// STEP 1: Wrap your entire app with ToastProvider and ErrorBoundary
// =============================================================================

/**
 * Initialize global toast so it can be used anywhere via import { toast } from '@/utils/toast'
 */
function ToastInitializer({ children }) {
  const { showToast } = useToast();

  useEffect(() => {
    setGlobalToast(showToast);
  }, [showToast]);

  return children;
}

/**
 * App wrapper with error handling and toast notifications
 */
export function AppWrapper({ children }) {
  return (
    <ErrorBoundary fallbackMessage="Something went wrong with the application. Please refresh the page.">
      <ToastProvider>
        <ToastInitializer>
          {children}
        </ToastInitializer>
      </ToastProvider>
    </ErrorBoundary>
  );
}

// =============================================================================
// STEP 2: Use error handling and loading states in your components
// =============================================================================

/**
 * Example component showing all states: loading, empty, error, success
 */
export function VideoListExample() {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/videos');

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      setVideos(data);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err.message);
      toast.error('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload video');
      }

      const newVideo = await response.json();
      setVideos([newVideo, ...videos]);
      toast.success('Video uploaded successfully!');
    } catch (err) {
      console.error('Error uploading video:', err);
      toast.error('Failed to upload video. Please try again.');
    }
  };

  const handleDelete = async (videoId) => {
    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      setVideos(videos.filter(v => v.id !== videoId));
      toast.success('Video deleted successfully');
    } catch (err) {
      console.error('Error deleting video:', err);
      toast.error('Failed to delete video');
    }
  };

  // Loading state - show skeleton loaders
  if (loading) {
    return (
      <div className="container">
        <div className="header">
          <h1>My Videos</h1>
          <Spinner size="medium" />
        </div>
        <div className="video-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard
              key={i}
              hasImage={true}
              imageHeight="180px"
              hasAvatar={false}
              linesCount={2}
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state - no videos
  if (!loading && videos.length === 0) {
    return (
      <div className="container">
        <EmptyState
          icon={VideoCamera}
          iconSize={64}
          iconWeight="duotone"
          title="No videos yet"
          description="Upload your first video to get started with AI-powered analysis and insights."
          action={
            <button className="btn btn-primary" onClick={() => handleUpload()}>
              <Plus size={20} weight="bold" />
              Upload Video
            </button>
          }
        />
      </div>
    );
  }

  // Success state - show videos
  return (
    <div className="container">
      <div className="header">
        <h1>My Videos ({videos.length})</h1>
        <button className="btn btn-primary" onClick={() => handleUpload()}>
          <Plus size={20} weight="bold" />
          Upload Video
        </button>
      </div>

      <div className="video-grid">
        {videos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            onDelete={() => handleDelete(video.id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Example component with inline error boundary
 */
export function FeatureWithErrorBoundary() {
  return (
    <ErrorBoundary fallbackMessage="This feature is temporarily unavailable.">
      <RiskyFeatureComponent />
    </ErrorBoundary>
  );
}

/**
 * Example of using different toast types
 */
export function ToastExamples() {
  const handleSuccess = () => {
    toast.success('Operation completed successfully!');
  };

  const handleError = () => {
    toast.error('An error occurred while processing your request.');
  };

  const handleWarning = () => {
    toast.warning('Please review your changes before saving.');
  };

  const handleInfo = () => {
    toast.info('New features are now available!');
  };

  const handleCustomDuration = () => {
    toast.success('This message will disappear in 2 seconds', 2000);
  };

  const handleNoDismiss = () => {
    toast.info('This message will not auto-dismiss', 0);
  };

  return (
    <div className="toast-examples">
      <h2>Toast Examples</h2>
      <div className="button-group">
        <button onClick={handleSuccess}>Success Toast</button>
        <button onClick={handleError}>Error Toast</button>
        <button onClick={handleWarning}>Warning Toast</button>
        <button onClick={handleInfo}>Info Toast</button>
        <button onClick={handleCustomDuration}>Custom Duration</button>
        <button onClick={handleNoDismiss}>No Auto-Dismiss</button>
      </div>
    </div>
  );
}

/**
 * Example of using different loading states
 */
export function LoadingExamples() {
  return (
    <div className="loading-examples">
      <h2>Loading State Examples</h2>

      <section>
        <h3>Spinners</h3>
        <div className="spinner-examples">
          <Spinner size="small" color="primary" />
          <Spinner size="medium" color="primary" />
          <Spinner size="large" color="primary" />
        </div>
      </section>

      <section>
        <h3>Skeletons</h3>
        <div className="skeleton-examples">
          <Skeleton width="100%" height="2rem" />
          <Skeleton width="60%" height="1.5rem" />
          <Skeleton width="40px" height="40px" variant="circular" />
        </div>
      </section>

      <section>
        <h3>Skeleton Text</h3>
        <SkeletonText lines={4} lastLineWidth="70%" />
      </section>

      <section>
        <h3>Skeleton Card</h3>
        <SkeletonCard
          hasImage={true}
          imageHeight="200px"
          hasAvatar={true}
          linesCount={3}
        />
      </section>
    </div>
  );
}

/**
 * Example of using empty states
 */
export function EmptyStateExamples() {
  return (
    <div className="empty-state-examples">
      <h2>Empty State Examples</h2>

      <section>
        <h3>Default Empty State</h3>
        <EmptyState
          icon={VideoCamera}
          title="No videos found"
          description="Upload your first video to get started."
        />
      </section>

      <section>
        <h3>With Action Button</h3>
        <EmptyState
          icon={VideoCamera}
          title="No videos found"
          description="Upload your first video to get started."
          action={
            <button className="btn btn-primary">Upload Video</button>
          }
        />
      </section>

      <section>
        <h3>Compact Variant</h3>
        <EmptyState
          icon={VideoCamera}
          title="No results"
          description="Try adjusting your filters."
          compact={true}
        />
      </section>
    </div>
  );
}

// =============================================================================
// STEP 3: Example of a complete feature with all error handling
// =============================================================================

/**
 * Complete example combining all components
 */
export function CompleteExample() {
  return (
    <AppWrapper>
      <div className="app">
        <ErrorBoundary>
          <VideoListExample />
        </ErrorBoundary>
      </div>
    </AppWrapper>
  );
}

// Dummy component for example
function VideoCard({ video, onDelete }) {
  return (
    <div className="video-card">
      <img src={video.thumbnail} alt={video.title} />
      <h3>{video.title}</h3>
      <button onClick={onDelete}>Delete</button>
    </div>
  );
}

// Dummy component for example
function RiskyFeatureComponent() {
  return <div>This component might throw an error</div>;
}
