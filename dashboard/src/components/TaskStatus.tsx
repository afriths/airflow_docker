/**
 * Task Status Component
 * Displays task instances for a DAG run with status visualization and details
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Button,
  Grid,
  Tooltip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  RadioButtonUnchecked as QueuedIcon,
  PlayArrow as RunningIcon,
  SkipNext as SkippedIcon,
  Replay as RetryIcon,
  Schedule as ScheduledIcon,
  ArrowUpward as UpstreamFailedIcon,
  Remove as RemovedIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchTaskInstances } from '../store/slices/tasksSlice';
import { addNotification } from '../store/slices/uiSlice';
import TaskDetailModal from './TaskDetailModal';
import TaskLogViewer from './TaskLogViewer';
import TaskTimeline from './TaskTimeline';
import type { TaskInstance } from '../types/app';
import type { TaskStatusProps } from '../types/components';

const TaskStatus: React.FC<TaskStatusProps> = ({
  dagId,
  dagRunId,
  tasks,
  onTaskClick,
  onRefresh,
  loading,
  error,
}) => {
  const dispatch = useAppDispatch();
  
  // Local state
  const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [logViewerOpen, setLogViewerOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'task_id' | 'start_date' | 'duration' | 'state'>('task_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Get task status display properties
  const getTaskStatusDisplay = (state: TaskInstance['state']) => {
    switch (state) {
      case 'success':
        return {
          icon: <SuccessIcon />,
          color: 'success' as const,
          label: 'Success',
          bgColor: '#e8f5e8',
          textColor: '#2e7d32',
        };
      case 'failed':
        return {
          icon: <ErrorIcon />,
          color: 'error' as const,
          label: 'Failed',
          bgColor: '#ffebee',
          textColor: '#c62828',
        };
      case 'running':
        return {
          icon: <RunningIcon />,
          color: 'primary' as const,
          label: 'Running',
          bgColor: '#e3f2fd',
          textColor: '#1565c0',
        };
      case 'queued':
        return {
          icon: <QueuedIcon />,
          color: 'info' as const,
          label: 'Queued',
          bgColor: '#f3e5f5',
          textColor: '#7b1fa2',
        };
      case 'skipped':
        return {
          icon: <SkippedIcon />,
          color: 'default' as const,
          label: 'Skipped',
          bgColor: '#f5f5f5',
          textColor: '#616161',
        };
      case 'up_for_retry':
        return {
          icon: <RetryIcon />,
          color: 'warning' as const,
          label: 'Up for Retry',
          bgColor: '#fff3e0',
          textColor: '#ef6c00',
        };
      case 'up_for_reschedule':
        return {
          icon: <ScheduledIcon />,
          color: 'warning' as const,
          label: 'Up for Reschedule',
          bgColor: '#fff3e0',
          textColor: '#ef6c00',
        };
      case 'upstream_failed':
        return {
          icon: <UpstreamFailedIcon />,
          color: 'error' as const,
          label: 'Upstream Failed',
          bgColor: '#ffebee',
          textColor: '#c62828',
        };
      case 'deferred':
        return {
          icon: <ScheduledIcon />,
          color: 'info' as const,
          label: 'Deferred',
          bgColor: '#e1f5fe',
          textColor: '#0277bd',
        };
      case 'removed':
        return {
          icon: <RemovedIcon />,
          color: 'default' as const,
          label: 'Removed',
          bgColor: '#fafafa',
          textColor: '#424242',
        };
      default:
        return {
          icon: <QueuedIcon />,
          color: 'default' as const,
          label: 'Unknown',
          bgColor: '#f5f5f5',
          textColor: '#616161',
        };
    }
  };

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'task_id':
          aValue = a.task_id;
          bValue = b.task_id;
          break;
        case 'start_date':
          aValue = a.start_date ? new Date(a.start_date).getTime() : 0;
          bValue = b.start_date ? new Date(b.start_date).getTime() : 0;
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'state':
          aValue = a.state || '';
          bValue = b.state || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [tasks, sortBy, sortOrder]);

  // Calculate task statistics
  const taskStats = useMemo(() => {
    const stats = {
      total: tasks.length,
      success: 0,
      failed: 0,
      running: 0,
      queued: 0,
      skipped: 0,
      other: 0,
    };

    tasks.forEach(task => {
      switch (task.state) {
        case 'success':
          stats.success++;
          break;
        case 'failed':
        case 'upstream_failed':
          stats.failed++;
          break;
        case 'running':
          stats.running++;
          break;
        case 'queued':
          stats.queued++;
          break;
        case 'skipped':
          stats.skipped++;
          break;
        default:
          stats.other++;
      }
    });

    return stats;
  }, [tasks]);

  // Handle task click
  const handleTaskClick = (task: TaskInstance) => {
    setSelectedTask(task);
    setDetailModalOpen(true);
    onTaskClick(task.task_id);
  };

  // Handle view logs
  const handleViewLogs = (task: TaskInstance) => {
    setSelectedTask(task);
    setLogViewerOpen(true);
  };

  // Handle view timeline
  const handleViewTimeline = () => {
    setTimelineOpen(true);
  };

  // Format duration
  const formatDuration = (duration: number | null) => {
    if (!duration) return 'N/A';
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Handle sort change
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <Box>
      {/* Header with stats and actions */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Task Status ({tasks.length} tasks)
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="View Timeline">
              <IconButton onClick={handleViewTimeline} disabled={tasks.length === 0}>
                <TimelineIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh Tasks">
              <IconButton onClick={onRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Task statistics */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: '#e8f5e8', textAlign: 'center' }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="h6" sx={{ color: '#2e7d32' }}>
                  {taskStats.success}
                </Typography>
                <Typography variant="caption" sx={{ color: '#2e7d32' }}>
                  Success
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: '#ffebee', textAlign: 'center' }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="h6" sx={{ color: '#c62828' }}>
                  {taskStats.failed}
                </Typography>
                <Typography variant="caption" sx={{ color: '#c62828' }}>
                  Failed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: '#e3f2fd', textAlign: 'center' }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="h6" sx={{ color: '#1565c0' }}>
                  {taskStats.running}
                </Typography>
                <Typography variant="caption" sx={{ color: '#1565c0' }}>
                  Running
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: '#f3e5f5', textAlign: 'center' }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="h6" sx={{ color: '#7b1fa2' }}>
                  {taskStats.queued}
                </Typography>
                <Typography variant="caption" sx={{ color: '#7b1fa2' }}>
                  Queued
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: '#f5f5f5', textAlign: 'center' }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="h6" sx={{ color: '#616161' }}>
                  {taskStats.skipped}
                </Typography>
                <Typography variant="caption" sx={{ color: '#616161' }}>
                  Skipped
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: '#fff3e0', textAlign: 'center' }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="h6" sx={{ color: '#ef6c00' }}>
                  {taskStats.other}
                </Typography>
                <Typography variant="caption" sx={{ color: '#ef6c00' }}>
                  Other
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Progress bar for running tasks */}
        {taskStats.running > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Progress: {taskStats.success + taskStats.failed + taskStats.skipped} / {taskStats.total} tasks completed
            </Typography>
            <LinearProgress
              variant="determinate"
              value={((taskStats.success + taskStats.failed + taskStats.skipped) / taskStats.total) * 100}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
      </Box>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading && tasks.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* No tasks message */}
      {!loading && tasks.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No tasks found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This DAG run has no task instances
          </Typography>
        </Box>
      )}

      {/* Task list */}
      {tasks.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sortedTasks.map(task => {
            const statusDisplay = getTaskStatusDisplay(task.state);

            return (
              <Card
                key={task.task_id}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 2,
                  },
                  borderLeft: 4,
                  borderLeftColor: statusDisplay.textColor,
                }}
                onClick={() => handleTaskClick(task)}
              >
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Status indicator */}
                    <Box sx={{ minWidth: 120 }}>
                      <Chip
                        icon={statusDisplay.icon}
                        label={statusDisplay.label}
                        color={statusDisplay.color}
                        size="small"
                        variant="outlined"
                        sx={{
                          bgcolor: statusDisplay.bgColor,
                          color: statusDisplay.textColor,
                        }}
                      />
                    </Box>

                    {/* Task info */}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      >
                        {task.task_id}
                      </Typography>
                      
                      <Stack
                        direction="row"
                        spacing={2}
                        divider={<Divider orientation="vertical" flexItem />}
                      >
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Operator
                          </Typography>
                          <Typography variant="body2">
                            {task.operator}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Start Time
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(task.start_date)}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Duration
                          </Typography>
                          <Typography variant="body2">
                            {formatDuration(task.duration)}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Try {task.try_number}/{task.max_tries}
                          </Typography>
                          <Typography variant="body2">
                            Pool: {task.pool}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task);
                          }}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewLogs(task);
                        }}
                      >
                        Logs
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        open={detailModalOpen}
        task={selectedTask}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedTask(null);
        }}
        onViewLogs={() => {
          setDetailModalOpen(false);
          setLogViewerOpen(true);
        }}
      />

      {/* Task Log Viewer */}
      <TaskLogViewer
        open={logViewerOpen}
        dagId={dagId}
        dagRunId={dagRunId}
        taskId={selectedTask?.task_id || ''}
        onClose={() => {
          setLogViewerOpen(false);
          setSelectedTask(null);
        }}
      />

      {/* Task Timeline */}
      <TaskTimeline
        open={timelineOpen}
        tasks={tasks}
        onClose={() => setTimelineOpen(false)}
        onTaskClick={handleTaskClick}
      />
    </Box>
  );
};

export default TaskStatus;