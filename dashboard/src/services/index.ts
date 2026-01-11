/**
 * Services index
 * Central export point for all service modules
 */

// API Client
export { AirflowAPIClient, airflowApiClient } from './airflowApiClient';

// Authentication Service
export { AuthService, authService } from './authService';

// API Transformers
export * from './apiTransformers';

// Configuration
export {
  config,
  apiConfig,
  pollingConfig,
  cacheConfig,
  authConfig,
} from './config';

// Error Handling
export * from './errorHandler';

// Re-export types for convenience
export type {
  APIClientConfig,
  GetDAGsParams,
  TriggerDAGRequest,
  GetDAGRunsParams,
  GetTaskInstancesParams,
  GetTaskLogsParams,
  APIResponse,
  APIError,
  RetryConfig,
} from '../types/api';

export type { AuthToken, User } from '../types/app';
