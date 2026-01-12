/**
 * Real-time Status Indicator Component
 * Shows the current status of real-time updates and polling
 */

import React, { useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Popover,
  Typography,
  Stack,
  Divider,
  Button,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useRealTimeUpdates, useRealTimeStatus } from '../../hooks/useRealTimeUpdates';

interface RealTimeStatusIndicatorProps {
  showRefreshButton?: boolean;
  showSettings?: boolean;
  compact?: boolean;
}

const RealTimeStatusIndicator: React.FC<RealTimeStatusIndicatorProps> = ({
  showRefreshButton = true,
  showSettings = false,
  compact = false,
}) => {
  const { 
    isOnline, 
    lastRefresh, 
    refreshCount,
    refreshAll,
    pausePolling,
    resumePolling,
    getPollingStatus,
    config,
  } = useRealTimeUpdates();
  
  const { isPolling, hasErrors, lastUpdate, activeQueries } = useRealTimeStatus();
  
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const handleStatusClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = () => {
    refreshAll();
    handleClose();
  };

  const handleTogglePause = () => {
    if (isPaused) {
      resumePolling();
      setIsPaused(false);
    } else {
      pausePolling();
      setIsPaused(true);
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  const formatDuration = (date: Date | null) => {
    if (!date) return 'Never';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Determine status color and icon
  const getStatusDisplay = () => {
    if (!isOnline) {
      return {
        color: 'error' as const,
        icon: <OfflineIcon fontSize="small" />,
        label: 'Offline',
        tooltip: 'No internet connection',
      };
    }
    
    if (hasErrors) {
      return {
        color: 'error' as const,
        icon: <ErrorIcon fontSize="small" />,
        label: 'Error',
        tooltip: 'Some data failed to load',
      };
    }
    
    if (isPaused) {
      return {
        color: 'warning' as const,
        icon: <PauseIcon fontSize="small" />,
        label: 'Paused',
        tooltip: 'Real-time updates are paused',
      };
    }
    
    if (isPolling) {
      return {
        color: 'primary' as const,
        icon: <RefreshIcon fontSize="small" className="animate-spin" />,
        label: 'Updating',
        tooltip: 'Fetching latest data',
      };
    }
    
    return {
      color: 'success' as const,
      icon: <OnlineIcon fontSize="small" />,
      label: 'Live',
      tooltip: 'Real-time updates active',
    };
  };

  const statusDisplay = getStatusDisplay();
  const pollingStatus = getPollingStatus();

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title={statusDisplay.tooltip}>
          <Chip
            icon={statusDisplay.icon}
            label={statusDisplay.label}
            color={statusDisplay.color}
            size="small"
            variant="outlined"
            onClick={handleStatusClick}
            sx={{ cursor: 'pointer' }}
          />
        </Tooltip>
        
        {showRefreshButton && (
          <Tooltip title="Refresh all data">
            <IconButton size="small" onClick={refreshAll} disabled={!isOnline}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={statusDisplay.tooltip}>
        <Chip
          icon={statusDisplay.icon}
          label={`${statusDisplay.label} • ${formatDuration(lastUpdate)}`}
          color={statusDisplay.color}
          size="small"
          variant="outlined"
          onClick={handleStatusClick}
          sx={{ cursor: 'pointer' }}
        />
      </Tooltip>

      {showRefreshButton && (
        <Tooltip title="Refresh all data">
          <IconButton size="small" onClick={refreshAll} disabled={!isOnline}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {showSettings && (
        <Tooltip title="Real-time settings">
          <IconButton size="small" onClick={handleStatusClick}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Status Details Popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, minWidth: 280 }}>
          <Typography variant="h6" gutterBottom>
            Real-time Status
          </Typography>
          
          <Stack spacing={2}>
            {/* Connection Status */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Connection
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isOnline ? (
                  <SuccessIcon color="success" fontSize="small" />
                ) : (
                  <ErrorIcon color="error" fontSize="small" />
                )}
                <Typography variant="body2">
                  {isOnline ? 'Online' : 'Offline'}
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* Polling Status */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Polling Status
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Active Queries:</Typography>
                  <Typography variant="body2">{activeQueries}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Total Queries:</Typography>
                  <Typography variant="body2">{pollingStatus.totalQueries}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Errors:</Typography>
                  <Typography variant="body2" color={pollingStatus.errorCount > 0 ? 'error' : 'inherit'}>
                    {pollingStatus.errorCount}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Last Update */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Last Update
              </Typography>
              <Typography variant="body2">
                {formatTime(lastUpdate)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDuration(lastUpdate)}
              </Typography>
            </Box>

            <Divider />

            {/* Controls */}
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!isPaused}
                    onChange={handleTogglePause}
                    size="small"
                  />
                }
                label="Auto-refresh"
              />
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={!isOnline}
                fullWidth
              >
                Refresh Now
              </Button>
            </Stack>

            {/* Statistics */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total refreshes: {refreshCount}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Popover>

      {/* Add CSS for spin animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </Box>
  );
};

export default RealTimeStatusIndicator;