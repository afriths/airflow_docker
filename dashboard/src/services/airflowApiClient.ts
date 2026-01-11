/**
 * Airflow API Client Service
 * Handles all communication with the Airflow REST API v2
 */

import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
} from 'axios';
import type {
  AirflowDAGCollection,
  AirflowDAGRunCollection,
  AirflowTaskInstanceCollection,
  AirflowDAGResponse,
  AirflowDAGRunResponse,
  AirflowTaskInstanceResponse,
  AirflowErrorResponse,
} from '../types/airflow';
import type {
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

/**
 * Default configuration for the API client
 */
const DEFAULT_CONFIG: APIClientConfig = {
  baseURL: import.meta.env.VITE_AIRFLOW_API_URL || 'http://localhost:8080',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  maxRetries: parseInt(import.meta.env.VITE_MAX_RETRIES) || 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: DEFAULT_CONFIG.maxRetries,
  retryDelay: DEFAULT_CONFIG.retryDelay,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx server errors
    return (
      !error.response ||
      (error.response.status >= 500 && error.response.status < 600)
    );
  },
};

/**
 * Airflow API Client Class
 * Provides methods for interacting with the Airflow REST API
 */
export class AirflowAPIClient {
  private client: AxiosInstance;
  private config: APIClientConfig;
  private authToken: string | null = null;

  constructor(config: Partial<APIClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = this.createAxiosInstance();
    this.setupInterceptors();
  }

