/**
 * React Query hooks for Task Instance data fetching with real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { airflowApiClient } from '../services/airflowApiClient';
import { useAppDispatch } from '../store';
import { addNotification } from '../store/slices/uiSlice';
import type { TaskInstanceFilters } from '../types/app';
import type { GetTaskInstancesParams, GetTaskLogsParams } from '../types/api';
import type { TaskState } from '../types/airflow';

// Query keys for React Query
export const taskInstanceQueryKeys = {
  all: ['taskInstances'] as const,
  lists: () => [...taskInstanceQueryKeys.all, 'list'] as const,
  list: (dagId: string, dagRunId: string, filters: TaskInstanceFilters) => 
    [...taskInstanceQueryKeys.lists(), dagId, dagRunId, filters] as const,
  details: () => [...taskInstanceQueryKeys.all, 'detail'] as const,
  detail: (dagId: string, dagRunId: string, taskId: string) => 
    [...taskInstanceQueryKeys.details(), dagId, dagRunId, taskId] as const,
  logs: () => [...taskInstanceQueryKeys.all, 'logs'] as const,
  log: (dagId: string, dagRunId: string, taskId: string, tryNumber: number) => 
    [...taskInstanceQueryKeys.logs(), dagId, dagRunId, taskId, tryNumber] as const,
};

/**
 * Determine polling interval based on task states
 * Active tasks (running, queued, up_for_retry) poll more frequently
 */
function getTaskPollingInterval(states: (TaskState | null)[]): number {
  const hasActiveTasks = states.some(state => 
    state === 'running' || 
    state === 'queued' || 
    state === 'up_for_retry' || 
    state === 'up_for_reschedule' ||
    state === 'deferred'
  );
  
  if (hasActiveTasks) {
    return 5 * 1000; // 5 seconds for active tasks
  } else {
    return 30 * 1000; // 30 seconds for completed tasks
  }
}

/**
 * Hook for fetching task instances with smart polling based on task states
 */
export function useTaskInstancesQuery(
  dagId: string, 
  dagRunId: string, 
  filters: TaskInstanceFilters = {}, 
  enabled = true
) {
  const dispatch = useAppDispatch();

  const params: GetTaskInstancesParams = {
    dag_id: dagId,
    dag_run_id: dagRunId,
    limit: filters.limit || 100,
    offset: filters.offset || 0,
    state: filters.state,
    execution_date_gte: filters.execution_date_gte,
    execution_date_lte: filters.execution_date_lte,
    start_date_gte: filters.start_date_gte,
    start_date_lte: filters.start_date_lte,
    end_date_gte: filters.end_date_gte,
    end_date_lte: filters.end_date_lte,
    duration_gte: filters.duration_gte,
    duration_lte: filters.duration_lte,
    pool: filters.pool,
    queue: filters.queue,
  };

  return useQuery({
    queryKey: taskInstanceQueryKeys.list(dagId, dagRunId, filters),
    queryFn: async () => {
      try {
        const response = await airflowApiClient.getTaskInstances(params);
        return response.data;
      } catch (error: any) {
        dispatch(addNotification({
          type: 'error',
          title: 'Failed to fetch task instances',
          message: error.message || `Unable to load tasks for run "${dagRunId}"`,
          autoHide: true,
          duration: 5000,
        }));
        throw error;
      }
    },
    enabled,
    staleTime: 2 * 1000, // 2 seconds
    refetchInterval: (data) => {
      if (!data?.data) return false;
      
      const states = data.data.task_instances.map(task => task.state);
      return getTaskPollingInterval(states);
    },
    refetchIntervalInBackground: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

/**
 * Hook for fetching a single task instance with real-time updates
 */
export function useTaskInstanceQuery(
  dagId: string, 
  dagRunId: string, 
  taskId: string, 
  enabled = true
) {
  const dispatch = useAppDispatch();

  return useQuery({
    queryKey: taskInstanceQueryKeys.detail(dagId, dagRunId, taskId),
    queryFn: async () => {
      try {
        const response = await airflowApiClient.getTaskInstance(dagId, dagRunId, taskId);
        return response.data;
      } catch (error: any) {
        dispatch(addNotification({
          type: 'error',
          title: 'Failed to fetch task instance',
          message: error.message || `Unable to load task "${taskId}"`,
          autoHide: true,
          duration: 5000,
        }));
        throw error;
      }
    },
    enabled,
    staleTime: 2 * 1000, // 2 seconds
    refetchInterval: (data) => {
      if (!data?.data) return false;
      
      const state = data.data.state;
      // Poll more frequently for active tasks
      if (state === 'running' || state === 'queued' || state === 'up_for_retry' || 
          state === 'up_for_reschedule' || state === 'deferred') {
        return 3 * 1000; // 3 seconds
      } else {
        return 15 * 1000; // 15 seconds for completed tasks
      }
    },
    refetchIntervalInBackground: true,
  });
}

/**
 * Hook for fetching task logs with caching
 */
export function useTaskLogsQuery(
  dagId: string, 
  dagRunId: string, 
  taskId: string, 
  tryNumber: number,
  enabled = true
) {
  const dispatch = useAppDispatch();

  const params: GetTaskLogsParams = {
    dag_id: dagId,
    dag_run_id: dagRunId,
    task_id: taskId,
    task_try_number: tryNumber,
    full_content: true,
  };

  return useQuery({
    queryKey: taskInstanceQueryKeys.log(dagId, dagRunId, taskId, tryNumber),
    queryFn: async () => {
      try {
        const response = await airflowApiClient.getTaskLogs(params);
        return response.data;
      } catch (error: any) {
        dispatch(addNotification({
          type: 'error',
          title: 'Failed to fetch task logs',
          message: error.message || `Unable to load logs for task "${taskId}"`,
          autoHide: true,
          duration: 5000,
        }));
        throw error;
      }
    },
    enabled,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: false, // Don't auto-refresh logs
    refetchOnMount: true,
    refetchOnReconnect: false,
  });
}

/**
 * Hook for clearing task instances
 */
export function useClearTaskInstanceMutation() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async ({ dagId, dagRunId, taskId }: { 
      dagId: string; 
      dagRunId: string; 
      taskId: string; 
    }) => {
      const response = await airflowApiClient.clearTaskInstance(dagId, dagRunId, taskId);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch task instance queries
      queryClient.invalidateQueries({ queryKey: taskInstanceQueryKeys.all });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Task Cleared',
        message: `Task "${variables.taskId}" has been cleared successfully.`,
        autoHide: true,
        duration: 4000,
      }));
    },
    onError: (error: any, variables) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to clear task',
        message: `Failed to clear task "${variables.taskId}": ${error.message}`,
        autoHide: true,
        duration: 6000,
      }));
    },
  });
}

