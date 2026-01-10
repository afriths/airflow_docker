/**
 * Tasks Selectors
 * Selectors for task instances state and computed values
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState, TaskInstanceWithStatus } from '../../types/store';
import type { TaskInstance } from '../../types/app';

// Helper function to create task key
const createTaskKey = (dagId: string, dagRunId: string) => `${dagId}:${dagRunId}`;

// Base tasks selector
export const selectTasks = (state: RootState) => state.tasks;

// Task instances for specific DAG run selector factory
export const selectTasksForDAGRun = (dagId: string, dagRunId: string) => createSelector(
  [selectTasks],
  (tasks) => {
    const taskKey = createTaskKey(dagId, dagRunId);
    return tasks[taskKey] || {
      instances: [],
      loading: false,
      error: null,
      lastUpdated: null,
    };
  }
);

// Task instances list for specific DAG run
export const selectTaskInstancesList = (dagId: string, dagRunId: string) => createSelector(
  [selectTasksForDAGRun(dagId, dagRunId)],
  (tasksState) => tasksState.instances
);

// Task instances loading state
export const selectTaskInstancesLoading = (dagId: string, dagRunId: string) => createSelector(
  [selectTasksForDAGRun(dagId, dagRunId)],
  (tasksState) => tasksState.loading
);

// Task instances error
export const selectTaskInstancesError = (dagId: string, dagRunId: string) => createSelector(
  [selectTasksForDAGRun(dagId, dagRunId)],
  (tasksState) => tasksState.error
);

// Task instance by ID selector factory
export const selectTaskInstanceById = (dagId: string, dagRunId: string, taskId: string) => createSelector(
  [selectTaskInstancesList(dagId, dagRunId)],
  (instances) => instances.find(task => task.task_id === taskId) || null
);

// Task instances with enhanced status information
export const selectTaskInstancesWithStatus = (dagId: string, dagRunId: string) => createSelector(
  [selectTaskInstancesList(dagId, dagRunId)],
  (instances): TaskInstanceWithStatus[] => instances.map(task => {
    const isRunning = task.state === 'running';
    const isFailed = task.state === 'failed';
    const isSuccess = task.state === 'success';
    
    let statusColor = '#gray';
    switch (task.state) {
      case 'success':
        statusColor = '#4caf50'; // green
        break;
      case 'failed':
        statusColor = '#f44336'; // red
        break;
      case 'running':
        statusColor = '#2196f3'; // blue
        break;
      case 'queued':
        statusColor = '#ff9800'; // orange
        break;
      case 'skipped':
        statusColor = '#9e9e9e'; // gray
        break;
      case 'upstream_failed':
        statusColor = '#e91e63'; // pink
        break;
      case 'up_for_retry':
        statusColor = '#ffeb3b'; // yellow
        break;
      case 'up_for_reschedule':
        statusColor = '#795548'; // brown
        break;
      default:
        statusColor = '#9e9e9e'; // gray
    }

    return {
      ...task,
      isRunning,
      isFailed,
      isSuccess,
      statusColor,
    };
  })
);

// Filtered task instances selectors
export const selectRunningTaskInstances = (dagId: string, dagRunId: string) => createSelector(
  [selectTaskInstancesList(dagId, dagRunId)],
  (instances) => instances.filter(task => task.state === 'running')
);

export const selectFailedTaskInstances = (dagId: string, dagRunId: string) => createSelector(
  [selectTaskInstancesList(dagId, dagRunId)],
  (instances) => instances.filter(task => task.state === 'failed')
);

export const selectSuccessfulTaskInstances = (dagId: string, dagRunId: string) => createSelector(
  [selectTaskInstancesList(dagId, dagRunId)],
  (instances) => instances.filter(task => task.state === 'success')
);

export const selectQueuedTaskInstances = (dagId: string, dagRunId: string) => createSelector(
  [selectTaskInstancesList(dagId, dagRunId)],
  (instances) => instances.filter(task => task.state === 'queued')
);

export const selectSkippedTaskInstances = (dagId: string, dagRunId: string) => createSelector(
  [selectTaskInstancesList(dagId, dagRunId)],
  (instances) => instances.filter(task => task.state === 'skipped')
);

export const selectRetryingTaskInstances = (dagId: string, dagRunId: string) => createSelector(
  [selectTaskInstancesList(dagId, dagRunId)],
  (instances) => instances.filter(task => task.state === 'up_for_retry')
);

// Task statistics for specific DAG run
export const selectTaskInstanceStats = (dagId: string, dagRunId: string) => createSelector(
  [selectTaskInstancesList(dagId, dagRunId)],
  (instances) => {
    const stats = {
      total: instances.length,
      success: 0,
      failed: 0,
      running: 0,
      queued: 0,
      skipped: 0,
      upstream_failed: 0,
      up_for_retry: 0,
      up_for_reschedule: 0,
      null: 0,
      avgDuration: 0,
      totalDuration: 0,
    };

    let totalDuration = 0;
    let completedTasks = 0;

    instances.forEach(task => {
      // Count by state
      if (task.state) {
        stats[task.state as keyof typeof stats]++;
      } else {
        stats.null++;
      }

      // Calculate duration statistics
      if (task.duration) {
        totalDuration += task.duration;
        completedTasks++;
        stats.totalDuration += task.duration;
      }
    });

    if (completedTasks > 0) {
      stats.avgDuration = totalDuration / completedTasks;
    }

    return stats;
  }
);

// Task instances grouped by state
export const selectTaskInstancesByState = (dagId: string, dagRunId: string) => createSelector(
  [selectTaskInstancesList(dagId, dagRunId)],
  (instances) => {
    const tasksByState: Record<string, TaskInstance[]> = {};
    
    instances.forEach(task => {
      const state = task.state || 'null';
      if (!tasksByState[state]) {
        tasksByState[state] = [];
      }
      tasksByState[state].push(task);
    });

    return tasksByState;
  }
);

// Task instances grouped by operator
export const selectTaskInstancesByOperator = (dagId: string, dagRunId: string) => createSelector(
  [selectTaskInstancesList(dagId, dagRunId)],
  (instances) => {
    const tasksByOperator: Record<string, TaskInstance[]> = {};
    
    instances.forEach(task => {
      if (!tasksByOperator[task.operator]) {
        tasksByOperator[task.operator] = [];
      }
      tasksByOperator[task.operator].push(task);
    });

    return tasksByOperator;
  }
);

// Task instances with retry information
export const selectTaskInstancesWithRetries = (dagId: string, dagRunId: string) => createSelector(
  [selectTaskInstancesList(dagId, dagRunId)],
  (instances) => instances.filter(task => task.try_number > 1)
);

// Longest running tasks
export const selectLongestRunningTasks = (dagId: string, dagRunId: string, limit = 5) => createSelector(
  [selectTaskInstancesList(dagId, dagRunId)],
  (instances) => {
    return instances
      .filter(task => task.duration !== null)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, limit);
  }
);

// Critical path tasks (tasks that could delay the DAG run)
export const selectCriticalPathTasks = (dagId: string, dagRunId: string) => createSelector(
  [selectTaskInstancesList(dagId, dagRunId)],
  (instances) => {
    // This is a simplified version - in reality, you'd need DAG structure
    // to determine the actual critical path
    return instances.filter(task => 
      task.state === 'running' || 
      task.state === 'failed' || 
      task.state === 'up_for_retry'
    );
  }
);

// Task execution timeline data
export const selectTaskExecutionTimeline = (dagId: string, dagRunId: string) => createSelector(
  [selectTaskInstancesList(dagId, dagRunId)],
  (instances) => {
    return instances
      .filter(task => task.start_date)
      .map(task => ({
        taskId: task.task_id,
        operator: task.operator,
        startDate: task.start_date,
        endDate: task.end_date,
        duration: task.duration,
        state: task.state,
        tryNumber: task.try_number,
      }))
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
  }
);

// Data freshness selectors
export const selectTaskInstancesDataAge = (dagId: string, dagRunId: string) => createSelector(
  [selectTasksForDAGRun(dagId, dagRunId)],
  (tasksState) => {
    if (!tasksState.lastUpdated) return null;
    return Date.now() - tasksState.lastUpdated;
  }
);

export const selectTaskInstancesNeedRefresh = (dagId: string, dagRunId: string) => createSelector(
  [selectTaskInstancesDataAge(dagId, dagRunId), selectRunningTaskInstances(dagId, dagRunId)],
  (dataAge, runningTasks) => {
    if (dataAge === null) return true;
    
    // Refresh more frequently if there are running tasks
    const refreshInterval = runningTasks.length > 0 ? 10000 : 30000; // 10s vs 30s
    return dataAge > refreshInterval;
  }
);

// All task instances across all DAG runs (for global statistics)
export const selectAllTaskInstances = createSelector(
  [selectTasks],
  (tasks) => {
    const allInstances: TaskInstance[] = [];
    Object.values(tasks).forEach(taskState => {
      allInstances.push(...taskState.instances);
    });
    return allInstances;
  }
);

// Global task statistics
export const selectGlobalTaskStats = createSelector(
  [selectAllTaskInstances],
  (allInstances) => {
    const stats = {
      total: allInstances.length,
      success: 0,
      failed: 0,
      running: 0,
      queued: 0,
      skipped: 0,
    };

    allInstances.forEach(task => {
      switch (task.state) {
        case 'success':
          stats.success++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'running':
          stats.running++;
          break;
        case 'queued':
          stats.queued++;
          break;
        case 'skipped':
          stats.skipped++;
          break;
      }
    });

    return stats;
  }
);