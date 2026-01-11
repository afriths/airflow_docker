/**
 * Hooks Index
 * Central export point for all custom hooks
 */

export { useAuth, type UseAuthReturn } from './useAuth';

// Real-time data fetching hooks
export { 
  useDAGsQuery, 
  useDAGQuery, 
  useTriggerDAGMutation, 
  useUpdateDAGMutation, 
  useRefreshDAGs,
  dagQueryKeys 
} from './useDAGsQuery';

export { 
  useDAGRunsQuery, 
  useDAGRunQuery, 
  useDeleteDAGRunMutation, 
  useRefreshDAGRuns,
  useDAGRunPollingStatus,
  dagRunQueryKeys 
} from './useDAGRunsQuery';

export { 
  useTaskInstancesQuery, 
  useTaskInstanceQuery, 
  useTaskLogsQuery,
  useClearTaskInstanceMutation,
  useMarkTaskSuccessMutation,
  useMarkTaskFailedMutation,
  useRefreshTaskInstances,
  useTaskPollingStatus,
  taskInstanceQueryKeys 
} from './useTaskInstancesQuery';

export { 
  useRealTimeUpdates, 
  useRealTimeStatus,
  type RealTimeConfig 
} from './useRealTimeUpdates';
