/**
 * Task Detail Modal Component
 * Shows detailed information about a task instance
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
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
  Visibility as ViewLogsIcon,
} from '@mui/icons-material';
import type { TaskInstance } from '../../types/app';

interface TaskDetailModalProps {
  open: boolean;
  task: TaskInstance | null;
  onClose: () => void;
  onViewLogs?: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  open,
  task,
  onClose,
  onViewLogs,
}) => {
  if (!task) return null;

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

  const statusDisplay = getTaskStatusDisplay(task.state);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" component="h2">
              Task Details: {task.task_id}
            </Typography>
            <Chip
              icon={statusDisplay.icon}
              label={statusDisplay.label}
              color={statusDisplay.color}
              variant="outlined"
              sx={{
                bgcolor: statusDisplay.bgColor,
                color: statusDisplay.textColor,
              }}
            />
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 600, width: '30%' }}>
                      Task ID
                    </TableCell>
                    <TableCell>{task.task_id}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                      DAG ID
                    </TableCell>
                    <TableCell>{task.dag_id}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                      DAG Run ID
                    </TableCell>
                    <TableCell>{task.dag_run_id}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                      Operator
                    </TableCell>
                    <TableCell>{task.operator}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                      State
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={statusDisplay.icon}
                        label={statusDisplay.label}
                        color={statusDisplay.color}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Execution Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Execution Information
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 600, width: '30%' }}>
                      Start Date
                    </TableCell>
                    <TableCell>{formatDate(task.start_date)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                      End Date
                    </TableCell>
                    <TableCell>{formatDate(task.end_date)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                      Duration
                    </TableCell>
                    <TableCell>{formatDuration(task.duration)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                      Try Number
                    </TableCell>
                    <TableCell>{task.try_number} / {task.max_tries}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Resource Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Resource Information
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 600, width: '30%' }}>
                      Pool
                    </TableCell>
                    <TableCell>{task.pool}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                      Queue
                    </TableCell>
                    <TableCell>{task.queue || 'Default'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                      Priority Weight
                    </TableCell>
                    <TableCell>{task.priority_weight}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Task Progress */}
          {task.state === 'running' && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Progress Information
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Task is currently running...
                </Typography>
                <Typography variant="body2">
                  Started: {formatDate(task.start_date)}
                </Typography>
                {task.start_date && (
                  <Typography variant="body2">
                    Running for: {formatDuration(Math.floor((Date.now() - new Date(task.start_date).getTime()) / 1000))}
                  </Typography>
                )}
              </Box>
            </Grid>
          )}

          {/* Error Information */}
          {(task.state === 'failed' || task.state === 'upstream_failed' || task.state === 'up_for_retry') && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="error">
                Error Information
              </Typography>
              <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1, border: 1, borderColor: '#ffcdd2' }}>
                <Typography variant="body2" color="error" gutterBottom>
                  Task execution failed
                </Typography>
                <Typography variant="body2">
                  Try {task.try_number} of {task.max_tries}
                </Typography>
                {task.state === 'up_for_retry' && (
                  <Typography variant="body2" color="warning.main">
                    Task will be retried automatically
                  </Typography>
                )}
                {task.state === 'upstream_failed' && (
                  <Typography variant="body2" color="error">
                    Task failed due to upstream task failure
                  </Typography>
                )}
              </Box>
            </Grid>
          )}

          {/* Success Information */}
          {task.state === 'success' && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="success.main">
                Success Information
              </Typography>
              <Box sx={{ p: 2, bgcolor: '#e8f5e8', borderRadius: 1, border: 1, borderColor: '#c8e6c9' }}>
                <Typography variant="body2" color="success.main" gutterBottom>
                  Task completed successfully
                </Typography>
                <Typography variant="body2">
                  Completed in: {formatDuration(task.duration)}
                </Typography>
                <Typography variant="body2">
                  Finished: {formatDate(task.end_date)}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        {onViewLogs && (
          <Button
            startIcon={<ViewLogsIcon />}
            onClick={onViewLogs}
            variant="outlined"
          >
            View Logs
          </Button>
        )}
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailModal;