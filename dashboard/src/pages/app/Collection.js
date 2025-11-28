import React from 'react';
import { Folder } from '@phosphor-icons/react';

function Collection() {
  return (
    <div className="page-container">
      <div className="page-header">
        <Folder size={32} weight="duotone" />
        <h1>My Collection</h1>
      </div>
      <div className="card">
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem 0' }}>
          No videos in your collection yet. Start analyzing videos to build your collection.
        </p>
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
      `}</style>
    </div>
  );
}

export default Collection;
