/**
 * API Parameter Types
 * Defines types for API requests and utility functions
 */

import type { PaginationParams } from './app';

// Re-export commonly used types from app for convenience
export type { DAGFilters, DAGRunFilters, TaskInstanceFilters } from './app';

// API Client configuration
export interface APIClientConfig {
  baseURL: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  headers?: Record<string, string>;
}

// Authentication API
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// DAG API parameters
export interface GetDAGsParams extends PaginationParams {
  dag_id_pattern?: string;
  only_active?: boolean;
  paused?: boolean;
  tags?: string[];
}

export interface TriggerDAGRequest {
  dag_id: string;
  conf?: object;
  dag_run_id?: string;
  execution_date?: string;
  replace_microseconds?: boolean;
}

// DAG Run API parameters
export interface GetDAGRunsParams extends PaginationParams {
  dag_id: string;
  dag_run_id?: string;
  execution_date_gte?: string;
  execution_date_lte?: string;
  start_date_gte?: string;
  start_date_lte?: string;
  end_date_gte?: string;
  end_date_lte?: string;
  state?: string[];
  order_by?: string;
}

// Task Instance API parameters
export interface GetTaskInstancesParams extends PaginationParams {
  dag_id: string;
  dag_run_id: string;
  execution_date_gte?: string;
  execution_date_lte?: string;
  start_date_gte?: string;
  start_date_lte?: string;
  end_date_gte?: string;
  end_date_lte?: string;
  duration_gte?: number;
  duration_lte?: number;
  state?: string[];
  pool?: string[];
  queue?: string[];
}

export interface GetTaskLogsParams {
  dag_id: string;
  dag_run_id: string;
  task_id: string;
  task_try_number: number;
  full_content?: boolean;
  map_index?: number;
  token?: string;
}

// HTTP method types
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request configuration
export interface RequestConfig {
  method: HTTPMethod;
  url: string;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// Response wrapper
export interface APIResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

// Error types
export interface APIError {
  message: string;
  status: number;
  code?: string;
  details?: any;
  timestamp: number;
}

export interface NetworkError extends Error {
  code: string;
  isNetworkError: true;
}

export interface ValidationError extends Error {
  field: string;
  value: any;
  isValidationError: true;
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (retryCount: number, error: any) => void;
}

// Cache configuration
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // time to live in milliseconds
  maxSize: number;
  key: string;
}

// Query parameters for React Query
export interface QueryConfig {
  staleTime: number;
  cacheTime: number;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
  retry?: number | boolean;
  enabled?: boolean;
}

// Mutation parameters for React Query
export interface MutationConfig {
  onSuccess?: (data: any) => void;
  onError?: (error: APIError) => void;
  onSettled?: () => void;
}

// WebSocket message types (for future real-time updates)
export interface WebSocketMessage {
  type: 'dag_update' | 'task_update' | 'run_update' | 'error';
  payload: any;
  timestamp: number;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

// Utility types for API transformations
export type APITransformer<TInput, TOutput> = (input: TInput) => TOutput;

export interface TransformConfig<TInput, TOutput> {
  request?: APITransformer<TOutput, TInput>;
  response?: APITransformer<TInput, TOutput>;
}

// Polling configuration
export interface PollingConfig {
  interval: number;
  enabled: boolean;
  maxPolls?: number;
  stopCondition?: (data: any) => boolean;
}
