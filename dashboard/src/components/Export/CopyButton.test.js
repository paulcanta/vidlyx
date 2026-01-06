/**
 * Test file for CopyButton component
 * Note: This is a reference implementation showing how to test the component
 * Requires jest and @testing-library/react to be installed
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CopyButton from './CopyButton';

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn()
};

describe('CopyButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: mockClipboard
    });
  });

  it('renders with default label', () => {
    render(<CopyButton text="Test text" />);
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<CopyButton text="Test text" label="Copy to Clipboard" />);
    expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
  });

  it('copies text to clipboard on click', async () => {
    mockClipboard.writeText.mockResolvedValue();

    render(<CopyButton text="Test text to copy" />);

    const button = screen.getByText('Copy');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith('Test text to copy');
    });
  });

  it('shows success state after copying', async () => {
    mockClipboard.writeText.mockResolvedValue();

    render(<CopyButton text="Test text" successLabel="Copied!" />);

    const button = screen.getByText('Copy');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('resets to default state after success duration', async () => {
    mockClipboard.writeText.mockResolvedValue();

    render(<CopyButton text="Test text" successDuration={500} />);

    fireEvent.click(screen.getByText('Copy'));

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    // Wait for reset
    await waitFor(
      () => {
        expect(screen.getByText('Copy')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('calls onCopySuccess callback', async () => {
    mockClipboard.writeText.mockResolvedValue();
    const onCopySuccess = jest.fn();

    render(<CopyButton text="Test text" onCopySuccess={onCopySuccess} />);

    fireEvent.click(screen.getByText('Copy'));

    await waitFor(() => {
      expect(onCopySuccess).toHaveBeenCalledWith('Test text');
    });
  });

  it('calls onCopyError callback on failure', async () => {
    const error = new Error('Clipboard error');
    mockClipboard.writeText.mockRejectedValue(error);
    const onCopyError = jest.fn();

    render(<CopyButton text="Test text" onCopyError={onCopyError} />);

    fireEvent.click(screen.getByText('Copy'));

    await waitFor(() => {
      expect(onCopyError).toHaveBeenCalledWith(error);
    });
  });

  it('handles missing clipboard API with fallback', async () => {
    // Remove clipboard API
    Object.assign(navigator, { clipboard: undefined });

    // Mock document.execCommand
    document.execCommand = jest.fn(() => true);

    render(<CopyButton text="Test text" />);

    fireEvent.click(screen.getByText('Copy'));

    await waitFor(() => {
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });

  it('disables button during copied state', async () => {
    mockClipboard.writeText.mockResolvedValue();

    render(<CopyButton text="Test text" />);

    const button = screen.getByText('Copy');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
      expect(screen.getByText('Copied!').closest('button')).toBeDisabled();
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <CopyButton text="Test text" className="custom-class" />
    );

    const button = container.querySelector('.custom-class');
    expect(button).toBeInTheDocument();
  });

  it('does not copy if text is empty', () => {
    render(<CopyButton text="" />);

    fireEvent.click(screen.getByText('Copy'));

    expect(mockClipboard.writeText).not.toHaveBeenCalled();
  });
});
