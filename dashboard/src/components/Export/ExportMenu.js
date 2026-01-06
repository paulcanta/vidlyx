import React, { useState, useRef, useEffect } from 'react';
import { DownloadSimple, CaretDown, FilePdf, FileText, FileDoc, FileCode } from '@phosphor-icons/react';
import exportService from '../../services/exportService';
import './ExportMenu.css';

/**
 * ExportMenu Component
 * Dropdown menu for exporting saves and transcripts
 *
 * @param {object} props
 * @param {string} props.type - Type of export ('save' or 'transcript')
 * @param {string} props.id - ID of the save or video
 * @param {string} [props.label] - Button label (default: 'Export')
 * @param {string} [props.className] - Additional CSS classes
 * @param {function} [props.onExportStart] - Callback when export starts
 * @param {function} [props.onExportComplete] - Callback when export completes
 * @param {function} [props.onExportError] - Callback when export fails
 */
const ExportMenu = ({
  type,
  id,
  label = 'Export',
  className = '',
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef(null);

  // Export format options based on type
  const saveFormats = [
    { value: 'json', label: 'JSON', icon: FileCode, description: 'Structured data format' },
    { value: 'markdown', label: 'Markdown', icon: FileDoc, description: 'Formatted document' },
    { value: 'txt', label: 'Plain Text', icon: FileText, description: 'Simple text format' }
  ];

  const transcriptFormats = [
    { value: 'txt', label: 'Plain Text', icon: FileText, description: 'Simple text format' },
    { value: 'srt', label: 'SRT', icon: FilePdf, description: 'SubRip subtitle format' },
    { value: 'vtt', label: 'WebVTT', icon: FilePdf, description: 'Web Video Text Tracks' }
  ];

  const formats = type === 'transcript' ? transcriptFormats : saveFormats;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Download file from blob
   * @param {Blob} blob - File blob
   * @param {string} filename - Suggested filename
   */
  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  /**
   * Get filename from response headers
   * @param {object} response - API response
   * @returns {string} - Filename
   */
  const getFilenameFromResponse = (response) => {
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch && filenameMatch[1]) {
        return filenameMatch[1];
      }
    }
    return `export.${format}`;
  };

  /**
   * Handle export
   * @param {string} format - Export format
   */
  const handleExport = async (format) => {
    setIsOpen(false);
    setIsExporting(true);

    if (onExportStart) {
      onExportStart(format);
    }

    try {
      let response;

      // Call appropriate export service
      if (type === 'transcript') {
        response = await exportService.exportTranscript(id, format);
      } else {
        response = await exportService.exportSave(id, format);
      }

      // Get filename from response
      const filename = getFilenameFromResponse(response);

      // Download file
      downloadFile(response.data, filename);

      if (onExportComplete) {
        onExportComplete(format, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);

      if (onExportError) {
        onExportError(error);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`export-menu ${className}`} ref={menuRef}>
      <button
        className="export-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
      >
        <DownloadSimple size={18} weight="bold" />
        <span>{isExporting ? 'Exporting...' : label}</span>
        <CaretDown size={14} weight="bold" />
      </button>

      {isOpen && (
        <div className="export-menu-dropdown">
          <div className="export-menu-header">
            Export as
          </div>
          <div className="export-menu-options">
            {formats.map((format) => {
              const Icon = format.icon;
              return (
                <button
                  key={format.value}
                  className="export-menu-option"
                  onClick={() => handleExport(format.value)}
                >
                  <Icon size={20} weight="regular" />
                  <div className="export-menu-option-content">
                    <div className="export-menu-option-label">{format.label}</div>
                    <div className="export-menu-option-description">{format.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
