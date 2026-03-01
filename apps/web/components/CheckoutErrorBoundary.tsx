'use client';

import React, { Component, ReactNode } from 'react';
import { CreditCard, AlertTriangle, RefreshCw, Phone, Mail } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isRetrying: boolean;
}

export class CheckoutErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      isRetrying: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });

    // Log error for debugging
    console.error('Checkout error boundary caught:', error, errorInfo);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, send to error monitoring
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorToMonitoring(error, errorInfo, { context: 'checkout' });
    }
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true });

    try {
      if (this.props.onRetry) {
        await this.props.onRetry();
      }
      this.setState({ hasError: false, error: null, errorInfo: null, isRetrying: false });
    } catch (error) {
      this.setState({ error: error as Error, isRetrying: false });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      const isPaymentError = this.state.error?.message.toLowerCase().includes('payment') ||
        this.state.error?.message.toLowerCase().includes('card') ||
        this.state.error?.message.toLowerCase().includes('stripe');

      return (
        <div className="min-h-[400px] flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <div className="mb-6">
              {isPaymentError ? (
                <CreditCard className="w-12 h-12 text-red-500 mx-auto mb-4" />
              ) : (
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              )}

              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {isPaymentError ? 'Payment Error' : 'Checkout Issue'}
              </h2>

              <p className="text-sm text-gray-600 mb-4">
                {isPaymentError
                  ? 'We encountered an issue processing your payment. Your card has not been charged.'
                  : 'Something went wrong during checkout. Don’t worry, your information is safe.'
                }
              </p>

              {isPaymentError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-yellow-800">
                    <strong>Tip:</strong> Please check your payment details or try a different payment method.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRetry}
                disabled={this.state.isRetrying}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {this.state.isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </>
                )}
              </button>

              <button
                onClick={() => window.location.href = '/cart'}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                Back to Cart
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-3">
                Need help? We&apos;re here for you:
              </p>
              <div className="flex justify-center gap-4">
                <a
                  href="tel:+1234567890"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Phone className="w-3 h-3" />
                  Support
                </a>
                <a
                  href="mailto:support@reyva.com"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Mail className="w-3 h-3" />
                  Email Us
                </a>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-xs font-mono text-red-600 hover:text-red-700">
                  Error Details (Dev Only)
                </summary>
                <div className="mt-2 p-3 bg-red-50 rounded text-xs font-mono text-red-800 overflow-auto max-h-32">
                  <div className="font-bold mb-1">Error:</div>
                  <div className="mb-2">{this.state.error.message}</div>
                  <div className="font-bold mb-1">Stack:</div>
                  <pre className="whitespace-pre-wrap text-xs">
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling checkout-specific errors
export function useCheckoutError() {
  const [error, setError] = React.useState<string | null>(null);

  const setCheckoutError = (message: string) => {
    console.error('Checkout error:', message);
    setError(message);
  };

  const clearCheckoutError = () => setError(null);

  React.useEffect(() => {
    if (error) {
      // Auto-scroll to top when error occurs
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  return {
    error,
    setCheckoutError,
    clearCheckoutError,
    hasError: !!error
  };
}
