/**
 * Type definitions index
 * Central export point for all type definitions
 */

// Airflow API types
export * from './airflow';

// Application types
export * from './app';

// Redux store types
export * from './store';

// Component prop types
export * from './components';

// API parameter types (excluding duplicates from app.ts)
export type {
  APIClientConfig,
  GetDAGsParams,
  TriggerDAGRequest,
  GetDAGRunsParams,
  GetTaskInstancesParams,
  GetTaskLogsParams,
  LoginRequest,
  RefreshTokenRequest,
  RetryConfig,
} from './api';

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonEmptyArray<T> = [T, ...T[]];

export type ValueOf<T> = T[keyof T];

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// Common generic types
export interface Dictionary<T = any> {
  [key: string]: T;
}

export interface NumericDictionary<T = any> {
  [key: number]: T;
}

// Date utility types
export type DateString = string; // ISO 8601 format
export type Timestamp = number; // Unix timestamp in milliseconds

// Status types used across the application
export type LoadingStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type AsyncState<T> = {
  data: T | null;
  status: LoadingStatus;
  error: string | null;
};

// Environment configuration type
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  VITE_AIRFLOW_API_URL: string;
  VITE_API_TIMEOUT: string;
  VITE_POLLING_INTERVAL: string;
  VITE_MAX_RETRIES: string;
  VITE_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
}

export interface ThemeBreakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

// Form types
export interface FormField<T = any> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T extends Record<string, any>> {
  fields: {
    [K in keyof T]: FormField<T[K]>;
  };
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
}

// Event handler types
export type EventHandler<T = any> = (event: T) => void;
export type ChangeHandler<T = any> = (value: T) => void;
export type SubmitHandler<T = any> = (data: T) => void | Promise<void>;

// Component ref types
export type ComponentRef<T = HTMLElement> = React.RefObject<T>;
export type ForwardedRef<T = HTMLElement> = React.ForwardedRef<T>;
