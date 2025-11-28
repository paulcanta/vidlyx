import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { VideoCamera, Folder, ChartBar } from '@phosphor-icons/react';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="welcome-section">
        <h1>Welcome back, {user?.firstName || 'User'}!</h1>
        <p>Start analyzing videos or explore your collection</p>
      </div>

      <div className="quick-actions">
        <button
          className="action-card"
          onClick={() => navigate('/app/new')}
        >
          <div className="action-icon primary">
            <VideoCamera size={32} weight="duotone" />
          </div>
          <h3>Analyze New Video</h3>
          <p>Upload or paste a YouTube URL to get started</p>
        </button>

        <button
          className="action-card"
          onClick={() => navigate('/app/collection')}
        >
          <div className="action-icon secondary">
            <Folder size={32} weight="duotone" />
          </div>
          <h3>View Collection</h3>
          <p>Browse your analyzed videos and insights</p>
        </button>
      </div>

      <div className="stats-section">
        <h2>Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <VideoCamera size={24} weight="duotone" />
            </div>
            <div className="stat-content">
              <div className="stat-value">0</div>
              <div className="stat-label">Videos Analyzed</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <ChartBar size={24} weight="duotone" />
            </div>
            <div className="stat-content">
              <div className="stat-value">0</div>
              <div className="stat-label">Total Insights</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Folder size={24} weight="duotone" />
            </div>
            <div className="stat-content">
              <div className="stat-value">0</div>
              <div className="stat-label">Collections</div>
            </div>
          </div>
        </div>
      </div>

      <div className="recent-section">
        <h2>Recent Videos</h2>
        <div className="card">
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem 0' }}>
            No recent videos. Start analyzing to see your history here.
          </p>
        </div>
      </div>

      <style>{`
        .page-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .welcome-section {
          margin-bottom: 3rem;
        }

        .welcome-section h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }

        .welcome-section p {
          font-size: 1.125rem;
          color: #6b7280;
          margin: 0;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .action-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 2rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .action-card:hover {
          border-color: #1a73e8;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }

        .action-icon {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .action-icon.primary {
          background-color: #eff6ff;
          color: #1a73e8;
        }

        .action-icon.secondary {
          background-color: #f0fdf4;
          color: #16a34a;
        }

        .action-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }

        .action-card p {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .stats-section,
        .recent-section {
          margin-bottom: 3rem;
        }

        .stats-section h2,
        .recent-section h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1.5rem 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background-color: #eff6ff;
          color: #1a73e8;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
