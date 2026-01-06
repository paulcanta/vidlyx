import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { homeService } from '../../services/homeService';
import {
  VideoCamera,
  Folder,
  Plus,
  Clock,
  Play,
  BookmarkSimple,
  Lightning,
  Sparkle,
  ArrowRight,
  CircleNotch,
  CheckCircle,
  Tag,
  Image,
  TextT,
  TrendUp,
  CaretRight
} from '@phosphor-icons/react';
import './Home.css';

// Format duration from seconds
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format large numbers
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Format total watch time
function formatWatchTime(seconds) {
  if (!seconds) return '0 min';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins} min`;
}

// Status badge component
function StatusBadge({ status }) {
  const statusConfig = {
    completed: { label: 'Analyzed', color: '#059669', bg: '#d1fae5' },
    processing: { label: 'Processing', color: '#d97706', bg: '#fef3c7' },
    pending: { label: 'Pending', color: '#6b7280', bg: '#f3f4f6' },
    failed: { label: 'Failed', color: '#dc2626', bg: '#fee2e2' }
  };
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className="status-badge"
      style={{ '--status-color': config.color, '--status-bg': config.bg }}
    >
      {status === 'processing' && <CircleNotch size={12} className="spinning" />}
      {status === 'completed' && <CheckCircle size={12} weight="fill" />}
      {config.label}
    </span>
  );
}

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [recentSaves, setRecentSaves] = useState([]);
  const [folders, setFolders] = useState([]);
  const [processing, setProcessing] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all home data
  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [
          statsRes,
          videosRes,
          savesRes,
          foldersRes,
          processingRes,
          insightsRes
        ] = await Promise.all([
          homeService.getStats(),
          homeService.getRecentVideos(6),
          homeService.getRecentSaves(4),
          homeService.getFolders(),
          homeService.getProcessingVideos(),
          homeService.getInsights(4)
        ]);

        setStats(statsRes.data);
        setRecentVideos(videosRes.data);
        setRecentSaves(savesRes.data);
        setFolders(foldersRes.data);
        setProcessing(processingRes.data);
        setInsights(insightsRes.data);
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const firstName = user?.firstName || user?.email?.split('@')[0] || 'there';

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="home-loading">
        <CircleNotch size={40} className="spinning" />
        <p>Loading your content...</p>
      </div>
    );
  }

  const hasContent = stats?.videos > 0;

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>{getGreeting()}, {firstName}!</h1>
          <p>
            {hasContent
              ? 'Here\'s what\'s happening with your video analysis'
              : 'Start analyzing videos to unlock powerful insights'}
          </p>
        </div>

        <button className="primary-cta" onClick={() => navigate('/app/new')}>
          <Plus size={20} weight="bold" />
          Analyze New Video
        </button>
      </section>

      {/* Stats Cards */}
      {hasContent && (
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon videos">
                <VideoCamera size={24} weight="duotone" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{formatNumber(stats.videos)}</span>
                <span className="stat-label">Videos Analyzed</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon time">
                <Clock size={24} weight="duotone" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{formatWatchTime(stats.totalDuration)}</span>
                <span className="stat-label">Total Content</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon saves">
                <BookmarkSimple size={24} weight="duotone" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{formatNumber(stats.saves)}</span>
                <span className="stat-label">Saves Created</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon frames">
                <Image size={24} weight="duotone" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{formatNumber(stats.framesAnalyzed)}</span>
                <span className="stat-label">Frames Analyzed</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Processing Queue */}
      {processing.length > 0 && (
        <section className="processing-section">
          <div className="section-header">
            <h2>
              <Lightning size={20} weight="fill" className="icon-processing" />
              Currently Processing
            </h2>
          </div>
          <div className="processing-list">
            {processing.map(video => (
              <div key={video.id} className="processing-item">
                <img
                  src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                  alt={video.title}
                  className="processing-thumb"
                />
                <div className="processing-info">
                  <span className="processing-title">{video.title}</span>
                  <div className="processing-progress">
                    <div
                      className="progress-fill"
                      style={{ width: `${video.progress || 10}%` }}
                    />
                  </div>
                  <span className="processing-status">
                    {video.job_type || 'Analyzing'}... {video.progress || 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <div className="home-grid">
        {/* Recent Videos */}
        <section className="recent-videos-section">
          <div className="section-header">
            <h2>
              <VideoCamera size={20} weight="duotone" />
              Recent Videos
            </h2>
            {recentVideos.length > 0 && (
              <Link to="/app/videos" className="see-all">
                View all <CaretRight size={14} />
              </Link>
            )}
          </div>

          {recentVideos.length === 0 ? (
            <div className="empty-state">
              <VideoCamera size={48} weight="duotone" />
              <h3>No videos yet</h3>
              <p>Analyze your first video to see it here</p>
              <button className="empty-cta" onClick={() => navigate('/app/new')}>
                <Plus size={18} />
                Add Video
              </button>
            </div>
          ) : (
            <div className="videos-grid">
              {recentVideos.map(video => (
                <Link
                  key={video.id}
                  to={`/app/video/${video.id}`}
                  className="video-card"
                >
                  <div className="video-thumb-container">
                    <img
                      src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                      alt={video.title}
                      className="video-thumb"
                    />
                    <span className="video-duration">{formatDuration(video.duration)}</span>
                    <div className="video-overlay">
                      <Play size={32} weight="fill" />
                    </div>
                  </div>
                  <div className="video-info">
                    <h4 className="video-title">{video.title}</h4>
                    <span className="video-channel">{video.channel_name}</span>
                    <div className="video-meta">
                      <StatusBadge status={video.analysis_status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Sidebar Content */}
        <aside className="home-sidebar">
          {/* Recent Saves */}
          <section className="saves-section">
            <div className="section-header">
              <h2>
                <BookmarkSimple size={18} weight="duotone" />
                Recent Saves
              </h2>
              {recentSaves.length > 0 && (
                <Link to="/app/collection" className="see-all">
                  View all <CaretRight size={14} />
                </Link>
              )}
            </div>

            {recentSaves.length === 0 ? (
              <div className="empty-state small">
                <BookmarkSimple size={32} weight="duotone" />
                <p>Save moments from your videos</p>
              </div>
            ) : (
              <div className="saves-list">
                {recentSaves.map(save => (
                  <Link
                    key={save.id}
                    to={`/app/collection/save/${save.id}`}
                    className="save-item"
                  >
                    <img
                      src={save.thumbnail_url || `https://img.youtube.com/vi/${save.youtube_id}/default.jpg`}
                      alt=""
                      className="save-thumb"
                    />
                    <div className="save-info">
                      <span className="save-title">{save.title || 'Untitled Save'}</span>
                      <span className="save-video">{save.video_title}</span>
                      <div className="save-meta">
                        {save.frame_count > 0 && (
                          <span><Image size={11} /> {save.frame_count}</span>
                        )}
                        {save.transcript_count > 0 && (
                          <span><TextT size={11} /> {save.transcript_count}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Folders */}
          {folders.length > 0 && (
            <section className="folders-section">
              <div className="section-header">
                <h2>
                  <Folder size={18} weight="duotone" />
                  Your Folders
                </h2>
              </div>
              <div className="folders-list">
                {folders.map(folder => (
                  <Link
                    key={folder.id}
                    to={`/app/collection?folder=${folder.id}`}
                    className="folder-item"
                    style={{ '--folder-color': folder.color || '#6366f1' }}
                  >
                    <Folder size={18} weight="fill" className="folder-icon" />
                    <span className="folder-name">{folder.name}</span>
                    <span className="folder-count">{folder.save_count}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <section className="insights-section">
              <div className="section-header">
                <h2>
                  <Sparkle size={18} weight="duotone" />
                  Recent Insights
                </h2>
              </div>
              <div className="insights-list">
                {insights.map((insight, idx) => (
                  <Link
                    key={idx}
                    to={`/app/video/${insight.videoId}`}
                    className="insight-item"
                  >
                    <TrendUp size={16} className="insight-icon" />
                    <div className="insight-content">
                      <p className="insight-text">{insight.text}</p>
                      <span className="insight-source">From: {insight.videoTitle}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      {/* Quick Actions for empty state */}
      {!hasContent && (
        <section className="quick-start-section">
          <h2>Get Started</h2>
          <div className="quick-start-grid">
            <button className="quick-start-card" onClick={() => navigate('/app/new')}>
              <div className="qs-icon primary">
                <VideoCamera size={32} weight="duotone" />
              </div>
              <h3>Analyze a Video</h3>
              <p>Paste a YouTube URL to extract insights, transcripts, and key moments</p>
              <span className="qs-action">
                Get started <ArrowRight size={16} />
              </span>
            </button>

            <button className="quick-start-card" onClick={() => navigate('/app/collection')}>
              <div className="qs-icon secondary">
                <Folder size={32} weight="duotone" />
              </div>
              <h3>Organize Content</h3>
              <p>Create folders and tags to keep your saved moments organized</p>
              <span className="qs-action">
                Browse collection <ArrowRight size={16} />
              </span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;
