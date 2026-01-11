/**
 * DAG List Component
 * Displays a list of DAGs with search, filtering, and pagination capabilities
 * Enhanced with error handling and skeleton loading
 */

import React, { useState, useMemo } from 'react';
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
  Stack,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Error as ErrorIcon,
  RadioButtonUnchecked as IdleIcon,
} from '@mui/icons-material';
import { 
  useDAGsQuery, 
  useTriggerDAGMutation, 
  useUpdateDAGMutation, 
  useRefreshDAGs 
} from '../hooks';
import { 
  RealTimeStatusIndicator, 
  ErrorDisplay, 
  DAGListSkeleton,
  LoadingSpinner 
} from './';
import DAGTriggerDialog from './DAGTriggerDialog';
import { enhanceError } from '../services/errorHandler';
import type { DAG, DAGFilters } from '../types/app';

interface DAGListProps {
  onDAGSelect?: (dagId: string) => void;
  selectedDAGId?: string | null;
  dags?: DAG[];
  loading?: boolean;
  error?: any;
  onRefresh?: () => void;
}

const ITEMS_PER_PAGE = 10;

const DAGList: React.FC<DAGListProps> = ({ 
  onDAGSelect, 
  selectedDAGId,
  dags: propDags,
  loading: propLoading,
  error: propError,
  onRefresh: propOnRefresh,
}) => {
  // Local state for filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pausedFilter, setPausedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Trigger dialog state
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
  const [selectedDAGForTrigger, setSelectedDAGForTrigger] = useState<DAG | null>(null);

  // Build filters for React Query
  const filters: DAGFilters = useMemo(() => {
    const result: DAGFilters = {};
    if (searchTerm) result.search = searchTerm;
    if (pausedFilter !== 'all') result.paused = pausedFilter === 'paused';
    return result;
  }, [searchTerm, pausedFilter]);

  // React Query hooks (only use if props not provided)
  const queryResult = useDAGsQuery(filters, { enabled: !propDags });
  const { refreshList } = useRefreshDAGs();

  // Use props if provided, otherwise use query results
  const dags = propDags || queryResult.data?.dags || [];
  const isLoading = propLoading ?? queryResult.isLoading;
  const error = propError ?? queryResult.error;
  const isFetching = queryResult.isFetching;
  const dataUpdatedAt = queryResult.dataUpdatedAt;

  const triggerDAGMutation = useTriggerDAGMutation();
  const updateDAGMutation = useUpdateDAGMutation();

  // Filter and paginate DAGs
  const filteredDAGs = useMemo(() => {
    let filtered = dags;

    // Apply search filter (client-side for additional fields)
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
        const lastRunState = dag.last_run_state;
        
        switch (statusFilter) {
          case 'success':
            return lastRunState === 'success';
          case 'failed':
            return lastRunState === 'failed';
          case 'running':
            return lastRunState === 'running';
          case 'never_run':
            return lastRunState === null;
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
    if (propOnRefresh) {
      propOnRefresh();
    } else {
      refreshList(filters);
    }
  };

  // Handle DAG trigger - open confirmation dialog
  const handleTriggerDAG = (dag: DAG) => {
    setSelectedDAGForTrigger(dag);
    setTriggerDialogOpen(true);
  };

  // Handle trigger confirmation from dialog
  const handleTriggerConfirm = async (dagId: string, config?: object) => {
    try {
      await triggerDAGMutation.mutateAsync({ dag_id: dagId, conf: config });
      setTriggerDialogOpen(false);
      setSelectedDAGForTrigger(null);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  // Handle trigger dialog close
  const handleTriggerDialogClose = () => {
    if (!triggerDAGMutation.isPending) {
      setTriggerDialogOpen(false);
      setSelectedDAGForTrigger(null);
    }
  };

  // Handle DAG pause/unpause
  const handleTogglePause = async (dag: DAG) => {
    try {
      await updateDAGMutation.mutateAsync({ 
        dagId: dag.dag_id, 
        isPaused: !dag.is_paused 
      });
    } catch (error) {
      // Error handling is done in the mutation hook
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

    return {
      icon: <IdleIcon />,
      color: 'default' as const,
      label: 'Ready',
    };
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      {/* Header with search, filters, and real-time status */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: '2fr 1fr 1fr auto',
            },
            gap: 2,
            alignItems: 'center',
            mb: 3,
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

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, alignItems: 'center' }}>
            <RealTimeStatusIndicator showRefreshButton={false} compact />
            <Tooltip title="Refresh DAGs">
              <IconButton onClick={handleRefresh} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {dataUpdatedAt && (
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary' }}
              >
                Updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Error display */}
      {error && !isLoading && (
        <ErrorDisplay
          error={enhanceError(error)}
          onRetry={handleRefresh}
          showDetails={false}
          variant="alert"
        />
      )}

      {/* Loading state with skeleton */}
      {isLoading && dags.length === 0 && (
        <DAGListSkeleton count={6} />
      )}

      {/* Empty state */}
      {!isLoading && !error && paginatedDAGs.length === 0 && (
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

      {/* DAG list with loading overlay */}
      <Box sx={{ position: 'relative' }}>
        {isFetching && dags.length > 0 && (
          <LoadingSpinner
            overlay={true}
            message="Refreshing..."
            size="medium"
          />
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {paginatedDAGs.map(dag => {
            const statusDisplay = getStatusDisplay(dag);
            const isSelected = selectedDAGId === dag.dag_id;

            return (
              <Card
                key={dag.dag_id}
                sx={{
                  cursor: onDAGSelect ? 'pointer' : 'default',
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  opacity: isFetching ? 0.7 : 1,
                  transition: 'opacity 0.2s',
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
                              key={typeof tag === 'string' ? tag : tag.name}
                              label={typeof tag === 'string' ? tag : tag.name}
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
                        startIcon={<PlayIcon />}
                        onClick={e => {
                          e.stopPropagation();
                          handleTriggerDAG(dag);
                        }}
                        disabled={dag.has_import_errors || triggerDAGMutation.isPending}
                        sx={{ minWidth: 90 }}
                      >
                        Trigger
                      </Button>

                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={dag.is_paused ? <PlayIcon /> : <PauseIcon />}
                        onClick={e => {
                          e.stopPropagation();
                          handleTogglePause(dag);
                        }}
                        disabled={dag.has_import_errors || updateDAGMutation.isPending}
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

      {/* DAG Trigger Confirmation Dialog */}
      <DAGTriggerDialog
        open={triggerDialogOpen}
        dag={selectedDAGForTrigger}
        loading={triggerDAGMutation.isPending}
        error={triggerDAGMutation.error?.message || null}
        onClose={handleTriggerDialogClose}
        onConfirm={handleTriggerConfirm}
      />
    </Box>
  );
};

export default DAGList;