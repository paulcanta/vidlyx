import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import SearchModal from '../Search/SearchModal';
import useSearch from '../../hooks/useSearch';
import './Layout.css';

function MainLayout() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  // Listen for sidebar state changes
  useEffect(() => {
    const handleSidebarToggle = () => {
      const saved = localStorage.getItem('sidebarCollapsed');
      setIsSidebarCollapsed(saved === 'true');
    };

    // Listen for storage events
    window.addEventListener('storage', handleSidebarToggle);

    // Custom event for same-page updates
    window.addEventListener('sidebarToggle', handleSidebarToggle);

    return () => {
      window.removeEventListener('storage', handleSidebarToggle);
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
    };
  }, []);

  // Listen for the openSearch event from ShortcutsContext
  useEffect(() => {
    const handleOpenSearch = () => {
      setIsSearchOpen(true);
    };

    window.addEventListener('openSearch', handleOpenSearch);

    return () => {
      window.removeEventListener('openSearch', handleOpenSearch);
    };
  }, []);

  // Close search modal
  const handleCloseSearch = () => {
    setIsSearchOpen(false);
  };

  // Create a wrapper hook that adapts useSearch to SearchModal's expected API
  const useSearchAdapter = (query, activeFilter) => {
    const searchHook = useSearch({
      types: activeFilter === 'all'
        ? ['videos', 'saves', 'transcripts', 'frames']
        : [activeFilter],
      limit: 20
    });

    // Trigger search when query changes
    useEffect(() => {
      if (query) {
        searchHook.updateQuery(query);
      } else {
        searchHook.clearSearch();
      }
    }, [query]);

    // Transform results to flat array for SearchModal
    // searchHook.results has structure: { videos: {items: [], total: 0}, saves: {items: [], total: 0}, ... }
    const flatResults = searchHook.results
      ? Object.entries(searchHook.results).flatMap(([type, typeResults]) => {
          const items = typeResults?.items || [];
          // Map plural type names to singular for SearchResultItem
          const singularType = type === 'videos' ? 'video'
            : type === 'saves' ? 'save'
            : type === 'transcripts' ? 'transcript'
            : type === 'frames' ? 'frame'
            : type;

          return items.map(item => ({
            ...item,
            type: singularType,
            videoId: item.id || item.video_id || item.youtube_id,
            saveId: item.id,
            title: item.title || item.text || 'Untitled',
            excerpt: item.description_highlight || item.description || item.text || '',
            thumbnail: item.thumbnail_url || item.thumbnail,
            timestamp: item.timestamp
          }));
        })
      : [];

    return {
      results: flatResults,
      isLoading: searchHook.loading,
      error: searchHook.error
    };
  };

  return (
    <div className="main-layout">
      <Header />
      <div className={`layout-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <SearchModal
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
        useSearch={useSearchAdapter}
      />
    </div>
  );
}

export default MainLayout;
