import React, { useState, useRef, useEffect } from 'react';
import { Plus } from '@phosphor-icons/react';
import TagChip from './TagChip';
import useTags from '../../hooks/useTags';

/**
 * TagPicker component - input for selecting and creating tags
 * @param {Object} props
 * @param {Array} props.selected - Array of selected tag IDs
 * @param {Function} props.onChange - Callback when selection changes (receives array of tag IDs)
 * @param {Boolean} props.allowCreate - Whether to allow creating new tags
 */
function TagPicker({ selected = [], onChange, allowCreate = true }) {
  const { tags, search, createTag } = useTags();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Get selected tag objects
  const selectedTags = tags.filter(tag => selected.includes(tag._id || tag.id));

  // Filter suggestions based on input and exclude already selected
  const filteredSuggestions = tags.filter(tag => {
    const isNotSelected = !selected.includes(tag._id || tag.id);
    if (!inputValue.trim()) return isNotSelected;
    return isNotSelected && tag.name.toLowerCase().includes(inputValue.toLowerCase());
  });

  // Check if we should show "Create" option
  const exactMatch = tags.find(tag =>
    tag.name.toLowerCase() === inputValue.toLowerCase()
  );
  const showCreateOption = allowCreate && inputValue.trim() && !exactMatch;

  // All suggestions including create option
  const allSuggestions = showCreateOption
    ? [...filteredSuggestions, { _id: '__create__', name: inputValue, isCreateOption: true }]
    : filteredSuggestions;

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [inputValue]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    search(value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleSelectTag = async (tag) => {
    if (tag.isCreateOption) {
      // Create new tag
      try {
        const newTag = await createTag({
          name: inputValue.trim(),
          color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color
        });
        onChange([...selected, newTag._id || newTag.id]);
      } catch (err) {
        console.error('Failed to create tag:', err);
      }
    } else {
      // Select existing tag
      onChange([...selected, tag._id || tag.id]);
    }
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagId) => {
    onChange(selected.filter(id => id !== tagId));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (allSuggestions.length > 0 && showSuggestions) {
        handleSelectTag(allSuggestions[highlightedIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSuggestions(true);
      setHighlightedIndex(prev =>
        prev < allSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setShowSuggestions(true);
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      // Remove last tag when backspace on empty input
      const lastTag = selectedTags[selectedTags.length - 1];
      handleRemoveTag(lastTag._id || lastTag.id);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const inputWrapperStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    padding: '8px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    minHeight: '42px',
    cursor: 'text',
    position: 'relative',
  };

  const inputStyle = {
    flex: '1',
    minWidth: '120px',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    padding: '2px 4px',
  };

  const suggestionsStyle = {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: '50',
    maxHeight: '200px',
    overflowY: 'auto',
    marginTop: '4px',
  };

  const suggestionItemStyle = (isHighlighted, isCreateOption) => ({
    padding: '8px 12px',
    cursor: 'pointer',
    backgroundColor: isHighlighted ? '#f3f4f6' : 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: isCreateOption ? '#059669' : '#1f2937',
    fontWeight: isCreateOption ? '500' : 'normal',
    transition: 'background-color 0.15s',
  });

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        className="tag-picker-input-wrapper"
        style={inputWrapperStyle}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map(tag => (
          <TagChip
            key={tag._id || tag.id}
            tag={tag}
            onRemove={handleRemoveTag}
          />
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? 'Add tags...' : ''}
          style={inputStyle}
        />
      </div>

      {showSuggestions && allSuggestions.length > 0 && (
        <div className="tag-suggestions" style={suggestionsStyle}>
          {allSuggestions.map((suggestion, index) => (
            <div
              key={suggestion._id || suggestion.id}
              style={suggestionItemStyle(index === highlightedIndex, suggestion.isCreateOption)}
              onClick={() => handleSelectTag(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {suggestion.isCreateOption ? (
                <>
                  <Plus size={16} weight="bold" />
                  <span>Create "{suggestion.name}"</span>
                </>
              ) : (
                <TagChip tag={suggestion} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TagPicker;
