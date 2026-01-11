/**
 * DAG Run History Component
 * Displays DAG run history with real-time updates
 * Example implementation using the new real-time hooks
 */

import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  AccessTime as RunningIcon,
  Queue as QueuedIcon,
} from '@mui/icons-material';
import { 
  useDAGRunsQuery, 
  useDAGRunPollingStatus, 
  useRefreshDAGRuns 
} from '../hooks';
import { RealTimeStatusIndicator } from './';
import type { DAGRunFilters } from '../types/app';
import type { DAGRunState } from '../types/airflow';

interface DAGRunHistoryProps {
  dagId: string;
}

const ITEMS_PER_PAGE = 25;

const DAGRunHistory: React.FC<DAGRunHistoryProps> = ({ dagId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [stateFilter, setStateFilter] = useState<string>('all');

  // Build filters for React Query
  const filters: DAGRunFilters = {
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
    state: stateFilter !== 'all' ? [stateFilter] : undefined,
    order_by: '-execution_date',
  };

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

  const dagRuns = dagRunCollection?.dag_runs || [];
  const totalRuns = dagRunCollection?.total_entries || 0;
  const totalPages = Math.ceil(totalRuns / ITEMS_PER_PAGE);

  // Handle manual refresh
  const handleRefresh = () => {
    refreshDAGRuns(dagId, filters);
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

  return (
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

        {/* Filters */}
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
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
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="running">Running</MenuItem>
              <MenuItem value="queued">Queued</MenuItem>
            </Select>
          </FormControl>
          
          {dataUpdatedAt && (
            <Typography variant="caption" color="text.secondary">
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

        {/* DAG runs table */}
        {!isLoading && dagRuns.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No DAG runs found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stateFilter !== 'all' ? 'Try changing the state filter' : 'This DAG has not been executed yet'}
            </Typography>
          </Box>
        )}

        {dagRuns.length > 0 && (
          <TableContainer sx={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Run ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Duration</TableCell>
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
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
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
              {stateFilter !== 'all' && ` (filtered by ${stateFilter})`}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DAGRunHistory;