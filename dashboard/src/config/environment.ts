// Environment configuration management
export interface EnvironmentConfig {
  AIRFLOW_API_URL: string;
  API_TIMEOUT: number;
  POLLING_INTERVAL: number;
  MAX_RETRIES: number;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  ENABLE_DEVTOOLS: boolean;
  CACHE_TIME: number;
  STALE_TIME: number;
}

// Validate environment variables
const validateEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const validateNumberEnvVar = (key: string, defaultValue: number): number => {
  const value = import.meta.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable ${key}: ${value}`);
  }
  return parsed;
};

const validateBooleanEnvVar = (key: string, defaultValue: boolean): boolean => {
  const value = import.meta.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

const validateLogLevel = (level: string): 'debug' | 'info' | 'warn' | 'error' => {
  const validLevels = ['debug', 'info', 'warn', 'error'] as const;
  if (!validLevels.includes(level as any)) {
    throw new Error(`Invalid log level: ${level}. Must be one of: ${validLevels.join(', ')}`);
  }
  return level as 'debug' | 'info' | 'warn' | 'error';
};

// Environment configuration
export const config: EnvironmentConfig = {
  AIRFLOW_API_URL: validateEnvVar('VITE_AIRFLOW_API_URL', 'http://localhost:8080'),
  API_TIMEOUT: validateNumberEnvVar('VITE_API_TIMEOUT', 10000),
  POLLING_INTERVAL: validateNumberEnvVar('VITE_POLLING_INTERVAL', 30000),
  MAX_RETRIES: validateNumberEnvVar('VITE_MAX_RETRIES', 3),
  LOG_LEVEL: validateLogLevel(import.meta.env.VITE_LOG_LEVEL || 'info'),
  ENABLE_DEVTOOLS: validateBooleanEnvVar('VITE_ENABLE_DEVTOOLS', false),
  CACHE_TIME: validateNumberEnvVar('VITE_CACHE_TIME', 300000),
  STALE_TIME: validateNumberEnvVar('VITE_STALE_TIME', 60000),
};

// Environment validation function
export const validateEnvironment = (): void => {
  try {
    // Test API URL format
    new URL(config.AIRFLOW_API_URL);
    
    // Validate numeric ranges
    if (config.API_TIMEOUT < 1000) {
      throw new Error('API_TIMEOUT must be at least 1000ms');
    }
    
    if (config.POLLING_INTERVAL < 5000) {
      throw new Error('POLLING_INTERVAL must be at least 5000ms');
    }
    
    if (config.MAX_RETRIES < 1 || config.MAX_RETRIES > 10) {
      throw new Error('MAX_RETRIES must be between 1 and 10');
    }
    
    console.log('Environment validation passed');
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
};

// Development mode check
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const mode = import.meta.env.MODE;

// Export for debugging
if (isDevelopment) {
  console.log('Environment config:', config);
}