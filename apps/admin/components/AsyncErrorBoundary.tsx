'use client';

import React, { Component, ReactNode } from 'react';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  retry?: () => void;
  isLoading?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
}

export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isRetrying: false,
    };
  }

  componentDidCatch(error: Error) {
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true });
    
    try {
      if (this.props.retry) {
        await this.props.retry();
      }
      this.setState({ hasError: false, error: null, isRetrying: false });
    } catch (error) {
      this.setState({ error: error as Error, isRetrying: false });
    }
  };

  render() {
    if (this.props.isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      );
    }

    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      const isNetworkError = this.state.error?.message.includes('fetch') ||
                            this.state.error?.message.includes('network') ||
                            this.state.error?.message.includes('ENOTFOUND');

      return (
        <div className="flex flex-col items-center justify-center p-6 text-center min-h-[200px] bg-gray-50 border border-gray-200 rounded-lg">
          {isNetworkError ? (
            <WifiOff className="w-8 h-8 text-gray-400 mb-3" />
          ) : (
            <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
          )}
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isNetworkError ? 'Connection Error' : 'Loading Error'}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4 max-w-md">
            {isNetworkError 
              ? 'Unable to connect to our servers. Please check your internet connection and try again.'
              : 'Failed to load this content. Please try again.'
            }
          </p>
          
          <button
            onClick={this.handleRetry}
            disabled={this.state.isRetrying}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {this.state.isRetrying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                Retry
              </>
            )}
          </button>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm font-mono text-gray-600 hover:text-gray-700">
                Error Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-40">
                {this.state.error?.message}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors in functional components
export function useAsyncError() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = () => setError(null);

  const captureError = (error: Error) => {
    console.error('Async error captured:', error);
    setError(error);
  };

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

// Higher-order component for adding error boundaries to components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Higher-order component for async operations
export function withAsyncErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <AsyncErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </AsyncErrorBoundary>
  );

  WrappedComponent.displayName = `withAsyncErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
