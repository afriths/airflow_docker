# Real-time Updates System

This document explains how to use the real-time updates system implemented for the Airflow UI Dashboard.

## Overview

The real-time updates system uses React Query to provide automatic data polling with smart refresh intervals based on the state of DAGs, DAG runs, and task instances. The system automatically adjusts polling frequencies to balance real-time updates with performance.

## Key Features

- **Smart Polling Intervals**: Different polling frequencies for active vs completed runs
- **Automatic Refresh**: Data refreshes automatically based on state
- **Manual Refresh Controls**: Users can manually refresh data
- **Offline Detection**: Handles network connectivity issues
- **Background Polling**: Continues polling when the page is in the background
- **Real-time Status Indicator**: Shows current polling status and connection state

## Polling Intervals

### DAGs
- **Active DAGs**: 30 seconds
- **All DAGs**: 30 seconds (consistent refresh for overview)

### DAG Runs
- **Active runs** (running, queued): 10 seconds
- **Completed runs** (success, failed): 60 seconds

### Task Instances
- **Active tasks** (running, queued, up_for_retry, etc.): 5 seconds
- **Completed tasks** (success, failed, skipped, etc.): 30 seconds

## Usage

### Basic Data Fetching

```typescript
import { useDAGsQuery, useDAGRunsQuery, useTaskInstancesQuery } from '../hooks';

// Fetch DAGs with real-time updates
const { data: dags, isLoading, error } = useDAGsQuery();

// Fetch DAG runs with smart polling
const { data: dagRuns } = useDAGRunsQuery(dagId, filters);

// Fetch task instances with real-time updates
const { data: tasks } = useTaskInstancesQuery(dagId, dagRunId, filters);
```

### Manual Refresh

```typescript
import { useRefreshDAGs, useRefreshDAGRuns, useRefreshTaskInstances } from '../hooks';

const { refreshAll, refreshList, refreshDAG } = useRefreshDAGs();
const { refreshDAGRuns } = useRefreshDAGRuns();
const { refreshTaskInstances } = useRefreshTaskInstances();

// Refresh all DAGs
refreshAll();

// Refresh specific DAG runs
refreshDAGRuns(dagId, filters);
```

### Real-time Status

```typescript
import { useRealTimeUpdates, useRealTimeStatus } from '../hooks';

// Get overall real-time status
const { isOnline, lastRefresh, refreshAll } = useRealTimeUpdates();

// Get detailed polling status
const { isPolling, hasErrors, lastUpdate } = useRealTimeStatus();
```

### Polling Status Information

```typescript
import { useDAGRunPollingStatus, useTaskPollingStatus } from '../hooks';

// Get DAG run polling information
const { 
  hasActiveRuns, 
  pollingInterval, 
  activeRunCount 
} = useDAGRunPollingStatus(dagId, filters);

// Get task polling information
const { 
  hasActiveTasks, 
  pollingInterval, 
  activeTaskCount 
} = useTaskPollingStatus(dagId, dagRunId, filters);
```

## Components

### RealTimeStatusIndicator

Shows the current status of real-time updates:

```typescript
import { RealTimeStatusIndicator } from '../components';

// Basic usage
<RealTimeStatusIndicator />

// With options
<RealTimeStatusIndicator 
  showRefreshButton={true}
  showSettings={true}
  compact={false}
/>
```

### Integration in Existing Components

The system is already integrated into:
- **DAGList**: Shows real-time DAG status updates
- **DAGRunHistory**: Displays run history with smart polling
- **DashboardHeader**: Shows global real-time status

## Configuration

### Query Client Setup

The React Query client is configured in `main.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Custom Configuration

You can customize polling behavior:

```typescript
import { useRealTimeUpdates } from '../hooks';

const { refreshAll } = useRealTimeUpdates({
  enableAutoRefresh: true,
  dagPollingInterval: 45 * 1000, // 45 seconds
  backgroundPolling: true,
});
```

## Error Handling

The system includes comprehensive error handling:

- **Network errors**: Automatic retry with exponential backoff
- **API errors**: User-friendly error messages
- **Offline detection**: Pauses polling when offline
- **Connection restoration**: Resumes polling when back online

## Performance Considerations

- **Smart intervals**: Reduces API calls for inactive data
- **Background optimization**: Adjusts polling when page is not visible
- **Caching**: Uses React Query's built-in caching
- **Stale-while-revalidate**: Shows cached data while fetching updates

## Best Practices

1. **Use appropriate filters**: Limit data fetching to what's needed
2. **Handle loading states**: Show loading indicators during updates
3. **Provide manual refresh**: Always include manual refresh options
4. **Monitor polling status**: Use status indicators to show activity
5. **Handle errors gracefully**: Provide fallbacks for failed requests

## Troubleshooting

### High API Usage
- Check polling intervals are appropriate
- Ensure filters are being used effectively
- Monitor for unnecessary re-renders

### Stale Data
- Verify network connectivity
- Check if polling is paused
- Use manual refresh to force updates

### Performance Issues
- Reduce polling frequency for non-critical data
- Implement pagination for large datasets
- Use React.memo for expensive components

## Migration from Redux

The new system replaces Redux-based data fetching:

```typescript
// Old Redux approach
const dispatch = useAppDispatch();
const { items, loading, error } = useAppSelector(state => state.dags);

useEffect(() => {
  dispatch(fetchDAGs());
}, [dispatch]);

// New React Query approach
const { data: dags, isLoading, error } = useDAGsQuery();
```

Benefits of the new approach:
- Automatic caching and synchronization
- Built-in loading and error states
- Smart background updates
- Reduced boilerplate code
- Better performance and user experience