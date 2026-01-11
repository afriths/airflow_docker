// Health check utilities for monitoring application status
import React from 'react';
import { config } from '../config/environment';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    api: boolean;
    frontend: boolean;
    dependencies: boolean;
  };
  uptime: number;
  memory?: {
    used: number;
    total: number;
  };
}

class HealthChecker {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  // Check if Airflow API is accessible
  async checkAPIHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${config.AIRFLOW_API_URL}/api/v1/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('API health check failed:', error);
      return false;
    }
  }

  // Check frontend dependencies
  checkDependencies(): boolean {
    try {
      // Check if critical dependencies are available
      const criticalDeps = [
        typeof React !== 'undefined',
        typeof window !== 'undefined',
        typeof document !== 'undefined',
        !!window.localStorage,
        !!window.sessionStorage,
      ];

      return criticalDeps.every(Boolean);
    } catch (error) {
      console.warn('Dependencies check failed:', error);
      return false;
    }
  }

  // Get memory usage (if available)
  getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
      };
    }
    return undefined;
  }

  // Get application uptime
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  // Perform comprehensive health check
  async performHealthCheck(): Promise<HealthStatus> {
    const [apiHealthy, dependenciesHealthy] = await Promise.all([
      this.checkAPIHealth(),
      Promise.resolve(this.checkDependencies()),
    ]);

    const frontendHealthy = true; // If we can run this code, frontend is healthy

    const allHealthy = apiHealthy && frontendHealthy && dependenciesHealthy;
    const someHealthy = apiHealthy || frontendHealthy || dependenciesHealthy;

    let status: 'healthy' | 'unhealthy' | 'degraded';
    if (allHealthy) {
      status = 'healthy';
    } else if (someHealthy) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: import.meta.env.MODE,
      checks: {
        api: apiHealthy,
        frontend: frontendHealthy,
        dependencies: dependenciesHealthy,
      },
      uptime: this.getUptime(),
      memory: this.getMemoryUsage(),
    };
  }
}

// Global health checker instance
export const healthChecker = new HealthChecker();

// Health check hook for React components
export const useHealthCheck = () => {
  const [healthStatus, setHealthStatus] = React.useState<HealthStatus | null>(null);
  const [loading, setLoading] = React.useState(false);

  const checkHealth = React.useCallback(async () => {
    setLoading(true);
    try {
      const status = await healthChecker.performHealthCheck();
      setHealthStatus(status);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        environment: import.meta.env.MODE,
        checks: {
          api: false,
          frontend: false,
          dependencies: false,
        },
        uptime: healthChecker.getUptime(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { healthStatus, loading, checkHealth };
};

// Export for external monitoring
if (typeof window !== 'undefined') {
  (window as any).__healthChecker = healthChecker;
}