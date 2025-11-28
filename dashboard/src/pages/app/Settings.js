import React from 'react';
import { Gear } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';

function Settings() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="page-header">
        <Gear size={32} weight="duotone" />
        <h1>Settings</h1>
      </div>

      <div className="settings-section">
        <h2 className="section-title">Profile</h2>
        <div className="card">
          <div className="setting-item">
            <label>First Name</label>
            <input
              type="text"
              className="input"
              value={user?.firstName || ''}
              disabled
            />
          </div>
          <div className="setting-item">
            <label>Last Name</label>
            <input
              type="text"
              className="input"
              value={user?.lastName || ''}
              disabled
            />
          </div>
          <div className="setting-item">
            <label>Email</label>
            <input
              type="email"
              className="input"
              value={user?.email || ''}
              disabled
            />
          </div>
          <p className="help-text">Profile editing will be available soon</p>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-title">Account</h2>
        <div className="card">
          <div className="setting-item">
            <label>Change Password</label>
            <button className="button button-secondary" disabled>
              Update Password
            </button>
          </div>
          <p className="help-text">Password management will be available soon</p>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-title">Preferences</h2>
        <div className="card">
          <p className="help-text">User preferences will be available soon</p>
        </div>
      </div>

      <style>{`
        .page-container {
          max-width: 800px;
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

        .settings-section {
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 1rem;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }

        .setting-item {
          margin-bottom: 1.5rem;
        }

        .setting-item:last-of-type {
          margin-bottom: 0;
        }

        .setting-item label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s;
        }

        .input:focus:not(:disabled) {
          border-color: #1a73e8;
          box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
        }

        .input:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
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

        .button-secondary {
          background-color: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .button-secondary:hover:not(:disabled) {
          background-color: #e5e7eb;
        }

        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .help-text {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 1rem;
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}

export default Settings;
