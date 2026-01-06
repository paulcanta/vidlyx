import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Columns,
  Monitor,
  ArrowsOutSimple,
  FloppyDisk,
  Export,
  DotsThree
} from '@phosphor-icons/react';
import './CompactHeader.css';

/**
 * CompactHeader Component
 * 48px header with back navigation, title, view modes, and actions
 */
function CompactHeader({
  title,
  onBack,
  viewMode = 'default',
  onViewModeChange,
  onSave,
  onExport,
  actions = []
}) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  const viewModes = [
    { id: 'default', icon: Columns, label: 'Default', shortcut: 'D' },
    { id: 'theater', icon: Monitor, label: 'Theater', shortcut: 'T' },
    { id: 'fullscreen', icon: ArrowsOutSimple, label: 'Fullscreen', shortcut: 'F' }
  ];

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      onViewModeChange?.('default');
    } else {
      document.documentElement.requestFullscreen();
      onViewModeChange?.('fullscreen');
    }
  };

  const handleViewModeChange = (mode) => {
    if (mode === 'fullscreen') {
      handleFullscreen();
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      onViewModeChange?.(mode);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && viewMode === 'fullscreen') {
        onViewModeChange?.('default');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [viewMode, onViewModeChange]);

  return (
    <header className="compact-header">
      {/* Left: Back Button */}
      <button className="header-back-btn" onClick={onBack} title="Back to Dashboard">
        <ArrowLeft size={20} weight="bold" />
      </button>

      {/* Center: Title */}
      <div className="header-title-section">
        <h1 className="header-title" title={title}>
          {title || 'Untitled Video'}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="header-actions">
        {/* View Mode Toggle */}
        <div className="view-mode-toggle">
          {viewModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                className={`view-mode-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleViewModeChange(mode.id)}
                title={`${mode.label} (${mode.shortcut})`}
              >
                <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="header-divider" />

        {/* Save Button */}
        {onSave && (
          <button className="header-action-btn" onClick={onSave} title="Save to Collection">
            <FloppyDisk size={20} />
          </button>
        )}

        {/* Export Button */}
        {onExport && (
          <button className="header-action-btn" onClick={onExport} title="Export">
            <Export size={20} />
          </button>
        )}

        {/* More Actions */}
        {actions.length > 0 && (
          <div className="more-menu-container" ref={menuRef}>
            <button
              className={`header-action-btn ${showMoreMenu ? 'active' : ''}`}
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              title="More actions"
            >
              <DotsThree size={20} weight="bold" />
            </button>

            {showMoreMenu && (
              <div className="more-menu">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    className="more-menu-item"
                    onClick={() => {
                      action.onClick?.();
                      setShowMoreMenu(false);
                    }}
                  >
                    {action.icon && <action.icon size={18} />}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default CompactHeader;
