/**
 * Test file for ExportMenu component
 * Note: This is a reference implementation showing how to test the component
 * Requires jest and @testing-library/react to be installed
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExportMenu from './ExportMenu';
import exportService from '../../services/exportService';

// Mock the export service
jest.mock('../../services/exportService');

describe('ExportMenu', () => {
  const mockSaveId = 'save-123';
  const mockVideoId = 'video-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Save Export', () => {
    it('renders export button', () => {
      render(<ExportMenu type="save" id={mockSaveId} />);
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('opens dropdown menu on click', () => {
      render(<ExportMenu type="save" id={mockSaveId} />);

      const button = screen.getByText('Export');
      fireEvent.click(button);

      expect(screen.getByText('Export as')).toBeInTheDocument();
      expect(screen.getByText('JSON')).toBeInTheDocument();
      expect(screen.getByText('Markdown')).toBeInTheDocument();
      expect(screen.getByText('Plain Text')).toBeInTheDocument();
    });

    it('exports save as JSON', async () => {
      const mockBlob = new Blob(['{"test": "data"}'], { type: 'application/json' });
      const mockResponse = {
        data: mockBlob,
        headers: {
          'content-disposition': 'attachment; filename="test-save.json"'
        }
      };

      exportService.exportSave.mockResolvedValue(mockResponse);

      const onExportComplete = jest.fn();
      render(
        <ExportMenu
          type="save"
          id={mockSaveId}
          onExportComplete={onExportComplete}
        />
      );

      // Open menu
      fireEvent.click(screen.getByText('Export'));

      // Click JSON option
      fireEvent.click(screen.getByText('JSON'));

      await waitFor(() => {
        expect(exportService.exportSave).toHaveBeenCalledWith(mockSaveId, 'json');
        expect(onExportComplete).toHaveBeenCalledWith('json', 'test-save.json');
      });
    });

    it('handles export errors', async () => {
      const mockError = new Error('Export failed');
      exportService.exportSave.mockRejectedValue(mockError);

      const onExportError = jest.fn();
      render(
        <ExportMenu
          type="save"
          id={mockSaveId}
          onExportError={onExportError}
        />
      );

      // Open menu and click option
      fireEvent.click(screen.getByText('Export'));
      fireEvent.click(screen.getByText('JSON'));

      await waitFor(() => {
        expect(onExportError).toHaveBeenCalledWith(mockError);
      });
    });
  });

  describe('Transcript Export', () => {
    it('shows transcript format options', () => {
      render(<ExportMenu type="transcript" id={mockVideoId} />);

      fireEvent.click(screen.getByText('Export'));

      expect(screen.getByText('Plain Text')).toBeInTheDocument();
      expect(screen.getByText('SRT')).toBeInTheDocument();
      expect(screen.getByText('WebVTT')).toBeInTheDocument();
    });

    it('exports transcript as SRT', async () => {
      const mockBlob = new Blob(['SRT content'], { type: 'text/srt' });
      const mockResponse = {
        data: mockBlob,
        headers: {
          'content-disposition': 'attachment; filename="transcript.srt"'
        }
      };

      exportService.exportTranscript.mockResolvedValue(mockResponse);

      render(<ExportMenu type="transcript" id={mockVideoId} />);

      fireEvent.click(screen.getByText('Export'));
      fireEvent.click(screen.getByText('SRT'));

      await waitFor(() => {
        expect(exportService.exportTranscript).toHaveBeenCalledWith(mockVideoId, 'srt');
      });
    });
  });

  describe('UI Behavior', () => {
    it('closes menu when clicking outside', () => {
      render(<ExportMenu type="save" id={mockSaveId} />);

      // Open menu
      fireEvent.click(screen.getByText('Export'));
      expect(screen.getByText('Export as')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      expect(screen.queryByText('Export as')).not.toBeInTheDocument();
    });

    it('shows loading state during export', async () => {
      exportService.exportSave.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<ExportMenu type="save" id={mockSaveId} />);

      fireEvent.click(screen.getByText('Export'));
      fireEvent.click(screen.getByText('JSON'));

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('accepts custom label', () => {
      render(<ExportMenu type="save" id={mockSaveId} label="Download" />);
      expect(screen.getByText('Download')).toBeInTheDocument();
    });
  });
});
