/**
 * API Data Transformers
 * Utilities for transforming between Airflow API responses and application types
 */

import {
  AirflowDAGResponse,
  AirflowDAGRunResponse,
  AirflowTaskInstanceResponse,
} from '../types/airflow';
import {
  DAG,
  DAGRun,
  TaskInstance,
} from '../types/app';

/**
 * Transform Airflow DAG response to application DAG type
 */
export function transformDAG(airflowDAG: AirflowDAGResponse): DAG {
  return {
    dag_id: airflowDAG.dag_id,
    description: airflowDAG.description,
    is_paused: airflowDAG.is_paused,
    last_run_state: null, // This would need to be populated from DAG runs
    last_run_date: null, // This would need to be populated from DAG runs
    next_dagrun: airflowDAG.next_dagrun,
    schedule_interval: airflowDAG.schedule_interval?.value?.toString() || null,
    owners: airflowDAG.owners,
    tags: airflowDAG.tags.map(tag => tag.name),
    has_import_errors: airflowDAG.has_import_errors,
  };
}

/**
 * Transform array of Airflow DAG responses to application DAG types
 */
export function transformDAGs(airflowDAGs: AirflowDAGResponse[]): DAG[] {
  return airflowDAGs.map(transformDAG);
}

/**
 * Transform Airflow DAG Run response to application DAG Run type
 */
export function transformDAGRun(airflowDAGRun: AirflowDAGRunResponse): DAGRun {
  const startTime = airflowDAGRun.start_date ? new Date(airflowDAGRun.start_date).getTime() : null;
  const endTime = airflowDAGRun.end_date ? new Date(airflowDAGRun.end_date).getTime() : null;
  
  return {
    dag_run_id: airflowDAGRun.dag_run_id,
    dag_id: airflowDAGRun.dag_id,
    execution_date: airflowDAGRun.execution_date,
    start_date: airflowDAGRun.start_date,
    end_date: airflowDAGRun.end_date,
    state: airflowDAGRun.state,
    run_type: airflowDAGRun.run_type,
    external_trigger: airflowDAGRun.external_trigger,
    conf: airflowDAGRun.conf,
    duration: startTime && endTime ? Math.round((endTime - startTime) / 1000) : undefined,
  };
}

/**
 * Transform array of Airflow DAG Run responses to application DAG Run types
 */
export function transformDAGRuns(airflowDAGRuns: AirflowDAGRunResponse[]): DAGRun[] {
  return airflowDAGRuns.map(transformDAGRun);
}

/**
 * Transform Airflow Task Instance response to application Task Instance type
 */
export function transformTaskInstance(airflowTaskInstance: AirflowTaskInstanceResponse): TaskInstance {
  return {
    task_id: airflowTaskInstance.task_id,
    dag_id: airflowTaskInstance.dag_id,
    dag_run_id: airflowTaskInstance.dag_run_id,
    state: airflowTaskInstance.state,
    start_date: airflowTaskInstance.start_date,
    end_date: airflowTaskInstance.end_date,
    duration: airflowTaskInstance.duration,
    try_number: airflowTaskInstance.try_number,
    max_tries: airflowTaskInstance.max_tries,
    operator: airflowTaskInstance.operator,
    pool: airflowTaskInstance.pool,
    queue: airflowTaskInstance.queue,
    priority_weight: airflowTaskInstance.priority_weight,
  };
}

/**
 * Transform array of Airflow Task Instance responses to application Task Instance types
 */
export function transformTaskInstances(airflowTaskInstances: AirflowTaskInstanceResponse[]): TaskInstance[] {
  return airflowTaskInstances.map(transformTaskInstance);
}

/**
 * Calculate duration in seconds from start and end dates
 */
export function calculateDuration(startDate: string | null, endDate: string | null): number | null {
  if (!startDate || !endDate) {
    return null;
  }

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return Math.round((end - start) / 1000);
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(durationSeconds: number | null): string {
  if (durationSeconds === null || durationSeconds === undefined) {
    return 'N/A';
  }

  if (durationSeconds < 60) {
    return `${durationSeconds}s`;
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Get status color for task states
 */
export function getTaskStateColor(state: string | null): string {
  switch (state) {
    case 'success':
      return '#4caf50'; // Green
    case 'failed':
      return '#f44336'; // Red
    case 'running':
      return '#2196f3'; // Blue
    case 'queued':
      return '#ff9800'; // Orange
    case 'skipped':
      return '#9e9e9e'; // Gray
    case 'up_for_retry':
      return '#ff5722'; // Deep Orange
    case 'up_for_reschedule':
      return '#795548'; // Brown
    case 'upstream_failed':
      return '#e91e63'; // Pink
    case 'deferred':
      return '#673ab7'; // Deep Purple
    case 'removed':
      return '#607d8b'; // Blue Gray
    default:
      return '#9e9e9e'; // Gray for unknown states
  }
}

/**
 * Get status color for DAG run states
 */
export function getDAGRunStateColor(state: string): string {
  switch (state) {
    case 'success':
      return '#4caf50'; // Green
    case 'failed':
      return '#f44336'; // Red
    case 'running':
      return '#2196f3'; // Blue
    case 'queued':
      return '#ff9800'; // Orange
    default:
      return '#9e9e9e'; // Gray for unknown states
  }
}

/**
 * Check if a DAG run is currently active (running or queued)
 */
export function isDAGRunActive(state: string): boolean {
  return state === 'running' || state === 'queued';
}

/**
 * Check if a task instance is currently active
 */
export function isTaskInstanceActive(state: string | null): boolean {
  return state === 'running' || state === 'queued' || state === 'up_for_retry' || state === 'up_for_reschedule';
}

/**
 * Sort DAG runs by execution date (newest first)
 */
export function sortDAGRunsByDate(dagRuns: DAGRun[]): DAGRun[] {
  return [...dagRuns].sort((a, b) => {
    const dateA = new Date(a.execution_date).getTime();
    const dateB = new Date(b.execution_date).getTime();
    return dateB - dateA; // Newest first
  });
}

/**
 * Sort task instances by task_id alphabetically
 */
export function sortTaskInstancesByName(taskInstances: TaskInstance[]): TaskInstance[] {
  return [...taskInstances].sort((a, b) => a.task_id.localeCompare(b.task_id));
}