/**
 * Hook for marking task instances as success
 */
export function useMarkTaskSuccessMutation() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async ({ dagId, dagRunId, taskId }: { 
      dagId: string; 
      dagRunId: string; 
      taskId: string; 
    }) => {
      const response = await airflowApiClient.markTaskSuccess(dagId, dagRunId, taskId);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch task instance queries
      queryClient.invalidateQueries({ queryKey: taskInstanceQueryKeys.all });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Task Marked as Success',
        message: `Task "${variables.taskId}" has been marked as success.`,
        autoHide: true,
        duration: 4000,
      }));
    },
    onError: (error: any, variables) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to mark task as success',
        message: `Failed to mark task "${variables.taskId}" as success: ${error.message}`,
        autoHide: true,
        duration: 6000,
      }));
    },
  });
}

/**
 * Hook for marking task instances as failed
 */
export function useMarkTaskFailedMutation() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async ({ dagId, dagRunId, taskId }: { 
      dagId: string; 
      dagRunId: string; 
      taskId: string; 
    }) => {
      const response = await airflowApiClient.markTaskFailed(dagId, dagRunId, taskId);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch task instance queries
      queryClient.invalidateQueries({ queryKey: taskInstanceQueryKeys.all });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Task Marked as Failed',
        message: `Task "${variables.taskId}" has been marked as failed.`,
        autoHide: true,
        duration: 4000,
      }));
    },
    onError: (error: any, variables) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to mark task as failed',
        message: `Failed to mark task "${variables.taskId}" as failed: ${error.message}`,
        autoHide: true,
        duration: 6000,
      }));
    },
  });
}

/**
 * Hook for manual refresh of task instance data
 */
export function useRefreshTaskInstances() {
  const queryClient = useQueryClient();

  return {
    refreshAll: () => {
      queryClient.invalidateQueries({ queryKey: taskInstanceQueryKeys.all });
    },
    refreshTaskInstances: (dagId: string, dagRunId: string, filters: TaskInstanceFilters = {}) => {
      queryClient.invalidateQueries({ queryKey: taskInstanceQueryKeys.list(dagId, dagRunId, filters) });
    },
    refreshTaskInstance: (dagId: string, dagRunId: string, taskId: string) => {
      queryClient.invalidateQueries({ queryKey: taskInstanceQueryKeys.detail(dagId, dagRunId, taskId) });
    },
    refreshTaskLogs: (dagId: string, dagRunId: string, taskId: string, tryNumber: number) => {
      queryClient.invalidateQueries({ queryKey: taskInstanceQueryKeys.log(dagId, dagRunId, taskId, tryNumber) });
    },
  };
}

/**
 * Hook for getting the current polling status and intervals for tasks
 */
export function useTaskPollingStatus(dagId: string, dagRunId: string, filters: TaskInstanceFilters = {}) {
  const { data, isFetching, isRefetching } = useTaskInstancesQuery(dagId, dagRunId, filters);
  
  const states = data?.task_instances?.map(task => task.state) || [];
  const hasActiveTasks = states.some(state => 
    state === 'running' || 
    state === 'queued' || 
    state === 'up_for_retry' || 
    state === 'up_for_reschedule' ||
    state === 'deferred'
  );
  const pollingInterval = getTaskPollingInterval(states);
  
  return {
    hasActiveTasks,
    pollingInterval,
    isPolling: isFetching || isRefetching,
    activeTaskCount: states.filter(state => 
      state === 'running' || 
      state === 'queued' || 
      state === 'up_for_retry' || 
      state === 'up_for_reschedule' ||
      state === 'deferred'
    ).length,
    completedTaskCount: states.filter(state => 
      state === 'success' || 
      state === 'failed' || 
      state === 'skipped' || 
      state === 'upstream_failed'
    ).length,
  };
}