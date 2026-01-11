/**
 * Redux Store State Types
 * Defines the structure of the application state
 */

import type {
  DAG,
  DAGRun,
  TaskInstance,
  User,
  AuthToken,
  Notification,
} from './app';

// Authentication state
export interface AuthState {
  token: AuthToken | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// DAGs state
export interface DAGsState {
  items: DAG[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  selectedDAG: string | null;
}

// DAG Runs state - organized by DAG ID
export interface DAGRunsState {
  [dagId: string]: {
    runs: DAGRun[];
    loading: boolean;
    error: string | null;
    lastUpdated: number | null;
    selectedRun: string | null;
  };
}

// Task Instances state - organized by DAG ID and Run ID
export interface TasksState {
  [dagRunKey: string]: {
    // format: "dagId:runId"
    instances: TaskInstance[];
    loading: boolean;
    error: string | null;
    lastUpdated: number | null;
  };
}

// UI state for managing interface elements
export interface UIState {
  sidebarOpen: boolean;
  notifications: Notification[];
  theme: 'light' | 'dark';
  refreshInterval: number; // in milliseconds
  autoRefresh: boolean;
  selectedDAG: string | null;
}

// Root application state
export interface RootState {
  auth: AuthState;
  dags: DAGsState;
  dagRuns: DAGRunsState;
  tasks: TasksState;
  ui: UIState;
}

// Action payload types for Redux actions
export interface LoginPayload {
  username: string;
  password: string;
}

export interface TriggerDAGPayload {
  dagId: string;
  conf?: object;
}

export interface FetchDAGRunsPayload {
  dagId: string;
  limit?: number;
  offset?: number;
}

export interface FetchTaskInstancesPayload {
  dagId: string;
  dagRunId: string;
}

export interface AddNotificationPayload {
  type: Notification['type'];
  title: string;
  message: string;
  autoHide?: boolean;
  duration?: number;
}

export interface RemoveNotificationPayload {
  id: string;
}

// Selector return types
export interface DAGWithLastRun extends DAG {
  lastRun?: DAGRun;
  isRunning: boolean;
}

export interface TaskInstanceWithStatus extends TaskInstance {
  isRunning: boolean;
  isFailed: boolean;
  isSuccess: boolean;
  statusColor: string;
}