  /**
   * Create and configure the Axios instance
   */
  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: `${this.config.baseURL}/api/v1`,
      timeout: this.config.timeout,
      headers: this.config.headers,
    });
  }

  /**
   * Set up request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor for adding auth token
    this.client.interceptors.request.use(
      config => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        const apiError = this.transformError(error);

        // Handle token expiration
        if (error.response?.status === 401 && this.authToken) {
          this.authToken = null;
          // Emit event for token refresh (handled by auth service)
          window.dispatchEvent(new CustomEvent('auth:token-expired'));
        }

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  public clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Transform Axios error to API error
   */
  private transformError(error: AxiosError): APIError {
    if (error.response) {
      // Server responded with error status
      const airflowError = error.response.data as AirflowErrorResponse;
      return {
        message: airflowError?.detail || error.message,
        status: error.response.status,
        code: airflowError?.type,
        details: airflowError,
        timestamp: Date.now(),
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error: Unable to connect to Airflow API',
        status: 0,
        code: 'NETWORK_ERROR',
        timestamp: Date.now(),
      };
    } else {
      // Request setup error
      return {
        message: error.message,
        status: 0,
        code: 'REQUEST_ERROR',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Execute request with retry logic and exponential backoff
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<APIResponse<T>> {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    let lastError: APIError;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const response = await requestFn();
        return {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers as Record<string, string>,
        };
      } catch (error) {
        lastError = error as APIError;

        // Don't retry if it's the last attempt or retry condition is not met
        if (
          attempt === config.maxRetries ||
          !config.retryCondition?.(error as AxiosError)
        ) {
          break;
        }

        // Calculate exponential backoff delay
        const delay = config.retryDelay * Math.pow(2, attempt);

        // Call retry callback if provided
        config.onRetry?.(attempt + 1, error);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Build query parameters for API requests
   */
  private buildQueryParams(
    params: Record<string, any>
  ): Record<string, string> {
    const queryParams: Record<string, string> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams[key] = value.join(',');
        } else {
          queryParams[key] = String(value);
        }
      }
    });

    return queryParams;
  }

  // ==================== DAG API Methods ====================

  /**
   * Get all DAGs with optional filtering and pagination
   */
  public async getDAGs(
    params: Partial<GetDAGsParams> = {}
  ): Promise<APIResponse<AirflowDAGCollection>> {
    const queryParams = this.buildQueryParams({
      limit: params.limit ?? 100,
      offset: params.offset ?? 0,
      dag_id_pattern: params.dag_id_pattern,
      only_active: params.only_active,
      paused: params.paused,
      tags: params.tags,
    });

    return this.executeWithRetry(() =>
      this.client.get<AirflowDAGCollection>('/dags', { params: queryParams })
    );
  }

  /**
   * Get a specific DAG by ID
   */
  public async getDAG(dagId: string): Promise<APIResponse<AirflowDAGResponse>> {
    return this.executeWithRetry(() =>
      this.client.get<AirflowDAGResponse>(`/dags/${encodeURIComponent(dagId)}`)
    );
  }

  /**
   * Trigger a DAG run
   */
  public async triggerDAG(
    request: TriggerDAGRequest
  ): Promise<APIResponse<AirflowDAGRunResponse>> {
    const { dag_id, ...payload } = request;

    return this.executeWithRetry(() =>
      this.client.post<AirflowDAGRunResponse>(
        `/dags/${encodeURIComponent(dag_id)}/dagRuns`,
        payload
      )
    );
  }

  /**
   * Pause/Unpause a DAG
   */
  public async updateDAG(
    dagId: string,
    isPaused: boolean
  ): Promise<APIResponse<AirflowDAGResponse>> {
    return this.executeWithRetry(() =>
      this.client.patch<AirflowDAGResponse>(
        `/dags/${encodeURIComponent(dagId)}`,
        { is_paused: isPaused }
      )
    );
  }

  /**
   * Pause a DAG
   */
  public async pauseDAG(
    dagId: string
  ): Promise<APIResponse<AirflowDAGResponse>> {
    return this.updateDAG(dagId, true);
  }

  /**
   * Unpause a DAG
   */
  public async unpauseDAG(
    dagId: string
  ): Promise<APIResponse<AirflowDAGResponse>> {
    return this.updateDAG(dagId, false);
  }

  // ==================== DAG Run API Methods ====================

  /**
   * Get DAG runs for a specific DAG
   */
  public async getDAGRuns(
    params: GetDAGRunsParams
  ): Promise<APIResponse<AirflowDAGRunCollection>> {
    const { dag_id, ...queryParams } = params;
    const formattedParams = this.buildQueryParams({
      limit: queryParams.limit ?? 25,
      offset: queryParams.offset ?? 0,
      dag_run_id: queryParams.dag_run_id,
      execution_date_gte: queryParams.execution_date_gte,
      execution_date_lte: queryParams.execution_date_lte,
      start_date_gte: queryParams.start_date_gte,
      start_date_lte: queryParams.start_date_lte,
      end_date_gte: queryParams.end_date_gte,
      end_date_lte: queryParams.end_date_lte,
      state: queryParams.state,
      order_by: queryParams.order_by || '-execution_date',
    });

    return this.executeWithRetry(() =>
      this.client.get<AirflowDAGRunCollection>(
        `/dags/${encodeURIComponent(dag_id)}/dagRuns`,
        { params: formattedParams }
      )
    );
  }

  /**
   * Get a specific DAG run
   */
  public async getDAGRun(
    dagId: string,
    dagRunId: string
  ): Promise<APIResponse<AirflowDAGRunResponse>> {
    return this.executeWithRetry(() =>
      this.client.get<AirflowDAGRunResponse>(
        `/dags/${encodeURIComponent(dagId)}/dagRuns/${encodeURIComponent(dagRunId)}`
      )
    );
  }

  /**
   * Delete a DAG run
   */
  public async deleteDAGRun(
    dagId: string,
    dagRunId: string
  ): Promise<APIResponse<void>> {
    return this.executeWithRetry(() =>
      this.client.delete<void>(
        `/dags/${encodeURIComponent(dagId)}/dagRuns/${encodeURIComponent(dagRunId)}`
      )
    );
  }

  // ==================== Task Instance API Methods ====================

  /**
   * Get task instances for a specific DAG run
   */
  public async getTaskInstances(
    params: GetTaskInstancesParams
  ): Promise<APIResponse<AirflowTaskInstanceCollection>> {
    const { dag_id, dag_run_id, ...queryParams } = params;
    const formattedParams = this.buildQueryParams({
      limit: queryParams.limit ?? 100,
      offset: queryParams.offset ?? 0,
      execution_date_gte: queryParams.execution_date_gte,
      execution_date_lte: queryParams.execution_date_lte,
      start_date_gte: queryParams.start_date_gte,
      start_date_lte: queryParams.start_date_lte,
      end_date_gte: queryParams.end_date_gte,
      end_date_lte: queryParams.end_date_lte,
      duration_gte: queryParams.duration_gte,
      duration_lte: queryParams.duration_lte,
      state: queryParams.state,
      pool: queryParams.pool,
      queue: queryParams.queue,
    });

    return this.executeWithRetry(() =>
      this.client.get<AirflowTaskInstanceCollection>(
        `/dags/${encodeURIComponent(dag_id)}/dagRuns/${encodeURIComponent(dag_run_id)}/taskInstances`,
        { params: formattedParams }
      )
    );
  }

  /**
   * Get a specific task instance
   */
  public async getTaskInstance(
    dagId: string,
    dagRunId: string,
    taskId: string
  ): Promise<APIResponse<AirflowTaskInstanceResponse>> {
    return this.executeWithRetry(() =>
      this.client.get<AirflowTaskInstanceResponse>(
        `/dags/${encodeURIComponent(dagId)}/dagRuns/${encodeURIComponent(dagRunId)}/taskInstances/${encodeURIComponent(taskId)}`
      )
    );
  }

  /**
   * Get task logs
   */
  public async getTaskLogs(
    params: GetTaskLogsParams
  ): Promise<APIResponse<{ content: string }>> {
    const { dag_id, dag_run_id, task_id, task_try_number, ...queryParams } =
      params;
    const formattedParams = this.buildQueryParams({
      full_content: queryParams.full_content || true,
      map_index: queryParams.map_index,
      token: queryParams.token,
    });

    return this.executeWithRetry(() =>
      this.client.get<{ content: string }>(
        `/dags/${encodeURIComponent(dag_id)}/dagRuns/${encodeURIComponent(dag_run_id)}/taskInstances/${encodeURIComponent(task_id)}/logs/${task_try_number}`,
        { params: formattedParams }
      )
    );
  }

  /**
   * Clear a task instance (set state to None)
   */
  public async clearTaskInstance(
    dagId: string,
    dagRunId: string,
    taskId: string
  ): Promise<APIResponse<void>> {
    return this.executeWithRetry(() =>
      this.client.post<void>(
        `/dags/${encodeURIComponent(dagId)}/clearTaskInstances`,
        {
          dag_run_id: dagRunId,
          task_ids: [taskId],
          reset_dag_runs: false,
          only_failed: false,
          only_running: false,
        }
      )
    );
  }

  /**
   * Mark task instance as success
   */
  public async markTaskSuccess(
    dagId: string,
    dagRunId: string,
    taskId: string
  ): Promise<APIResponse<void>> {
    return this.executeWithRetry(() =>
      this.client.patch<void>(
        `/dags/${encodeURIComponent(dagId)}/dagRuns/${encodeURIComponent(dagRunId)}/taskInstances/${encodeURIComponent(taskId)}`,
        { state: 'success' }
      )
    );
  }

  /**
   * Mark task instance as failed
   */
  public async markTaskFailed(
    dagId: string,
    dagRunId: string,
    taskId: string
  ): Promise<APIResponse<void>> {
    return this.executeWithRetry(() =>
      this.client.patch<void>(
        `/dags/${encodeURIComponent(dagId)}/dagRuns/${encodeURIComponent(dagRunId)}/taskInstances/${encodeURIComponent(taskId)}`,
        { state: 'failed' }
      )
    );
  }

  // ==================== Utility Methods ====================

  /**
   * Test API connection and authentication
   */
  public async testConnection(): Promise<APIResponse<{ status: string }>> {
    return this.executeWithRetry(() =>
      this.client.get<{ status: string }>('/health')
    );
  }

  /**
   * Get API version information
   */
  public async getVersion(): Promise<APIResponse<{ version: string }>> {
    return this.executeWithRetry(() =>
      this.client.get<{ version: string }>('/version')
    );
  }

  /**
   * Get configuration information
   */
  public async getConfig(): Promise<APIResponse<Record<string, any>>> {
    return this.executeWithRetry(() =>
      this.client.get<Record<string, any>>('/config')
    );
  }
}

// Export singleton instance
export const airflowApiClient = new AirflowAPIClient();

// Export class for testing and custom instances
export default AirflowAPIClient;
