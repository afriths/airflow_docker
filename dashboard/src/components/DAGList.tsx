/**
 * DAG List Component
 * Displays a list of DAGs with search, filtering, and pagination capabilities
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Button,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  RadioButtonUnchecked as IdleIcon,
  AccessTime as RunningIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchDAGs,
  triggerDAG,
  pauseDAG,
  unpauseDAG,
} from '../store/slices/dagsSlice';
import type { DAG, DAGFilters } from '../types/app';

interface DAGListProps {
  onDAGSelect?: (dagId: string) => void;
  selectedDAGId?: string | null;
}

const ITEMS_PER_PAGE = 10;

const DAGList: React.FC<DAGListProps> = ({ onDAGSelect, selectedDAGId }) => {
  const dispatch = useAppDispatch();
  const {
    items: dags,
    loading,
    error,
    lastUpdated,
  } = useAppSelector(state => state.dags);

  // Local state for filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pausedFilter, setPausedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [triggeringDAGs, setTriggeringDAGs] = useState<Set<string>>(new Set());

  // Fetch DAGs on component mount and when filters change
  useEffect(() => {
    const filters: DAGFilters = {};
    if (searchTerm) filters.search = searchTerm;
    if (pausedFilter !== 'all') filters.paused = pausedFilter === 'paused';

    dispatch(fetchDAGs(filters));
  }, [dispatch, searchTerm, pausedFilter]);

  // Filter and paginate DAGs
  const filteredDAGs = useMemo(() => {
    let filtered = dags;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        dag =>
          dag.dag_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (dag.description &&
            dag.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          dag.owners.some(owner =>
            owner.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(dag => {
        switch (statusFilter) {
          case 'success':
            return dag.last_run_state === 'success';
          case 'failed':
            return dag.last_run_state === 'failed';
          case 'running':
            return dag.last_run_state === 'running';
          case 'never_run':
            return dag.last_run_state === null;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [dags, searchTerm, statusFilter]);

  // Paginate filtered DAGs
  const paginatedDAGs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDAGs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDAGs, currentPage]);

  const totalPages = Math.ceil(filteredDAGs.length / ITEMS_PER_PAGE);

  // Handle refresh
  const handleRefresh = () => {
    const filters: DAGFilters = {};
    if (searchTerm) filters.search = searchTerm;
    if (pausedFilter !== 'all') filters.paused = pausedFilter === 'paused';

    dispatch(fetchDAGs(filters));
  };

  // Handle DAG trigger
  const handleTriggerDAG = async (dagId: string) => {
    setTriggeringDAGs(prev => new Set(prev).add(dagId));
    try {
      await dispatch(triggerDAG({ dagId })).unwrap();
    } catch (error) {
      console.error('Failed to trigger DAG:', error);
    } finally {
      setTriggeringDAGs(prev => {
        const newSet = new Set(prev);
        newSet.delete(dagId);
        return newSet;
      });
    }
  };

  // Handle DAG pause/unpause
  const handleTogglePause = async (dag: DAG) => {
    try {
      if (dag.is_paused) {
        await dispatch(unpauseDAG(dag.dag_id)).unwrap();
      } else {
        await dispatch(pauseDAG(dag.dag_id)).unwrap();
      }
    } catch (error) {
      console.error('Failed to toggle DAG pause state:', error);
    }
  };

  // Get status icon and color
  const getStatusDisplay = (dag: DAG) => {
    if (dag.has_import_errors) {
      return {
        icon: <ErrorIcon />,
        color: 'error' as const,
        label: 'Import Error',
      };
    }

    switch (dag.last_run_state) {
      case 'success':
        return {
          icon: <SuccessIcon />,
          color: 'success' as const,
          label: 'Success',
        };
      case 'failed':
        return {
          icon: <ErrorIcon />,
          color: 'error' as const,
          label: 'Failed',
        };
      case 'running':
        return {
          icon: <RunningIcon />,
          color: 'primary' as const,
          label: 'Running',
        };
      default:
        return {
          icon: <IdleIcon />,
          color: 'default' as const,
          label: 'Never Run',
        };
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      {/* Header with search and filters */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '2fr 1fr 1fr 2fr',
            },
            gap: 2,
            alignItems: 'center',
          }}
        >
          <TextField
            fullWidth
            placeholder="Search DAGs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={e => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="running">Running</MenuItem>
              <MenuItem value="never_run">Never Run</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>State</InputLabel>
            <Select
              value={pausedFilter}
              label="State"
              onChange={e => setPausedFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="paused">Paused</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Tooltip title="Refresh DAGs">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {lastUpdated && (
              <Typography
                variant="caption"
                sx={{ alignSelf: 'center', color: 'text.secondary' }}
              >
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading && dags.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* DAG list */}
      {!loading && paginatedDAGs.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No DAGs found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || statusFilter !== 'all' || pausedFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No DAGs are available'}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {paginatedDAGs.map(dag => {
          const statusDisplay = getStatusDisplay(dag);
          const isTriggering = triggeringDAGs.has(dag.dag_id);
          const isSelected = selectedDAGId === dag.dag_id;

          return (
            <Card
              key={dag.dag_id}
              sx={{
                cursor: onDAGSelect ? 'pointer' : 'default',
                border: isSelected ? 2 : 1,
                borderColor: isSelected ? 'primary.main' : 'divider',
                '&:hover': onDAGSelect
                  ? {
                      boxShadow: 2,
                    }
                  : {},
              }}
              onClick={() => onDAGSelect?.(dag.dag_id)}
            >
                <CardContent>
                  <Box
                    sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}
                  >
                    {/* Status indicator */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: 120,
                      }}
                    >
                      <Chip
                        icon={statusDisplay.icon}
                        label={statusDisplay.label}
                        color={statusDisplay.color}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    {/* DAG info */}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="h6"
                          component="h3"
                          sx={{ fontWeight: 600 }}
                        >
                          {dag.dag_id}
                        </Typography>
                        {dag.is_paused && (
                          <Chip
                            label="Paused"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                        {dag.has_import_errors && (
                          <Chip
                            label="Import Error"
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        )}
                      </Box>

                      {dag.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {dag.description}
                        </Typography>
                      )}

                      <Stack
                        direction="row"
                        spacing={2}
                        divider={<Divider orientation="vertical" flexItem />}
                      >
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Last Run
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(dag.last_run_date)}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Next Run
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(dag.next_dagrun)}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Schedule
                          </Typography>
                          <Typography variant="body2">
                            {dag.schedule_interval || 'None'}
                          </Typography>
                        </Box>

                        {dag.owners.length > 0 && (
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Owners
                            </Typography>
                            <Typography variant="body2">
                              {dag.owners.join(', ')}
                            </Typography>
                          </Box>
                        )}
                      </Stack>

                      {dag.tags.length > 0 && (
                        <Box
                          sx={{
                            mt: 1,
                            display: 'flex',
                            gap: 0.5,
                            flexWrap: 'wrap',
                          }}
                        >
                          {dag.tags.map(tag => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem', height: 20 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>

                    {/* Actions */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        minWidth: 100,
                      }}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={
                          isTriggering ? (
                            <CircularProgress size={16} />
                          ) : (
                            <PlayIcon />
                          )
                        }
                        onClick={e => {
                          e.stopPropagation();
                          handleTriggerDAG(dag.dag_id);
                        }}
                        disabled={isTriggering || dag.has_import_errors}
                        sx={{ minWidth: 90 }}
                      >
                        {isTriggering ? 'Triggering...' : 'Trigger'}
                      </Button>

                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={dag.is_paused ? <PlayIcon /> : <PauseIcon />}
                        onClick={e => {
                          e.stopPropagation();
                          handleTogglePause(dag);
                        }}
                        disabled={loading || dag.has_import_errors}
                        sx={{ minWidth: 90 }}
                      >
                        {dag.is_paused ? 'Unpause' : 'Pause'}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
        })}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
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
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {paginatedDAGs.length} of {filteredDAGs.length} DAGs
          {filteredDAGs.length !== dags.length &&
            ` (filtered from ${dags.length} total)`}
        </Typography>
      </Box>
    </Box>
  );
};

export default DAGList;
