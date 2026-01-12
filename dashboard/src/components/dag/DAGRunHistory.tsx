/**
 * DAG Run History Component
 * Displays DAG run history with sorting, filtering, pagination, and detailed run view
 * Implements requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Paper,
  Stack,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  AccessTime as RunningIcon,
  Queue as QueuedIcon,
  Visibility as ViewIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { 
  useDAGRunsQuery, 
  useDAGRunPollingStatus, 
  useRefreshDAGRuns,
  useTaskInstancesQuery 
} from '../../hooks';
import { RealTimeStatusIndicator } from '../common';
import { TaskStatus } from '../task';
import type { DAGRunFilters, DAGRun } from '../../types/app';
import type { DAGRunState, DAGRunType } from '../../types/airflow';

interface DAGRunHistoryProps {
  dagId: string;
}

type SortField = 'execution_date' | 'start_date' | 'end_date' | 'state' | 'run_type' | 'duration';
type SortOrder = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  order: SortOrder;
}

const ITEMS_PER_PAGE = 25;

const DAGRunHistory: React.FC<DAGRunHistoryProps> = ({ dagId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [runTypeFilter, setRunTypeFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'execution_date',
    order: 'desc'
  });
  const [selectedRun, setSelectedRun] = useState<DAGRun | null>(null);
  const [runDetailOpen, setRunDetailOpen] = useState(false);

  // Build filters for React Query
  const filters: DAGRunFilters = useMemo(() => ({
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
    state: stateFilter !== 'all' ? [stateFilter as DAGRunState] : undefined,
    run_type: runTypeFilter !== 'all' ? [runTypeFilter as DAGRunType] : undefined,
    order_by: `${sortConfig.order === 'desc' ? '-' : ''}${sortConfig.field}`,
  }), [currentPage, stateFilter, runTypeFilter, sortConfig]);

  // React Query hooks with real-time updates
  const { 
    data: dagRunCollection, 
    isLoading, 
    error, 
    isFetching,
    dataUpdatedAt 
  } = useDAGRunsQuery(dagId, filters);

  const { refreshDAGRuns } = useRefreshDAGRuns();
  const pollingStatus = useDAGRunPollingStatus(dagId, filters);

  // Task instances for selected run detail view
  const { 
    data: taskInstanceCollection,
    isLoading: isLoadingTasks,
    error: tasksError
  } = useTaskInstancesQuery(
    selectedRun?.dag_id || '',
    selectedRun?.dag_run_id || '',
    { limit: 100 },
    !!selectedRun
  );

  const dagRuns = dagRunCollection?.dag_runs || [];
  const totalRuns = dagRunCollection?.total_entries || 0;
  const totalPages = Math.ceil(totalRuns / ITEMS_PER_PAGE);
  const taskInstances = taskInstanceCollection?.task_instances || [];

  // Handle manual refresh
  const handleRefresh = () => {
    refreshDAGRuns(dagId, filters);
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Handle run detail view
  const handleViewRunDetail = (run: DAGRun) => {
    setSelectedRun(run);
    setRunDetailOpen(true);
  };

  const handleCloseRunDetail = () => {
    setRunDetailOpen(false);
    setSelectedRun(null);
  };

  // Get status display for DAG run
  const getRunStatusDisplay = (state: DAGRunState) => {
    switch (state) {
      case 'success':
        return {
          icon: <SuccessIcon fontSize="small" />,
          color: 'success' as const,
          label: 'Success',
        };
      case 'failed':
        return {
          icon: <ErrorIcon fontSize="small" />,
          color: 'error' as const,
          label: 'Failed',
        };
      case 'running':
        return {
          icon: <RunningIcon fontSize="small" />,
          color: 'primary' as const,
          label: 'Running',
        };
      case 'queued':
        return {
          icon: <QueuedIcon fontSize="small" />,
          color: 'warning' as const,
          label: 'Queued',
        };
      default:
        return {
          icon: <PlayIcon fontSize="small" />,
          color: 'default' as const,
          label: state,
        };
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  // Calculate duration
  const calculateDuration = (startDate: string | null, endDate: string | null) => {
    if (!startDate) return '-';
    if (!endDate) return 'Running...';
    
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const duration = Math.floor((end - start) / 1000);
    
    if (duration < 60) return `${duration}s`;
    const minutes = Math.floor(duration / 60);
    if (minutes < 60) return `${minutes}m ${duration % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  // Get sortable table header
  const getSortableHeader = (field: SortField, label: string) => (
    <TableSortLabel
      active={sortConfig.field === field}
      direction={sortConfig.field === field ? sortConfig.order : 'asc'}
      onClick={() => handleSort(field)}
    >
      {label}
    </TableSortLabel>
  );

  return (
    <>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              DAG Run History
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Polling status info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {pollingStatus.hasActiveRuns ? 
                    `${pollingStatus.activeRunCount} active • polling every ${pollingStatus.pollingInterval / 1000}s` :
                    `${pollingStatus.completedRunCount} completed • polling every ${pollingStatus.pollingInterval / 1000}s`
                  }
                </Typography>
                {pollingStatus.isPolling && (
                  <CircularProgress size={12} />
                )}
              </Box>
              
              <RealTimeStatusIndicator showRefreshButton={false} compact />
              
              <Tooltip title="Refresh runs">
                <IconButton size="small" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Filters and Sorting Controls */}
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>State</InputLabel>
              <Select
                value={stateFilter}
                label="State"
                onChange={e => {
                  setStateFilter(e.target.value);
                  setCurrentPage(1); // Reset to first page
                }}
              >
                <MenuItem value="all">All States</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="running">Running</MenuItem>
                <MenuItem value="queued">Queued</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Run Type</InputLabel>
              <Select
                value={runTypeFilter}
                label="Run Type"
                onChange={e => {
                  setRunTypeFilter(e.target.value);
                  setCurrentPage(1); // Reset to first page
                }}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="manual">Manual</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="dataset_triggered">Dataset Triggered</MenuItem>
                <MenuItem value="backfill">Backfill</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SortIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Sorted by {sortConfig.field} ({sortConfig.order})
              </Typography>
            </Box>

            {dataUpdatedAt && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
              </Typography>
            )}
          </Box>

          {/* Error display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message || 'Failed to load DAG runs'}
            </Alert>
          )}

          {/* Loading state */}
          {isLoading && dagRuns.length === 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* No results */}
          {!isLoading && dagRuns.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No DAG runs found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stateFilter !== 'all' || runTypeFilter !== 'all' 
                  ? 'Try adjusting the filters' 
                  : 'This DAG has not been executed yet'
                }
              </Typography>
            </Box>
          )}

          {/* DAG runs table */}
          {dagRuns.length > 0 && (
            <TableContainer sx={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>{getSortableHeader('execution_date', 'Execution Date')}</TableCell>
                    <TableCell>Run ID</TableCell>
                    <TableCell>{getSortableHeader('run_type', 'Type')}</TableCell>
                    <TableCell>{getSortableHeader('start_date', 'Start Date')}</TableCell>
                    <TableCell>{getSortableHeader('end_date', 'End Date')}</TableCell>
                    <TableCell>{getSortableHeader('duration', 'Duration')}</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dagRuns.map(run => {
                    const statusDisplay = getRunStatusDisplay(run.state);
                    
                    return (
                      <TableRow key={run.dag_run_id} hover>
                        <TableCell>
                          <Chip
                            icon={statusDisplay.icon}
                            label={statusDisplay.label}
                            color={statusDisplay.color}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(run.execution_date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {run.dag_run_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={run.run_type}
                            size="small"
                            variant="outlined"
                            color={run.run_type === 'manual' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(run.start_date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(run.end_date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {calculateDuration(run.start_date, run.end_date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View run details">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewRunDetail(run)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {/* Results summary */}
          {dagRuns.length > 0 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Showing {dagRuns.length} of {totalRuns} runs
                {(stateFilter !== 'all' || runTypeFilter !== 'all') && 
                  ` (filtered by ${[
                    stateFilter !== 'all' ? `state: ${stateFilter}` : '',
                    runTypeFilter !== 'all' ? `type: ${runTypeFilter}` : ''
                  ].filter(Boolean).join(', ')})`
                }
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Run Detail Dialog */}
      <Dialog 
        open={runDetailOpen} 
        onClose={handleCloseRunDetail}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              DAG Run Details: {selectedRun?.dag_run_id}
            </Typography>
            {selectedRun && (
              <Chip
                icon={getRunStatusDisplay(selectedRun.state).icon}
                label={getRunStatusDisplay(selectedRun.state).label}
                color={getRunStatusDisplay(selectedRun.state).color}
                variant="outlined"
              />
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedRun && (
            <Grid container spacing={3}>
              {/* Run Information */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Run Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Execution Date
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(selectedRun.execution_date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Start Date
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(selectedRun.start_date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        End Date
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(selectedRun.end_date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="body2">
                        {calculateDuration(selectedRun.start_date, selectedRun.end_date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Run Type
                      </Typography>
                      <Chip
                        label={selectedRun.run_type}
                        size="small"
                        variant="outlined"
                        color={selectedRun.run_type === 'manual' ? 'primary' : 'default'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        External Trigger
                      </Typography>
                      <Typography variant="body2">
                        {selectedRun.external_trigger ? 'Yes' : 'No'}
                      </Typography>
                    </Grid>
                    {selectedRun.conf && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Configuration
                        </Typography>
                        <Box sx={{ 
                          bgcolor: 'grey.100', 
                          p: 1, 
                          borderRadius: 1, 
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(selectedRun.conf, null, 2)}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>

              {/* Task Breakdown */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Task Breakdown
                  </Typography>
                  
                  {isLoadingTasks && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  )}

                  {tasksError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      Failed to load task instances: {tasksError.message}
                    </Alert>
                  )}

                  {!isLoadingTasks && !tasksError && taskInstances.length > 0 && (
                    <TaskStatus
                      dagId={dagId}
                      dagRunId={selectedRun.dag_run_id}
                      tasks={taskInstances}
                      onTaskClick={() => {}} // Task detail modal handled by TaskStatus component
                      onRefresh={() => {}} // Refresh handled by the query
                      loading={isLoadingTasks}
                      error={tasksError?.message || null}
                    />
                  )}

                  {!isLoadingTasks && !tasksError && taskInstances.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No task instances found for this run
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseRunDetail}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DAGRunHistory;