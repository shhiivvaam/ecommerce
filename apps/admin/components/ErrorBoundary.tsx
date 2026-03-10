'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you could send error to logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center min-h-[200px] bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle 
            className="w-8 h-8 text-red-500 mb-3" 
            strokeWidth={1.5}
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-gray-600 mb-4 max-w-md">
            This component encountered an unexpected error. Try refreshing or contact support if the problem persists.
          </p>
          
          {this.props.showRetry && (
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}

          {this.props.showDetails && process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm font-mono text-red-600 hover:text-red-700">
                <Bug className="inline w-4 h-4 mr-1" />
                Error Details
              </summary>
              <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto max-h-40">
                <div className="font-bold mb-1">Error:</div>
                <div className="mb-2">{this.state.error?.message}</div>
                <div className="font-bold mb-1">Stack:</div>
                <pre className="whitespace-pre-wrap">
                  {this.state.error?.stack}
                </pre>
                {this.state.errorInfo && (
                  <>
                    <div className="font-bold mb-1 mt-2">Component Stack:</div>
                    <pre className="whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different use cases
export function ProductErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 text-center bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-yellow-800">
            Unable to load product information. Please try again later.
          </p>
        </div>
      }
      showRetry={true}
      onError={(error) => {
        console.error('Product component error:', error);
        // Could send to analytics
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export function CartErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 text-center bg-orange-50 border border-orange-200 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-sm text-orange-800">
            Cart is temporarily unavailable. Please refresh the page.
          </p>
        </div>
      }
      showRetry={true}
      onError={(error) => {
        console.error('Cart component error:', error);
        // Could send to analytics
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export function FormErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 text-center bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-800">
            Form encountered an error. Your data may not have been saved.
          </p>
        </div>
      }
      showRetry={false}
      onError={(error) => {
        console.error('Form component error:', error);
        // Could send to analytics
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
