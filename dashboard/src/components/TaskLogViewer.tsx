/**
 * Task Log Viewer Component
 * Displays task execution logs with error highlighting
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchTaskLogs } from '../store/slices/tasksSlice';
import { addNotification } from '../store/slices/uiSlice';
import type { TaskLogViewerProps } from '../types/components';

const TaskLogViewer: React.FC<TaskLogViewerProps> = ({
  open,
  dagId,
  dagRunId,
  taskId,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { taskLogs, loading, error } = useAppSelector(state => state.tasks);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [highlightErrors, setHighlightErrors] = useState(true);
  const [autoScroll, setAutoScroll] = useState(false);
  const [tryNumber, setTryNumber] = useState(1);
  
  // Refs
  const logContentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get logs for the current task
  const currentLogs = taskLogs[`${dagId}-${dagRunId}-${taskId}-${tryNumber}`] || '';

  // Fetch logs when dialog opens or task changes
  useEffect(() => {
    if (open && dagId && dagRunId && taskId) {
      dispatch(fetchTaskLogs({
        dag_id: dagId,
        dag_run_id: dagRunId,
        task_id: taskId,
        task_try_number: tryNumber,
        full_content: true,
      }));
    }
  }, [dispatch, open, dagId, dagRunId, taskId, tryNumber]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContentRef.current) {
      logContentRef.current.scrollTop = logContentRef.current.scrollHeight;
    }
  }, [currentLogs, autoScroll]);

  // Process log lines for display
  const processLogLines = (logs: string) => {
    if (!logs) return [];

    const lines = logs.split('\n');
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      let level = 'info';
      let icon = null;

      // Detect log levels and assign colors/icons
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('error') || lowerLine.includes('exception') || lowerLine.includes('traceback')) {
        level = 'error';
        icon = <ErrorIcon sx={{ fontSize: 14 }} />;
      } else if (lowerLine.includes('warning') || lowerLine.includes('warn')) {
        level = 'warning';
        icon = <WarningIcon sx={{ fontSize: 14 }} />;
      } else if (lowerLine.includes('info')) {
        level = 'info';
        icon = <InfoIcon sx={{ fontSize: 14 }} />;
      }

      // Check if line matches search term
      const matchesSearch = !searchTerm || line.toLowerCase().includes(searchTerm.toLowerCase());

      return {
        lineNumber,
        content: line,
        level,
        icon,
        matchesSearch,
        isEmpty: line.trim() === '',
      };
    });
  };

  const logLines = processLogLines(currentLogs);
  const filteredLines = searchTerm 
    ? logLines.filter(line => line.matchesSearch)
    : logLines;

  // Get log level colors
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return { color: '#d32f2f', bgcolor: '#ffebee' };
      case 'warning':
        return { color: '#ed6c02', bgcolor: '#fff3e0' };
      case 'info':
        return { color: '#0288d1', bgcolor: '#e3f2fd' };
      default:
        return { color: 'text.primary', bgcolor: 'transparent' };
    }
  };

  // Handle refresh logs
  const handleRefresh = () => {
    if (dagId && dagRunId && taskId) {
      dispatch(fetchTaskLogs({
        dag_id: dagId,
        dag_run_id: dagRunId,
        task_id: taskId,
        task_try_number: tryNumber,
        full_content: true,
      }));
    }
  };

  // Handle download logs
  const handleDownload = () => {
    if (!currentLogs) {
      dispatch(addNotification({
        type: 'warning',
        title: 'No Logs Available',
        message: 'There are no logs to download for this task.',
        autoHide: true,
        duration: 4000,
      }));
      return;
    }

    const blob = new Blob([currentLogs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dagId}-${dagRunId}-${taskId}-${tryNumber}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    dispatch(addNotification({
      type: 'success',
      title: 'Logs Downloaded',
      message: 'Task logs have been downloaded successfully.',
      autoHide: true,
      duration: 4000,
    }));
  };

  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Scroll to line
  const scrollToLine = (lineNumber: number) => {
    const element = document.getElementById(`log-line-${lineNumber}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Get log statistics
  const logStats = {
    total: logLines.length,
    errors: logLines.filter(line => line.level === 'error').length,
    warnings: logLines.filter(line => line.level === 'warning').length,
    info: logLines.filter(line => line.level === 'info').length,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh', maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" component="h2">
              Task Logs: {taskId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              DAG: {dagId} | Run: {dagRunId} | Try: {tryNumber}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Controls */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              ref={searchInputRef}
              size="small"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={handleSearch}
              sx={{ flexGrow: 1, maxWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh Logs">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Download Logs">
                <IconButton onClick={handleDownload} disabled={!currentLogs}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Log statistics */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${logStats.total} lines`}
              size="small"
              variant="outlined"
            />
            {logStats.errors > 0 && (
              <Chip
                icon={<ErrorIcon />}
                label={`${logStats.errors} errors`}
                size="small"
                color="error"
                variant="outlined"
              />
            )}
            {logStats.warnings > 0 && (
              <Chip
                icon={<WarningIcon />}
                label={`${logStats.warnings} warnings`}
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
            {searchTerm && (
              <Chip
                label={`${filteredLines.length} matches`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* Log content */}
        <Box sx={{ height: 'calc(100% - 120px)', overflow: 'hidden' }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Box sx={{ p: 2 }}>
              <Alert severity="error">
                Failed to load logs: {error}
              </Alert>
            </Box>
          )}

          {!loading && !error && !currentLogs && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="body1" color="text.secondary">
                No logs available for this task
              </Typography>
            </Box>
          )}

          {!loading && !error && currentLogs && (
            <Box
              ref={logContentRef}
              sx={{
                height: '100%',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: 1.4,
                bgcolor: '#fafafa',
              }}
            >
              {filteredLines.map((line, index) => {
                const colors = getLogLevelColor(line.level);
                const isHighlighted = highlightErrors && (line.level === 'error' || line.level === 'warning');

                return (
                  <Box
                    key={`${line.lineNumber}-${index}`}
                    id={`log-line-${line.lineNumber}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      minHeight: '1.4em',
                      px: 1,
                      py: 0.25,
                      bgcolor: isHighlighted ? colors.bgcolor : 'transparent',
                      borderLeft: isHighlighted ? 3 : 0,
                      borderLeftColor: colors.color,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    {/* Line number */}
                    {showLineNumbers && (
                      <Box
                        sx={{
                          minWidth: 50,
                          textAlign: 'right',
                          pr: 2,
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          userSelect: 'none',
                          cursor: 'pointer',
                        }}
                        onClick={() => scrollToLine(line.lineNumber)}
                      >
                        {line.lineNumber}
                      </Box>
                    )}

                    {/* Log level icon */}
                    {line.icon && (
                      <Box
                        sx={{
                          minWidth: 20,
                          display: 'flex',
                          alignItems: 'center',
                          color: colors.color,
                          mr: 1,
                        }}
                      >
                        {line.icon}
                      </Box>
                    )}

                    {/* Log content */}
                    <Box
                      sx={{
                        flexGrow: 1,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        color: line.isEmpty ? 'transparent' : colors.color,
                      }}
                    >
                      {line.content || ' '}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskLogViewer;