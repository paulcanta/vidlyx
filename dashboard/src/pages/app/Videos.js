import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Trash,
  Clock,
  CalendarBlank,
  User,
  Eye,
  CircleNotch,
  MagnifyingGlass,
  SortAscending,
  SortDescending,
  Video as VideoIcon,
  ArrowSquareOut
} from '@phosphor-icons/react';
import { videoService } from '../../services/videoService';
import { useToast } from '../../contexts/ToastContext';
import './Videos.css';

/**
 * Videos Page
 * Displays all analyzed videos with thumbnails and metadata
 */
function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('DESC');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();
  const LIMIT = 12;

  // Fetch videos
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await videoService.getAll({
        limit: LIMIT,
        offset: page * LIMIT,
        orderBy: sortBy,
        orderDir: sortDir
      });
      setVideos(response.data.videos || []);
      setTotal(response.data.total || 0);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
      setError('Failed to load videos');
      showToast('Failed to load videos', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortDir, showToast]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format views
  const formatViews = (views) => {
    if (!views) return null;
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'processing':
      case 'metadata_complete':
      case 'transcript_complete':
      case 'extracting_frames':
        return 'status-processing';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-pending';
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Ready';
      case 'processing':
        return 'Processing';
      case 'metadata_complete':
        return 'Fetching Transcript';
      case 'transcript_complete':
        return 'Transcript Ready';
      case 'extracting_frames':
        return 'Extracting Frames';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  // Handle video click
  const handleVideoClick = (video) => {
    navigate(`/app/video/${video.id}`);
  };

  // Handle delete
  const handleDelete = async (videoId) => {
    try {
      setDeleting(true);
      await videoService.delete(videoId);
      showToast('Video deleted successfully', 'success');
      setDeleteConfirm(null);
      fetchVideos();
    } catch (err) {
      console.error('Failed to delete video:', err);
      showToast('Failed to delete video', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Filter videos by search
  const filteredVideos = videos.filter(video => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      video.title?.toLowerCase().includes(query) ||
      video.channel_name?.toLowerCase().includes(query) ||
      video.description?.toLowerCase().includes(query)
    );
  });

  // Toggle sort direction
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'DESC' ? 'ASC' : 'DESC');
    } else {
      setSortBy(field);
      setSortDir('DESC');
    }
    setPage(0);
  };

  // Loading state
  if (loading && videos.length === 0) {
    return (
      <div className="videos-page">
        <div className="videos-loading">
          <CircleNotch size={48} weight="bold" className="spinning" />
          <p>Loading videos...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && videos.length === 0) {
    return (
      <div className="videos-page">
        <div className="videos-error">
          <VideoIcon size={48} weight="duotone" />
          <h2>Failed to load videos</h2>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchVideos}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="videos-page">
      {/* Header */}
      <div className="videos-header">
        <div className="header-title">
          <VideoIcon size={28} weight="duotone" />
          <h1>My Videos</h1>
          <span className="video-count">{total} video{total !== 1 ? 's' : ''}</span>
        </div>

        <div className="header-actions">
          {/* Search */}
          <div className="search-box">
            <MagnifyingGlass size={18} />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Sort */}
          <div className="sort-controls">
            <button
              className={`sort-btn ${sortBy === 'created_at' ? 'active' : ''}`}
              onClick={() => toggleSort('created_at')}
            >
              Date Added
              {sortBy === 'created_at' && (
                sortDir === 'DESC' ? <SortDescending size={16} /> : <SortAscending size={16} />
              )}
            </button>
            <button
              className={`sort-btn ${sortBy === 'title' ? 'active' : ''}`}
              onClick={() => toggleSort('title')}
            >
              Title
              {sortBy === 'title' && (
                sortDir === 'DESC' ? <SortDescending size={16} /> : <SortAscending size={16} />
              )}
            </button>
          </div>

          {/* Add Video Button */}
          <button
            className="add-video-btn"
            onClick={() => navigate('/app/new')}
          >
            + Add Video
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filteredVideos.length === 0 && !loading && (
        <div className="videos-empty">
          <VideoIcon size={64} weight="duotone" />
          <h2>{searchQuery ? 'No videos found' : 'No videos yet'}</h2>
          <p>
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Add your first video to start analyzing'}
          </p>
          {!searchQuery && (
            <button
              className="add-video-btn-large"
              onClick={() => navigate('/app/new')}
            >
              + Add Your First Video
            </button>
          )}
        </div>
      )}

      {/* Video Grid */}
      <div className="videos-grid">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="video-card"
            onClick={() => handleVideoClick(video)}
          >
            {/* Thumbnail */}
            <div className="video-thumbnail">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title || 'Video thumbnail'}
                  loading="lazy"
                />
              ) : (
                <div className="thumbnail-placeholder">
                  <VideoIcon size={48} weight="duotone" />
                </div>
              )}

              {/* Duration Badge */}
              {video.duration && (
                <span className="duration-badge">
                  {formatDuration(video.duration)}
                </span>
              )}

              {/* Play Overlay */}
              <div className="play-overlay">
                <Play size={48} weight="fill" />
              </div>

              {/* Status Badge */}
              <span className={`status-badge ${getStatusColor(video.analysis_status)}`}>
                {getStatusLabel(video.analysis_status)}
              </span>
            </div>

            {/* Video Info */}
            <div className="video-info">
              <h3 className="video-title">{video.title || 'Untitled Video'}</h3>

              <div className="video-meta">
                {video.channel_name && (
                  <span className="meta-item channel">
                    <User size={14} weight="fill" />
                    {video.channel_name}
                  </span>
                )}

                {video.view_count && (
                  <span className="meta-item views">
                    <Eye size={14} />
                    {formatViews(video.view_count)}
                  </span>
                )}
              </div>

              <div className="video-meta secondary">
                {video.published_at && (
                  <span className="meta-item">
                    <CalendarBlank size={14} />
                    {formatDate(video.published_at)}
                  </span>
                )}

                <span className="meta-item">
                  <Clock size={14} />
                  Added {formatDate(video.created_at)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="video-actions" onClick={(e) => e.stopPropagation()}>
              <a
                href={video.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="action-btn"
                title="Open on YouTube"
              >
                <ArrowSquareOut size={18} />
              </a>
              <button
                className="action-btn delete"
                title="Delete video"
                onClick={() => setDeleteConfirm(video.id)}
              >
                <Trash size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </button>
          <span className="page-info">
            Page {page + 1} of {Math.ceil(total / LIMIT)}
          </span>
          <button
            className="page-btn"
            disabled={(page + 1) * LIMIT >= total}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Video?</h3>
            <p>This will permanently delete the video and all associated data. This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <CircleNotch size={16} className="spinning" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Videos;
