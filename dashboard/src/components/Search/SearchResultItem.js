import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, BookmarkSimple, TextT, CaretRight } from '@phosphor-icons/react';
import HighlightedText from './HighlightedText';
import './SearchResultItem.css';

/**
 * SearchResultItem Component
 *
 * Displays a single search result with icon, title, excerpt, and thumbnail.
 * Supports different result types: video, save, transcript.
 */
const SearchResultItem = ({ result, onSelect }) => {
  const navigate = useNavigate();

  // Get icon based on result type
  const getIcon = () => {
    switch (result.type) {
      case 'video':
        return <Video size={20} weight="duotone" />;
      case 'save':
        return <BookmarkSimple size={20} weight="duotone" />;
      case 'transcript':
        return <TextT size={20} weight="duotone" />;
      default:
        return <Video size={20} weight="duotone" />;
    }
  };

  // Get type label for display
  const getTypeLabel = () => {
    switch (result.type) {
      case 'video':
        return 'Video';
      case 'save':
        return 'Save';
      case 'transcript':
        return 'Transcript';
      default:
        return result.type;
    }
  };

  // Format timestamp if available
  const formatTimestamp = (seconds) => {
    if (!seconds && seconds !== 0) return null;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle click navigation
  const handleClick = () => {
    if (onSelect) {
      onSelect(result);
    }

    // Navigate based on result type
    if (result.type === 'video' && result.videoId) {
      navigate(`/app/video/${result.videoId}`);
    } else if (result.type === 'save' && result.saveId) {
      navigate(`/app/save/${result.saveId}`);
    } else if (result.type === 'transcript' && result.videoId) {
      const timestamp = result.timestamp ? `?t=${result.timestamp}` : '';
      navigate(`/app/video/${result.videoId}${timestamp}`);
    }
  };

  return (
    <div className="search-result-item" onClick={handleClick}>
      <div className={`search-result-icon search-result-icon--${result.type}`}>
        {getIcon()}
      </div>

      <div className="search-result-content">
        <div className="search-result-header">
          <span className="search-result-type">{getTypeLabel()}</span>
          {result.timestamp !== undefined && result.timestamp !== null && (
            <>
              <span className="search-result-separator">•</span>
              <span className="search-result-timestamp">
                {formatTimestamp(result.timestamp)}
              </span>
            </>
          )}
        </div>

        <div className="search-result-title">
          <HighlightedText text={result.title} />
        </div>

        {result.excerpt && (
          <div className="search-result-excerpt">
            <HighlightedText text={result.excerpt} />
          </div>
        )}
      </div>

      {result.thumbnail && (
        <div className="search-result-thumbnail">
          <img src={result.thumbnail} alt="" />
        </div>
      )}

      <div className="search-result-arrow">
        <CaretRight size={16} weight="bold" />
      </div>
    </div>
  );
};

export default SearchResultItem;
