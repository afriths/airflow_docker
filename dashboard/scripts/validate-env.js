#!/usr/bin/env node

// Environment validation script for CI/CD and local development
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredEnvVars = [
  'VITE_AIRFLOW_API_URL',
  'VITE_API_TIMEOUT',
  'VITE_POLLING_INTERVAL',
  'VITE_MAX_RETRIES',
  'VITE_LOG_LEVEL'
];

const optionalEnvVars = [
  'VITE_ENABLE_DEVTOOLS',
  'VITE_CACHE_TIME',
  'VITE_STALE_TIME',
  'VITE_APP_VERSION'
];

function validateUrl(url) {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

function validateNumber(value, min, max) {
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= min && (max === undefined || num <= max);
}

function validateLogLevel(level) {
  return ['debug', 'info', 'warn', 'error'].includes(level);
}

function validateBoolean(value) {
  return value === 'true' || value === 'false';
}

function loadEnvFile(envFile) {
  if (!fs.existsSync(envFile)) {
    return {};
  }
  
  const content = fs.readFileSync(envFile, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key] = valueParts.join('=');
      }
    }
  });
  
  return env;
}

function validateEnvironment(env, envName) {
  console.log(`\n🔍 Validating ${envName} environment...`);
  
  const errors = [];
  const warnings = [];
  
  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!env[varName]) {
      errors.push(`Missing required variable: ${varName}`);
      return;
    }
    
    const value = env[varName];
    
    switch (varName) {
      case 'VITE_AIRFLOW_API_URL':
        if (!validateUrl(value)) {
          errors.push(`${varName} must be a valid HTTP/HTTPS URL, got: ${value}`);
        }
        break;
        
      case 'VITE_API_TIMEOUT':
        if (!validateNumber(value, 1000)) {
          errors.push(`${varName} must be a number >= 1000, got: ${value}`);
        }
        break;
        
      case 'VITE_POLLING_INTERVAL':
        if (!validateNumber(value, 5000)) {
          errors.push(`${varName} must be a number >= 5000, got: ${value}`);
        }
        break;
        
      case 'VITE_MAX_RETRIES':
        if (!validateNumber(value, 1, 10)) {
          errors.push(`${varName} must be a number between 1 and 10, got: ${value}`);
        }
        break;
        
      case 'VITE_LOG_LEVEL':
        if (!validateLogLevel(value)) {
          errors.push(`${varName} must be one of: debug, info, warn, error, got: ${value}`);
        }
        break;
    }
  });
  
  // Check optional variables
  optionalEnvVars.forEach(varName => {
    if (env[varName]) {
      const value = env[varName];
      
      switch (varName) {
        case 'VITE_ENABLE_DEVTOOLS':
          if (!validateBoolean(value)) {
            warnings.push(`${varName} should be 'true' or 'false', got: ${value}`);
          }
          break;
          
        case 'VITE_CACHE_TIME':
        case 'VITE_STALE_TIME':
          if (!validateNumber(value, 1000)) {
            warnings.push(`${varName} should be a number >= 1000, got: ${value}`);
          }
          break;
      }
    }
  });
  
  // Report results
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`✅ ${envName} environment validation passed`);
    return true;
  }
  
  if (errors.length > 0) {
    console.log(`❌ ${envName} environment validation failed:`);
    errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log(`⚠️  ${envName} environment warnings:`);
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  return errors.length === 0;
}

function main() {
  console.log('🚀 Environment Validation Script');
  console.log('================================');
  
  const environments = ['development', 'staging', 'production'];
  let allValid = true;
  
  environments.forEach(env => {
    const envFile = path.join(__dirname, '..', `.env.${env}`);
    const envVars = loadEnvFile(envFile);
    
    if (Object.keys(envVars).length === 0) {
      console.log(`⚠️  No .env.${env} file found, skipping validation`);
      return;
    }
    
    const isValid = validateEnvironment(envVars, env);
    if (!isValid) {
      allValid = false;
    }
  });
  
  // Also validate current process.env if NODE_ENV is set
  if (process.env.NODE_ENV) {
    console.log(`\n🔍 Validating current process environment (NODE_ENV=${process.env.NODE_ENV})...`);
    const isValid = validateEnvironment(process.env, 'current');
    if (!isValid) {
      allValid = false;
    }
  }
  
  console.log('\n================================');
  if (allValid) {
    console.log('✅ All environment validations passed!');
    process.exit(0);
  } else {
    console.log('❌ Environment validation failed!');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  validateEnvironment,
  loadEnvFile,
  validateUrl,
  validateNumber,
  validateLogLevel,
  validateBoolean
};