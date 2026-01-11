/**
 * React Query hooks for DAG data fetching with real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { airflowApiClient } from '../services/airflowApiClient';
import { useAppDispatch } from '../store';
import { addNotification } from '../store/slices/uiSlice';
import type { DAGFilters } from '../types/app';
import type { GetDAGsParams, TriggerDAGRequest } from '../types/api';

// Query keys for React Query
export const dagQueryKeys = {
  all: ['dags'] as const,
  lists: () => [...dagQueryKeys.all, 'list'] as const,
  list: (filters: DAGFilters) => [...dagQueryKeys.lists(), filters] as const,
  details: () => [...dagQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...dagQueryKeys.details(), id] as const,
};

/**
 * Hook for fetching DAGs with real-time updates
 */
export function useDAGsQuery(filters: DAGFilters = {}) {
  const dispatch = useAppDispatch();

  const params: Partial<GetDAGsParams> = {
    limit: 100,
    offset: 0,
    dag_id_pattern: filters.search,
    paused: filters.paused,
    only_active: filters.only_active,
    tags: filters.tags,
  };

  return useQuery({
    queryKey: dagQueryKeys.list(filters),
    queryFn: async () => {
      try {
        const response = await airflowApiClient.getDAGs(params);
        return response.data;
      } catch (error: any) {
        dispatch(addNotification({
          type: 'error',
          title: 'Failed to fetch DAGs',
          message: error.message || 'Unable to load DAG list',
          autoHide: true,
          duration: 5000,
        }));
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    refetchIntervalInBackground: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

/**
 * Hook for fetching a single DAG with real-time updates
 */
export function useDAGQuery(dagId: string, enabled = true) {
  const dispatch = useAppDispatch();

  return useQuery({
    queryKey: dagQueryKeys.detail(dagId),
    queryFn: async () => {
      try {
        const response = await airflowApiClient.getDAG(dagId);
        return response.data;
      } catch (error: any) {
        dispatch(addNotification({
          type: 'error',
          title: 'Failed to fetch DAG details',
          message: error.message || `Unable to load DAG "${dagId}"`,
          autoHide: true,
          duration: 5000,
        }));
        throw error;
      }
    },
    enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refresh every minute
    refetchIntervalInBackground: true,
  });
}

/**
 * Hook for triggering DAG runs
 */
export function useTriggerDAGMutation() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (request: TriggerDAGRequest) => {
      const response = await airflowApiClient.triggerDAG(request);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch DAG queries
      queryClient.invalidateQueries({ queryKey: dagQueryKeys.all });
      
      // Show success notification
      dispatch(addNotification({
        type: 'success',
        title: 'DAG Triggered Successfully',
        message: `DAG "${variables.dag_id}" has been triggered successfully.`,
        autoHide: true,
        duration: 5000,
      }));
    },
    onError: (error: any, variables) => {
      dispatch(addNotification({
        type: 'error',
        title: 'DAG Trigger Failed',
        message: `Failed to trigger DAG "${variables.dag_id}": ${error.message}`,
        autoHide: true,
        duration: 8000,
      }));
    },
  });
}

/**
 * Hook for pausing/unpausing DAGs
 */
export function useUpdateDAGMutation() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async ({ dagId, isPaused }: { dagId: string; isPaused: boolean }) => {
      const response = await airflowApiClient.updateDAG(dagId, isPaused);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch DAG queries
      queryClient.invalidateQueries({ queryKey: dagQueryKeys.all });
      
      const action = variables.isPaused ? 'paused' : 'unpaused';
      dispatch(addNotification({
        type: 'success',
        title: `DAG ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        message: `DAG "${variables.dagId}" has been ${action} successfully.`,
        autoHide: true,
        duration: 4000,
      }));
    },
    onError: (error: any, variables) => {
      const action = variables.isPaused ? 'pause' : 'unpause';
      dispatch(addNotification({
        type: 'error',
        title: `Failed to ${action} DAG`,
        message: `Failed to ${action} DAG "${variables.dagId}": ${error.message}`,
        autoHide: true,
        duration: 6000,
      }));
    },
  });
}

/**
 * Hook for manual refresh of DAG data
 */
export function useRefreshDAGs() {
  const queryClient = useQueryClient();

  return {
    refreshAll: () => {
      queryClient.invalidateQueries({ queryKey: dagQueryKeys.all });
    },
    refreshList: (filters: DAGFilters = {}) => {
      queryClient.invalidateQueries({ queryKey: dagQueryKeys.list(filters) });
    },
    refreshDAG: (dagId: string) => {
      queryClient.invalidateQueries({ queryKey: dagQueryKeys.detail(dagId) });
    },
  };
}