/**
 * Error Handling Utilities
 * Centralized error handling and user-friendly error messages
 */

import type { APIError } from '../types/api';
import { logConfig } from './config';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error categories
 */
export type ErrorCategory = 
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'server'
  | 'client'
  | 'unknown';

/**
 * Enhanced error interface
 */
export interface EnhancedError extends APIError {
  severity: ErrorSeverity;
  category: ErrorCategory;
  userMessage: string;
  actionable: boolean;
  retryable: boolean;
}

/**
 * Error message mappings
 */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Authentication required. Please log in to continue.',
  403: 'Access denied. You don\'t have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'Conflict detected. The resource may have been modified by another user.',
  422: 'Invalid data provided. Please check your input and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Internal server error. Please try again later.',
  502: 'Service temporarily unavailable. Please try again later.',
  503: 'Service temporarily unavailable. Please try again later.',
  504: 'Request timeout. Please try again later.',
};

/**
 * Default error message
 */
const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';

/**
 * Categorize error based on status code and message
 */
function categorizeError(error: APIError): ErrorCategory {
  if (error.status === 0) {
    return 'network';
  }

  if (error.status === 401) {
    return 'authentication';
  }

  if (error.status === 403) {
    return 'authorization';
  }

  if (error.status >= 400 && error.status < 500) {
    return 'client';
  }

  if (error.status >= 500) {
    return 'server';
  }

  return 'unknown';
}

/**
 * Determine error severity
 */
function determineSeverity(error: APIError): ErrorSeverity {
  if (error.status === 0) {
    return 'high'; // Network errors are serious
  }

  if (error.status === 401 || error.status === 403) {
    return 'medium'; // Auth errors need attention but aren't critical
  }

  if (error.status >= 500) {
    return 'high'; // Server errors are serious
  }

  if (error.status >= 400 && error.status < 500) {
    return 'low'; // Client errors are usually fixable
  }

  return 'medium';
}

/**
 * Check if error is retryable
 */
function isRetryable(error: APIError): boolean {
  // Network errors are retryable
  if (error.status === 0) {
    return true;
  }

  // Server errors (5xx) are retryable
  if (error.status >= 500) {
    return true;
  }

  // Rate limiting is retryable
  if (error.status === 429) {
    return true;
  }

  // Client errors (4xx) are generally not retryable
  return false;
}

/**
 * Check if error requires user action
 */
function isActionable(error: APIError): boolean {
  // Authentication and authorization errors require user action
  if (error.status === 401 || error.status === 403) {
    return true;
  }

  // Validation errors require user action
  if (error.status === 400 || error.status === 422) {
    return true;
  }

  // Network and server errors don't require immediate user action
  return false;
}

/**
 * Get user-friendly error message
 */
function getUserMessage(error: APIError): string {
  // Use predefined message if available
  if (ERROR_MESSAGES[error.status]) {
    return ERROR_MESSAGES[error.status];
  }

  // Use error message from API if it's user-friendly
  if (error.message && !error.message.includes('Error:') && error.message.length < 200) {
    return error.message;
  }

  return DEFAULT_ERROR_MESSAGE;
}

/**
 * Enhance API error with additional metadata
 */
export function enhanceError(error: APIError): EnhancedError {
  const category = categorizeError(error);
  const severity = determineSeverity(error);
  const userMessage = getUserMessage(error);
  const retryable = isRetryable(error);
  const actionable = isActionable(error);

  return {
    ...error,
    category,
    severity,
    userMessage,
    retryable,
    actionable,
  };
}

/**
 * Log error with appropriate level
 */
export function logError(error: EnhancedError, context?: string): void {
  if (!logConfig.enableConsoleLogging) {
    return;
  }

  const logMessage = `${context ? `[${context}] ` : ''}${error.userMessage}`;
  const logDetails = {
    status: error.status,
    code: error.code,
    category: error.category,
    severity: error.severity,
    retryable: error.retryable,
    actionable: error.actionable,
    timestamp: new Date(error.timestamp).toISOString(),
    originalMessage: error.message,
    details: error.details,
  };

  switch (error.severity) {
    case 'critical':
      console.error(logMessage, logDetails);
      break;
    case 'high':
      console.error(logMessage, logDetails);
      break;
    case 'medium':
      console.warn(logMessage, logDetails);
      break;
    case 'low':
      console.info(logMessage, logDetails);
      break;
    default:
      console.log(logMessage, logDetails);
  }
}

/**
 * Create error handler function
 */
export function createErrorHandler(context: string) {
  return (error: APIError): EnhancedError => {
    const enhancedError = enhanceError(error);
    logError(enhancedError, context);
    return enhancedError;
  };
}

/**
 * Common error handlers for different contexts
 */
export const errorHandlers = {
  dagList: createErrorHandler('DAG List'),
  dagRuns: createErrorHandler('DAG Runs'),
  taskInstances: createErrorHandler('Task Instances'),
  taskLogs: createErrorHandler('Task Logs'),
  dagTrigger: createErrorHandler('DAG Trigger'),
  authentication: createErrorHandler('Authentication'),
  apiConnection: createErrorHandler('API Connection'),
};

/**
 * Check if error indicates authentication failure
 */
export function isAuthError(error: APIError): boolean {
  return error.status === 401;
}

/**
 * Check if error indicates authorization failure
 */
export function isAuthorizationError(error: APIError): boolean {
  return error.status === 403;
}

/**
 * Check if error indicates network failure
 */
export function isNetworkError(error: APIError): boolean {
  return error.status === 0 || error.code === 'NETWORK_ERROR';
}

/**
 * Check if error indicates server failure
 */
export function isServerError(error: APIError): boolean {
  return error.status >= 500 && error.status < 600;
}

/**
 * Check if error indicates client failure
 */
export function isClientError(error: APIError): boolean {
  return error.status >= 400 && error.status < 500;
}

/**
 * Get retry delay based on error type and attempt count
 */
export function getRetryDelay(error: APIError, attemptCount: number): number {
  const baseDelay = 1000; // 1 second

  // Rate limiting - use longer delay
  if (error.status === 429) {
    return baseDelay * Math.pow(2, attemptCount) * 2;
  }

  // Server errors - exponential backoff
  if (error.status >= 500) {
    return baseDelay * Math.pow(2, attemptCount);
  }

  // Network errors - linear backoff
  if (error.status === 0) {
    return baseDelay * (attemptCount + 1);
  }

  return baseDelay;
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: EnhancedError): {
  title: string;
  message: string;
  severity: ErrorSeverity;
  actions?: Array<{ label: string; action: string }>;
} {
  const actions: Array<{ label: string; action: string }> = [];

  // Add retry action for retryable errors
  if (error.retryable) {
    actions.push({ label: 'Retry', action: 'retry' });
  }

  // Add login action for auth errors
  if (error.category === 'authentication') {
    actions.push({ label: 'Login', action: 'login' });
  }

  // Add refresh action for network errors
  if (error.category === 'network') {
    actions.push({ label: 'Refresh', action: 'refresh' });
  }

  return {
    title: getErrorTitle(error.category),
    message: error.userMessage,
    severity: error.severity,
    actions: actions.length > 0 ? actions : undefined,
  };
}

/**
 * Get error title based on category
 */
function getErrorTitle(category: ErrorCategory): string {
  switch (category) {
    case 'network':
      return 'Connection Error';
    case 'authentication':
      return 'Authentication Required';
    case 'authorization':
      return 'Access Denied';
    case 'validation':
      return 'Invalid Input';
    case 'server':
      return 'Server Error';
    case 'client':
      return 'Request Error';
    default:
      return 'Error';
  }
}