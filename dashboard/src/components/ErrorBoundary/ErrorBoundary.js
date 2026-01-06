import React from 'react';
import { Warning, House, ArrowClockwise } from '@phosphor-icons/react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="error-boundary">
          <div className="error-boundary__container">
            <div className="error-boundary__icon">
              <Warning size={64} weight="duotone" />
            </div>

            <h1 className="error-boundary__title">
              Oops! Something went wrong
            </h1>

            <p className="error-boundary__message">
              {this.props.fallbackMessage ||
                'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.'}
            </p>

            <div className="error-boundary__actions">
              <button
                className="error-boundary__button error-boundary__button--primary"
                onClick={this.handleRetry}
              >
                <ArrowClockwise size={20} weight="bold" />
                Try Again
              </button>
              <button
                className="error-boundary__button error-boundary__button--secondary"
                onClick={this.handleGoHome}
              >
                <House size={20} weight="bold" />
                Go Home
              </button>
            </div>

            {isDevelopment && this.state.error && (
              <div className="error-boundary__details">
                <h3 className="error-boundary__details-title">Error Details (Development Only)</h3>
                <div className="error-boundary__details-content">
                  <p className="error-boundary__error-name">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="error-boundary__stack-trace">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
