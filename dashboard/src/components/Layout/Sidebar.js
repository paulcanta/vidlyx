import React from 'react';
import { NavLink } from 'react-router-dom';
import { House, Plus, Folder, Gear } from '@phosphor-icons/react';
import './Layout.css';

function Sidebar() {
  const navItems = [
    { path: '/app', label: 'Dashboard', icon: House, end: true },
    { path: '/app/new', label: 'New Analysis', icon: Plus },
    { path: '/app/collection', label: 'Collection', icon: Folder },
    { path: '/app/settings', label: 'Settings', icon: Gear },
  ];

  return (
    <aside className="sidebar">
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
            >
              <Icon size={24} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
