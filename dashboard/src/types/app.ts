/**
 * Application-specific types
 * Simplified types used throughout the application
 */

import type { TaskState, DAGRunState, DAGRunType } from './airflow';

// Simplified DAG type for application use
export interface DAG {
  dag_id: string;
  description: string | null;
  is_paused: boolean;
  last_run_state: DAGRunState | null;
  last_run_date: string | null;
  next_dagrun: string | null;
  schedule_interval: string | null;
  owners: string[];
  tags: string[];
  has_import_errors: boolean;
}

// Simplified DAG Run type for application use
export interface DAGRun {
  dag_run_id: string;
  dag_id: string;
  execution_date: string;
  start_date: string | null;
  end_date: string | null;
  state: DAGRunState;
  run_type: DAGRunType;
  external_trigger: boolean;
  conf: object | null;
  duration?: number; // calculated field
}

// Simplified Task Instance type for application use
export interface TaskInstance {
  task_id: string;
  dag_id: string;
  dag_run_id: string;
  state: TaskState | null;
  start_date: string | null;
  end_date: string | null;
  duration: number | null;
  try_number: number;
  max_tries: number;
  operator: string;
  pool: string;
  queue: string | null;
  priority_weight: number;
}

// User authentication
export interface User {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  roles: string[];
}

export interface AuthToken {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  expires_at: number; // calculated timestamp
}

// UI notification system
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  autoHide?: boolean;
  duration?: number;
}

// Pagination
export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginationInfo {
  total_entries: number;
  current_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// API request/response wrappers
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface APIError {
  message: string;
  status: number;
  code?: string;
  details?: object;
}

// Loading states
export interface LoadingState {
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Filter and search parameters
export interface DAGFilters {
  search?: string;
  paused?: boolean;
  tags?: string[];
  owners?: string[];
}

export interface DAGRunFilters {
  state?: DAGRunState[];
  run_type?: DAGRunType[];
  start_date_gte?: string;
  start_date_lte?: string;
  execution_date_gte?: string;
  execution_date_lte?: string;
}

export interface TaskInstanceFilters {
  state?: TaskState[];
  pool?: string[];
  queue?: string[];
}