/**
 * Task Timeline Component
 * Visualizes task execution timeline with Gantt-style chart
 */

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  FormControlLabel,
  Switch,
  Chip,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  RadioButtonUnchecked as QueuedIcon,
  PlayArrow as RunningIcon,
  SkipNext as SkippedIcon,
  Replay as RetryIcon,
  Schedule as ScheduledIcon,
  ArrowUpward as UpstreamFailedIcon,
  Remove as RemovedIcon,
} from '@mui/icons-material';
import type { TaskInstance } from '../../types/app';

interface TaskTimelineProps {
  open: boolean;
  tasks: TaskInstance[];
  onClose: () => void;
  onTaskClick?: (task: TaskInstance) => void;
}

const TaskTimeline: React.FC<TaskTimelineProps> = ({
  open,
  tasks,
  onClose,
  onTaskClick,
}) => {
  const [showOnlyExecuted, setShowOnlyExecuted] = useState(false);
  const [sortBy, setSortBy] = useState<'task_id' | 'start_date' | 'duration'>('start_date');

  // Get task status display properties
  const getTaskStatusDisplay = (state: TaskInstance['state']) => {
    switch (state) {
      case 'success':
        return {
          icon: <SuccessIcon />,
          color: '#4caf50',
          label: 'Success',
        };
      case 'failed':
        return {
          icon: <ErrorIcon />,
          color: '#f44336',
          label: 'Failed',
        };
      case 'running':
        return {
          icon: <RunningIcon />,
          color: '#2196f3',
          label: 'Running',
        };
      case 'queued':
        return {
          icon: <QueuedIcon />,
          color: '#9c27b0',
          label: 'Queued',
        };
      case 'skipped':
        return {
          icon: <SkippedIcon />,
          color: '#9e9e9e',
          label: 'Skipped',
        };
      case 'up_for_retry':
        return {
          icon: <RetryIcon />,
          color: '#ff9800',
          label: 'Up for Retry',
        };
      case 'up_for_reschedule':
        return {
          icon: <ScheduledIcon />,
          color: '#ff9800',
          label: 'Up for Reschedule',
        };
      case 'upstream_failed':
        return {
          icon: <UpstreamFailedIcon />,
          color: '#f44336',
          label: 'Upstream Failed',
        };
      case 'deferred':
        return {
          icon: <ScheduledIcon />,
          color: '#03a9f4',
          label: 'Deferred',
        };
      case 'removed':
        return {
          icon: <RemovedIcon />,
          color: '#757575',
          label: 'Removed',
        };
      default:
        return {
          icon: <QueuedIcon />,
          color: '#9e9e9e',
          label: 'Unknown',
        };
    }
  };

  // Process and filter tasks
  const processedTasks = useMemo(() => {
    let filteredTasks = tasks;

    // Filter out tasks that haven't been executed if requested
    if (showOnlyExecuted) {
      filteredTasks = tasks.filter(task => 
        task.start_date && (task.state === 'success' || task.state === 'failed' || task.state === 'running')
      );
    }

    // Sort tasks
    const sorted = [...filteredTasks].sort((a, b) => {
      switch (sortBy) {
        case 'task_id':
          return a.task_id.localeCompare(b.task_id);
        case 'start_date':
          const aStart = a.start_date ? new Date(a.start_date).getTime() : 0;
          const bStart = b.start_date ? new Date(b.start_date).getTime() : 0;
          return aStart - bStart;
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [tasks, showOnlyExecuted, sortBy]);

  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    const executedTasks = tasks.filter(task => task.start_date);
    
    if (executedTasks.length === 0) {
      return { start: new Date(), end: new Date(), duration: 0 };
    }

    const startTimes = executedTasks.map(task => new Date(task.start_date!).getTime());
    const endTimes = executedTasks.map(task => {
      if (task.end_date) {
        return new Date(task.end_date).getTime();
      } else if (task.state === 'running') {
        return Date.now();
      } else {
        return new Date(task.start_date!).getTime();
      }
    });

    const minStart = Math.min(...startTimes);
    const maxEnd = Math.max(...endTimes);

    return {
      start: new Date(minStart),
      end: new Date(maxEnd),
      duration: maxEnd - minStart,
    };
  }, [tasks]);

  // Calculate task bar position and width
  const getTaskBarStyle = (task: TaskInstance) => {
    if (!task.start_date || timelineBounds.duration === 0) {
      return { left: '0%', width: '0%' };
    }

    const taskStart = new Date(task.start_date).getTime();
    const taskEnd = task.end_date 
      ? new Date(task.end_date).getTime()
      : (task.state === 'running' ? Date.now() : taskStart);

    const left = ((taskStart - timelineBounds.start.getTime()) / timelineBounds.duration) * 100;
    const width = Math.max(((taskEnd - taskStart) / timelineBounds.duration) * 100, 0.5); // Minimum 0.5% width

    return {
      left: `${left}%`,
      width: `${width}%`,
    };
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

  // Format time
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { height: '90vh', maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="h2">
            Task Execution Timeline ({processedTasks.length} tasks)
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Controls */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormControlLabel
            control={
              <Switch
                checked={showOnlyExecuted}
                onChange={(e) => setShowOnlyExecuted(e.target.checked)}
              />
            }
            label="Show only executed tasks"
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant={sortBy === 'start_date' ? 'contained' : 'outlined'}
              onClick={() => setSortBy('start_date')}
            >
              Sort by Start Time
            </Button>
            <Button
              size="small"
              variant={sortBy === 'task_id' ? 'contained' : 'outlined'}
              onClick={() => setSortBy('task_id')}
            >
              Sort by Task ID
            </Button>
            <Button
              size="small"
              variant={sortBy === 'duration' ? 'contained' : 'outlined'}
              onClick={() => setSortBy('duration')}
            >
              Sort by Duration
            </Button>
          </Box>
        </Box>

        {/* Timeline info */}
        {timelineBounds.duration > 0 && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Timeline: {timelineBounds.start.toLocaleString()} - {timelineBounds.end.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Duration: {formatDuration(Math.floor(timelineBounds.duration / 1000))}
            </Typography>
          </Box>
        )}

        {/* Timeline */}
        {processedTasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No tasks to display
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {showOnlyExecuted 
                ? 'No tasks have been executed yet'
                : 'No tasks found in this DAG run'
              }
            </Typography>
          </Box>
        ) : (
          <Box sx={{ minHeight: 400 }}>
            {/* Time scale */}
            {timelineBounds.duration > 0 && (
              <Box sx={{ mb: 2, position: 'relative', height: 30, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ position: 'absolute', left: 0, top: 5, fontSize: '0.75rem', color: 'text.secondary' }}>
                  {timelineBounds.start.toLocaleTimeString()}
                </Box>
                <Box sx={{ position: 'absolute', right: 0, top: 5, fontSize: '0.75rem', color: 'text.secondary' }}>
                  {timelineBounds.end.toLocaleTimeString()}
                </Box>
                <Box sx={{ position: 'absolute', left: '50%', top: 5, transform: 'translateX(-50%)', fontSize: '0.75rem', color: 'text.secondary' }}>
                  {new Date(timelineBounds.start.getTime() + timelineBounds.duration / 2).toLocaleTimeString()}
                </Box>
              </Box>
            )}

            {/* Task bars */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {processedTasks.map((task, index) => {
                const statusDisplay = getTaskStatusDisplay(task.state);
                const barStyle = getTaskBarStyle(task);
                const hasExecution = task.start_date && timelineBounds.duration > 0;

                return (
                  <Paper
                    key={task.task_id}
                    sx={{
                      p: 1,
                      cursor: onTaskClick ? 'pointer' : 'default',
                      '&:hover': onTaskClick ? { boxShadow: 2 } : {},
                      borderLeft: 3,
                      borderLeftColor: statusDisplay.color,
                    }}
                    onClick={() => onTaskClick?.(task)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ minWidth: 200, mr: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {task.task_id}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            icon={statusDisplay.icon}
                            label={statusDisplay.label}
                            size="small"
                            sx={{
                              bgcolor: statusDisplay.color + '20',
                              color: statusDisplay.color,
                              '& .MuiChip-icon': { color: statusDisplay.color },
                            }}
                          />
                        </Box>
                      </Box>

                      <Box sx={{ flexGrow: 1, mr: 2 }}>
                        {hasExecution ? (
                          <Box sx={{ position: 'relative', height: 20, bgcolor: '#f0f0f0', borderRadius: 1 }}>
                            <Tooltip
                              title={
                                <Box>
                                  <Typography variant="body2">
                                    Start: {formatTime(task.start_date)}
                                  </Typography>
                                  <Typography variant="body2">
                                    End: {formatTime(task.end_date)}
                                  </Typography>
                                  <Typography variant="body2">
                                    Duration: {formatDuration(task.duration)}
                                  </Typography>
                                </Box>
                              }
                            >
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 2,
                                  height: 16,
                                  bgcolor: statusDisplay.color,
                                  borderRadius: 1,
                                  opacity: 0.8,
                                  ...barStyle,
                                  minWidth: '2px',
                                }}
                              />
                            </Tooltip>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Not executed
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ minWidth: 120, textAlign: 'right' }}>
                        <Typography variant="body2">
                          {formatDuration(task.duration)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Try {task.try_number}/{task.max_tries}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskTimeline;