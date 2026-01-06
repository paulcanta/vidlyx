import React, { useState } from 'react';
import { Copy, Check } from '@phosphor-icons/react';
import './CopyButton.css';

/**
 * CopyButton Component
 * Button to copy text to clipboard
 *
 * @param {object} props
 * @param {string} props.text - Text to copy
 * @param {string} [props.label] - Button label
 * @param {string} [props.successLabel] - Label shown after successful copy
 * @param {string} [props.className] - Additional CSS classes
 * @param {number} [props.successDuration] - Duration to show success state in ms (default: 2000)
 * @param {function} [props.onCopySuccess] - Callback when copy succeeds
 * @param {function} [props.onCopyError] - Callback when copy fails
 */
const CopyButton = ({
  text,
  label = 'Copy',
  successLabel = 'Copied!',
  className = '',
  successDuration = 2000,
  onCopySuccess,
  onCopyError
}) => {
  const [isCopied, setIsCopied] = useState(false);

  /**
   * Copy text to clipboard
   */
  const handleCopy = async () => {
    if (!text) {
      console.error('No text to copy');
      return;
    }

    try {
      // Use modern clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
        } catch (err) {
          throw new Error('Failed to copy using fallback method');
        } finally {
          textArea.remove();
        }
      }

      // Show success state
      setIsCopied(true);

      // Reset after duration
      setTimeout(() => {
        setIsCopied(false);
      }, successDuration);

      if (onCopySuccess) {
        onCopySuccess(text);
      }
    } catch (error) {
      console.error('Failed to copy text:', error);

      if (onCopyError) {
        onCopyError(error);
      }
    }
  };

  return (
    <button
      className={`copy-button ${isCopied ? 'copy-button-copied' : ''} ${className}`}
      onClick={handleCopy}
      disabled={isCopied}
      title={isCopied ? successLabel : label}
    >
      {isCopied ? (
        <>
          <Check size={18} weight="bold" />
          <span>{successLabel}</span>
        </>
      ) : (
        <>
          <Copy size={18} weight="regular" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};

export default CopyButton;
