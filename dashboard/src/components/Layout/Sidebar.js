import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { House, Plus, Folder, Gear, List, Video } from '@phosphor-icons/react';
import './Layout.css';

function Sidebar() {
  // Initialize collapsed state from localStorage, default to false
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed);
    // Dispatch custom event for same-page updates
    window.dispatchEvent(new Event('sidebarToggle'));
  }, [isCollapsed]);

  const navItems = [
    { path: '/app', label: 'Home', icon: House, end: true },
    { path: '/app/videos', label: 'Videos', icon: Video },
    { path: '/app/new', label: 'New Analysis', icon: Plus },
    { path: '/app/collection', label: 'Collection', icon: Folder },
    { path: '/app/settings', label: 'Settings', icon: Gear },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <List size={24} />
      </button>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              title={isCollapsed ? item.label : ''}
            >
              <Icon size={24} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
