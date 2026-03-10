// Global error handling utilities
import React from 'react';

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: Error[] = [];
  private isReporting = false;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Log error with context
  logError(error: Error, context?: {
    component?: string;
    action?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const errorWithMetadata = {
      ...error,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: {
        url: typeof window !== 'undefined' ? window.location.href : 'SSR',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
        ...context,
      },
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔴 Error: ${context?.component || 'Unknown'}`);
      console.error(errorWithMetadata);
      console.groupEnd();
    }

    // Add to queue for reporting
    this.errorQueue.push(error as Error);

    // Report errors in batch
    this.scheduleErrorReporting();
  }

  // Handle async errors
  handleAsyncError(error: Error, context?: Record<string, unknown> & { component?: string; action?: string }) {
    this.logError(error, {
      component: context?.component || 'AsyncOperation',
      action: context?.action,
      ...context,
    });
  }

  // Schedule error reporting (debounced)
  private scheduleErrorReporting() {
    if (this.isReporting) return;

    setTimeout(() => {
      this.reportErrors();
    }, 5000); // Report every 5 seconds or when queue has 10+ errors
  }

  // Report errors to monitoring service
  private async reportErrors() {
    if (this.errorQueue.length === 0) return;

    this.isReporting = true;
    const errorsToReport = [...this.errorQueue];
    this.errorQueue = [];

    try {
      if (process.env.NODE_ENV === 'production') {
        // Send to error monitoring service (Sentry, LogRocket, etc.)
        // Example: 
        // await sendToSentry(errorsToReport);
        console.log('Would report errors to monitoring service:', errorsToReport.length);
      }
    } catch (reportingError) {
      console.error('Failed to report errors:', reportingError);
      // Re-add failed errors to queue
      this.errorQueue.unshift(...errorsToReport);
    } finally {
      this.isReporting = false;
    }
  }

  // Get error statistics
  getErrorStats() {
    return {
      queueLength: this.errorQueue.length,
      isReporting: this.isReporting,
    };
  }
}

// React hook for error handling
export function useErrorHandler() {
  const errorHandler = ErrorHandler.getInstance();

  const handleError = React.useCallback((
    error: Error,
    context?: {
      component?: string;
      action?: string;
      metadata?: Record<string, unknown>;
    }
  ) => {
    errorHandler.logError(error, context);
  }, [errorHandler]);

  const handleAsyncError = React.useCallback((
    error: Error,
    context?: Record<string, unknown> & { component?: string; action?: string }
  ) => {
    errorHandler.handleAsyncError(error, context);
  }, [errorHandler]);

  return { handleError, handleAsyncError };
}

// Global error boundary for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const errorHandler = ErrorHandler.getInstance();
    errorHandler.handleAsyncError(
      new Error(event.reason?.message || 'Unhandled promise rejection'),
      {
        component: 'Global',
        action: 'UnhandledPromiseRejection',
        metadata: { reason: event.reason },
      }
    );
  });

  // Global error handler for runtime errors
  window.addEventListener('error', (event) => {
    const errorHandler = ErrorHandler.getInstance();
    errorHandler.logError(
      event.error || new Error(event.message),
      {
        component: 'Global',
        action: 'RuntimeError',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      }
    );
  });
}

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  PAYMENT = 'PAYMENT',
  UNKNOWN = 'UNKNOWN',
}

export function categorizeError(error: Error): ErrorType {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch') || message.includes('enotfound')) {
    return ErrorType.NETWORK;
  }

  if (message.includes('validation') || message.includes('required') || message.includes('invalid')) {
    return ErrorType.VALIDATION;
  }

  if (message.includes('unauthorized') || message.includes('authentication')) {
    return ErrorType.AUTHENTICATION;
  }

  if (message.includes('forbidden') || message.includes('permission')) {
    return ErrorType.AUTHORIZATION;
  }

  if (message.includes('payment') || message.includes('card') || message.includes('stripe')) {
    return ErrorType.PAYMENT;
  }

  return ErrorType.UNKNOWN;
}

// User-friendly error messages
export function getUserFriendlyMessage(error: Error): string {
  const errorType = categorizeError(error);

  switch (errorType) {
    case ErrorType.NETWORK:
      return 'Connection issue. Please check your internet and try again.';

    case ErrorType.VALIDATION:
      return 'Please check your input and try again.';

    case ErrorType.AUTHENTICATION:
      return 'Please sign in to continue.';

    case ErrorType.AUTHORIZATION:
      return 'You don\'t have permission to perform this action.';

    case ErrorType.PAYMENT:
      return 'Payment failed. Please check your payment details and try again.';

    default:
      return 'Something went wrong. Please try again.';
  }
}
