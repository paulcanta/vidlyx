import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlass, User, Gear, SignOut } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../Common/ThemeToggle';
import './Layout.css';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/app" className="logo">
          Vidlyx
        </Link>
        <div className="search-container">
          <MagnifyingGlass size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search videos..."
            className="search-input"
          />
        </div>
      </div>
      <div className="header-right">
        <ThemeToggle />
        <div className="user-menu-container">
          <button
            className="user-menu-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <User size={24} weight="fill" />
            <span>{user?.firstName || 'User'}</span>
          </button>
          {showUserMenu && (
            <div className="user-menu-dropdown">
              <div className="user-menu-header">
                <div className="user-name">{user?.firstName} {user?.lastName}</div>
                <div className="user-email">{user?.email}</div>
              </div>
              <div className="user-menu-divider" />
              <Link
                to="/app/settings"
                className="user-menu-item"
                onClick={() => setShowUserMenu(false)}
              >
                <Gear size={20} />
                <span>Settings</span>
              </Link>
              <button
                className="user-menu-item logout-button"
                onClick={handleLogout}
              >
                <SignOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
