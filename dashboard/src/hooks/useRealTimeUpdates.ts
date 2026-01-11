/**
 * Real-time updates hook for managing polling intervals and refresh logic
 */

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../store';
import { addNotification } from '../store/slices/uiSlice';
import { dagQueryKeys } from './useDAGsQuery';
import { dagRunQueryKeys } from './useDAGRunsQuery';
import { taskInstanceQueryKeys } from './useTaskInstancesQuery';

export interface RealTimeConfig {
  enableAutoRefresh: boolean;
  dagPollingInterval: number;
  dagRunPollingInterval: number;
  taskPollingInterval: number;
  backgroundPolling: boolean;
}

const DEFAULT_CONFIG: RealTimeConfig = {
  enableAutoRefresh: true,
  dagPollingInterval: 30 * 1000, // 30 seconds
  dagRunPollingInterval: 10 * 1000, // 10 seconds
  taskPollingInterval: 5 * 1000, // 5 seconds
  backgroundPolling: true,
};

/**
 * Hook for managing real-time updates across the application
 */
export function useRealTimeUpdates(config: Partial<RealTimeConfig> = {}) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      dispatch(addNotification({
        type: 'success',
        title: 'Connection Restored',
        message: 'Real-time updates have resumed.',
        autoHide: true,
        duration: 3000,
      }));
      
      // Refresh all data when coming back online
      refreshAll();
    };

    const handleOffline = () => {
      setIsOnline(false);
      dispatch(addNotification({
        type: 'warning',
        title: 'Connection Lost',
        message: 'Real-time updates are paused. Data may be outdated.',
        autoHide: true,
        duration: 5000,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  // Monitor page visibility for background polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && finalConfig.backgroundPolling) {
        // Refresh data when page becomes visible
        refreshAll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [finalConfig.backgroundPolling]);

  // Manual refresh functions
  const refreshAll = useCallback(() => {
    if (!isOnline) return;

    queryClient.invalidateQueries({ queryKey: dagQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: dagRunQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: taskInstanceQueryKeys.all });
    
    setLastRefresh(new Date());
    setRefreshCount(prev => prev + 1);

    dispatch(addNotification({
      type: 'info',
      title: 'Data Refreshed',
      message: 'All data has been refreshed successfully.',
      autoHide: true,
      duration: 2000,
    }));
  }, [queryClient, dispatch, isOnline]);

  const refreshDAGs = useCallback(() => {
    if (!isOnline) return;

    queryClient.invalidateQueries({ queryKey: dagQueryKeys.all });
    setLastRefresh(new Date());
  }, [queryClient, isOnline]);

  const refreshDAGRuns = useCallback((dagId?: string) => {
    if (!isOnline) return;

    if (dagId) {
      queryClient.invalidateQueries({ 
        queryKey: dagRunQueryKeys.lists(),
        predicate: (query) => {
          const [, , queryDagId] = query.queryKey;
          return queryDagId === dagId;
        }
      });
    } else {
      queryClient.invalidateQueries({ queryKey: dagRunQueryKeys.all });
    }
    setLastRefresh(new Date());
  }, [queryClient, isOnline]);

  const refreshTaskInstances = useCallback((dagId?: string, dagRunId?: string) => {
    if (!isOnline) return;

    if (dagId && dagRunId) {
      queryClient.invalidateQueries({ 
        queryKey: taskInstanceQueryKeys.lists(),
        predicate: (query) => {
          const [, , queryDagId, queryDagRunId] = query.queryKey;
          return queryDagId === dagId && queryDagRunId === dagRunId;
        }
      });
    } else {
      queryClient.invalidateQueries({ queryKey: taskInstanceQueryKeys.all });
    }
    setLastRefresh(new Date());
  }, [queryClient, isOnline]);

  // Get polling status across all queries
  const getPollingStatus = useCallback(() => {
    const queries = queryClient.getQueryCache().getAll();
    
    const dagQueries = queries.filter(q => q.queryKey[0] === 'dags');
    const dagRunQueries = queries.filter(q => q.queryKey[0] === 'dagRuns');
    const taskQueries = queries.filter(q => q.queryKey[0] === 'taskInstances');

    const isPolling = queries.some(q => q.state.isFetching);
    const errorCount = queries.filter(q => q.state.error).length;
    const staleCount = queries.filter(q => q.state.isStale).length;

    return {
      isPolling,
      totalQueries: queries.length,
      dagQueries: dagQueries.length,
      dagRunQueries: dagRunQueries.length,
      taskQueries: taskQueries.length,
      errorCount,
      staleCount,
      isOnline,
      lastRefresh,
      refreshCount,
    };
  }, [queryClient, isOnline, lastRefresh, refreshCount]);

  // Pause/resume polling
  const pausePolling = useCallback(() => {
    queryClient.getQueryCache().getAll().forEach(query => {
      queryClient.cancelQueries({ queryKey: query.queryKey });
    });
  }, [queryClient]);

  const resumePolling = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  // Smart refresh based on data staleness
  const smartRefresh = useCallback(() => {
    if (!isOnline) return;

    const queries = queryClient.getQueryCache().getAll();
    const now = Date.now();
    
    // Refresh stale queries based on their type and age
    queries.forEach(query => {
      const age = now - (query.state.dataUpdatedAt || 0);
      const queryType = query.queryKey[0] as string;
      
      let shouldRefresh = false;
      
      switch (queryType) {
        case 'dags':
          shouldRefresh = age > finalConfig.dagPollingInterval;
          break;
        case 'dagRuns':
          shouldRefresh = age > finalConfig.dagRunPollingInterval;
          break;
        case 'taskInstances':
          shouldRefresh = age > finalConfig.taskPollingInterval;
          break;
      }
      
      if (shouldRefresh && query.state.isStale) {
        queryClient.invalidateQueries({ queryKey: query.queryKey });
      }
    });
    
    setLastRefresh(new Date());
  }, [queryClient, isOnline, finalConfig]);

  return {
    // Status
    isOnline,
    lastRefresh,
    refreshCount,
    getPollingStatus,
    
    // Manual refresh functions
    refreshAll,
    refreshDAGs,
    refreshDAGRuns,
    refreshTaskInstances,
    smartRefresh,
    
    // Polling control
    pausePolling,
    resumePolling,
    
    // Configuration
    config: finalConfig,
  };
}

/**
 * Hook for displaying real-time update status in the UI
 */
export function useRealTimeStatus() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState({
    isPolling: false,
    hasErrors: false,
    lastUpdate: null as Date | null,
    activeQueries: 0,
  });

  useEffect(() => {
    const updateStatus = () => {
      const queries = queryClient.getQueryCache().getAll();
      const isPolling = queries.some(q => q.state.isFetching);
      const hasErrors = queries.some(q => q.state.error);
      const activeQueries = queries.filter(q => !q.state.isStale).length;
      
      const lastUpdate = queries.reduce((latest, query) => {
        const updated = query.state.dataUpdatedAt;
        if (updated && (!latest || updated > latest.getTime())) {
          return new Date(updated);
        }
        return latest;
      }, null as Date | null);

      setStatus({
        isPolling,
        hasErrors,
        lastUpdate,
        activeQueries,
      });
    };

    // Update status immediately
    updateStatus();

    // Set up interval to update status
    const interval = setInterval(updateStatus, 1000);

    // Listen to query cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe(updateStatus);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [queryClient]);

  return status;
}