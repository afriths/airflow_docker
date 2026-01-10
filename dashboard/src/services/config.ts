/**
 * API Configuration
 * Centralized configuration for API client and services
 */

import type { APIClientConfig } from '../types/api';

/**
 * Environment configuration interface
 */
interface EnvironmentConfig {
  VITE_AIRFLOW_API_URL: string;
  VITE_API_TIMEOUT: string;
  VITE_POLLING_INTERVAL: string;
  VITE_MAX_RETRIES: string;
  VITE_LOG_LEVEL: string;
}

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: keyof EnvironmentConfig, fallback: string): string {
  return import.meta.env[key] || fallback;
}

/**
 * Parse integer environment variable
 */
function getEnvInt(key: keyof EnvironmentConfig, fallback: number): number {
  const value = getEnvVar(key, fallback.toString());
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * API Configuration
 */
export const apiConfig: APIClientConfig = {
  baseURL: getEnvVar('VITE_AIRFLOW_API_URL', 'http://localhost:8080'),
  timeout: getEnvInt('VITE_API_TIMEOUT', 10000),
  maxRetries: getEnvInt('VITE_MAX_RETRIES', 3),
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Polling Configuration
 */
export const pollingConfig = {
  // Default polling interval for DAG list
  dagListInterval: getEnvInt('VITE_POLLING_INTERVAL', 30000),
  
  // Faster polling for active DAG runs
  activeDagRunInterval: 10000,
  
  // Slower polling for completed DAG runs
  completedDagRunInterval: 60000,
  
  // Task instance polling interval
  taskInstanceInterval: 5000,
  
  // Maximum number of polls before stopping
  maxPolls: 1000,
};

/**
 * Cache Configuration
 */
export const cacheConfig = {
  // DAG list cache (30 seconds stale time, 5 minutes cache time)
  dagList: {
    staleTime: 30000,
    cacheTime: 300000,
  },
  
  // DAG runs cache (10 seconds stale time, 1 minute cache time)
  dagRuns: {
    staleTime: 10000,
    cacheTime: 60000,
  },
  
  // Task instances cache (5 seconds stale time, 30 seconds cache time)
  taskInstances: {
    staleTime: 5000,
    cacheTime: 30000,
  },
  
  // Task logs cache (1 minute stale time, 5 minutes cache time)
  taskLogs: {
    staleTime: 60000,
    cacheTime: 300000,
  },
};

/**
 * Authentication Configuration
 */
export const authConfig = {
  // Token refresh threshold (5 minutes before expiration)
  refreshThreshold: 5 * 60 * 1000,
  
  // Session timeout warning (10 minutes before expiration)
  sessionWarningThreshold: 10 * 60 * 1000,
  
  // Maximum login attempts
  maxLoginAttempts: 3,
  
  // Login attempt lockout duration (5 minutes)
  lockoutDuration: 5 * 60 * 1000,
};

/**
 * Logging Configuration
 */
export const logConfig = {
  level: getEnvVar('VITE_LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',
  enableConsoleLogging: import.meta.env.DEV,
  enableNetworkLogging: import.meta.env.DEV,
};

/**
 * Feature Flags
 */
export const featureFlags = {
  // Enable real-time updates via WebSocket (future feature)
  enableWebSocket: false,
  
  // Enable advanced filtering
  enableAdvancedFiltering: true,
  
  // Enable task log streaming
  enableLogStreaming: false,
  
  // Enable DAG visualization
  enableDAGVisualization: false,
  
  // Enable performance monitoring
  enablePerformanceMonitoring: import.meta.env.DEV,
};

/**
 * UI Configuration
 */
export const uiConfig = {
  // Default page sizes
  defaultPageSize: 25,
  maxPageSize: 100,
  
  // Notification auto-hide duration
  notificationDuration: 5000,
  
  // Loading debounce delay
  loadingDebounceDelay: 200,
  
  // Search debounce delay
  searchDebounceDelay: 300,
  
  // Theme configuration
  theme: {
    mode: 'light' as 'light' | 'dark',
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
  },
};

/**
 * Validation Configuration
 */
export const validationConfig = {
  // DAG ID pattern
  dagIdPattern: /^[a-zA-Z0-9_-]+$/,
  
  // Maximum DAG ID length
  maxDagIdLength: 250,
  
  // Maximum description length
  maxDescriptionLength: 5000,
  
  // Date format for API requests
  dateFormat: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
};

/**
 * Export all configurations
 */
export const config = {
  api: apiConfig,
  polling: pollingConfig,
  cache: cacheConfig,
  auth: authConfig,
  log: logConfig,
  features: featureFlags,
  ui: uiConfig,
  validation: validationConfig,
};

export default config;