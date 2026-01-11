/**
 * React Query hooks for DAG Run data fetching with smart polling intervals
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { airflowApiClient } from '../services/airflowApiClient';
import { useAppDispatch } from '../store';
import { addNotification } from '../store/slices/uiSlice';
import type { DAGRunFilters } from '../types/app';
import type { GetDAGRunsParams } from '../types/api';
import type { DAGRunState } from '../types/airflow';

// Query keys for React Query
export const dagRunQueryKeys = {
  all: ['dagRuns'] as const,
  lists: () => [...dagRunQueryKeys.all, 'list'] as const,
  list: (dagId: string, filters: DAGRunFilters) => [...dagRunQueryKeys.lists(), dagId, filters] as const,
  details: () => [...dagRunQueryKeys.all, 'detail'] as const,
  detail: (dagId: string, dagRunId: string) => [...dagRunQueryKeys.details(), dagId, dagRunId] as const,
};

/**
 * Determine polling interval based on DAG run states
 * Active runs (running, queued) poll more frequently
 */
function getPollingInterval(states: DAGRunState[]): number {
  const hasActiveRuns = states.some(state => state === 'running' || state === 'queued');
  
  if (hasActiveRuns) {
    return 10 * 1000; // 10 seconds for active runs
  } else {
    return 60 * 1000; // 1 minute for completed runs
  }
}

/**
 * Hook for fetching DAG runs with smart polling based on run states
 */
export function useDAGRunsQuery(dagId: string, filters: DAGRunFilters = {}, enabled = true) {
  const dispatch = useAppDispatch();

  const params: GetDAGRunsParams = {
    dag_id: dagId,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
    state: filters.state,
    execution_date_gte: filters.execution_date_gte,
    execution_date_lte: filters.execution_date_lte,
    start_date_gte: filters.start_date_gte,
    start_date_lte: filters.start_date_lte,
    end_date_gte: filters.end_date_gte,
    end_date_lte: filters.end_date_lte,
    order_by: filters.order_by || '-execution_date',
  };

  return useQuery({
    queryKey: dagRunQueryKeys.list(dagId, filters),
    queryFn: async () => {
      try {
        const response = await airflowApiClient.getDAGRuns(params);
        return response.data;
      } catch (error: any) {
        dispatch(addNotification({
          type: 'error',
          title: 'Failed to fetch DAG runs',
          message: error.message || `Unable to load runs for DAG "${dagId}"`,
          autoHide: true,
          duration: 5000,
        }));
        throw error;
      }
    },
    enabled,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: (data) => {
      if (!data?.data) return false;
      
      const states = data.data.dag_runs.map(run => run.state);
      return getPollingInterval(states);
    },
    refetchIntervalInBackground: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

/**
 * Hook for fetching a single DAG run with real-time updates
 */
export function useDAGRunQuery(dagId: string, dagRunId: string, enabled = true) {
  const dispatch = useAppDispatch();

  return useQuery({
    queryKey: dagRunQueryKeys.detail(dagId, dagRunId),
    queryFn: async () => {
      try {
        const response = await airflowApiClient.getDAGRun(dagId, dagRunId);
        return response.data;
      } catch (error: any) {
        dispatch(addNotification({
          type: 'error',
          title: 'Failed to fetch DAG run details',
          message: error.message || `Unable to load run "${dagRunId}" for DAG "${dagId}"`,
          autoHide: true,
          duration: 5000,
        }));
        throw error;
      }
    },
    enabled,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: (data) => {
      if (!data?.data) return false;
      
      const state = data.data.state;
      // Poll more frequently for active runs
      if (state === 'running' || state === 'queued') {
        return 5 * 1000; // 5 seconds
      } else {
        return 30 * 1000; // 30 seconds for completed runs
      }
    },
    refetchIntervalInBackground: true,
  });
}

/**
 * Hook for deleting DAG runs
 */
export function useDeleteDAGRunMutation() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async ({ dagId, dagRunId }: { dagId: string; dagRunId: string }) => {
      const response = await airflowApiClient.deleteDAGRun(dagId, dagRunId);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch DAG run queries
      queryClient.invalidateQueries({ queryKey: dagRunQueryKeys.all });
      
      dispatch(addNotification({
        type: 'success',
        title: 'DAG Run Deleted',
        message: `DAG run "${variables.dagRunId}" has been deleted successfully.`,
        autoHide: true,
        duration: 4000,
      }));
    },
    onError: (error: any, variables) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to delete DAG run',
        message: `Failed to delete run "${variables.dagRunId}": ${error.message}`,
        autoHide: true,
        duration: 6000,
      }));
    },
  });
}

/**
 * Hook for manual refresh of DAG run data
 */
export function useRefreshDAGRuns() {
  const queryClient = useQueryClient();

  return {
    refreshAll: () => {
      queryClient.invalidateQueries({ queryKey: dagRunQueryKeys.all });
    },
    refreshDAGRuns: (dagId: string, filters: DAGRunFilters = {}) => {
      queryClient.invalidateQueries({ queryKey: dagRunQueryKeys.list(dagId, filters) });
    },
    refreshDAGRun: (dagId: string, dagRunId: string) => {
      queryClient.invalidateQueries({ queryKey: dagRunQueryKeys.detail(dagId, dagRunId) });
    },
  };
}

/**
 * Hook for getting the current polling status and intervals
 */
export function useDAGRunPollingStatus(dagId: string, filters: DAGRunFilters = {}) {
  const { data, isFetching, isRefetching } = useDAGRunsQuery(dagId, filters);
  
  const states = data?.dag_runs?.map(run => run.state) || [];
  const hasActiveRuns = states.some(state => state === 'running' || state === 'queued');
  const pollingInterval = getPollingInterval(states);
  
  return {
    hasActiveRuns,
    pollingInterval,
    isPolling: isFetching || isRefetching,
    activeRunCount: states.filter(state => state === 'running' || state === 'queued').length,
    completedRunCount: states.filter(state => state === 'success' || state === 'failed').length,
  };
}