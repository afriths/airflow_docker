/**
 * Offline Indicator Component
 * Shows offline status and cached data information
 */

import React from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Collapse,
  Button,
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Storage as CacheIcon,
} from '@mui/icons-material';

export interface OfflineIndicatorProps {
  isOnline: boolean;
  lastUpdated?: Date | null;
  cachedDataCount?: number;
  onRetry?: () => void;
  showDetails?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  lastUpdated,
  cachedDataCount = 0,
  onRetry,
  showDetails = false,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  if (isOnline) {
    return null;
  }

  const formatLastUpdated = (date: Date | null | undefined) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: 1000 }}>
      <Alert
        severity="warning"
        icon={<OfflineIcon />}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showDetails && (
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                aria-label="toggle details"
              >
                {expanded ? <CollapseIcon /> : <ExpandIcon />}
              </IconButton>
            )}
            {onRetry && (
              <Tooltip title="Try to reconnect">
                <IconButton
                  size="small"
                  onClick={onRetry}
                  aria-label="retry connection"
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        }
        sx={{
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          You're offline
          {cachedDataCount > 0 && (
            <Chip
              size="small"
              icon={<CacheIcon />}
              label={`${cachedDataCount} cached`}
              variant="outlined"
              sx={{ ml: 1 }}
            />
          )}
        </AlertTitle>
        
        <Typography variant="body2">
          You're currently offline. {cachedDataCount > 0 
            ? 'Showing cached data from your last session.' 
            : 'No cached data available.'}
        </Typography>

        <Collapse in={expanded && showDetails}>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Connection Status:</strong> Offline
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Last Updated:</strong> {formatLastUpdated(lastUpdated)}
            </Typography>
            
            {cachedDataCount > 0 && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Cached Items:</strong> {cachedDataCount} data entries available
              </Typography>
            )}
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Data will automatically refresh when your connection is restored.
            </Typography>
            
            {onRetry && (
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
                sx={{ mt: 1 }}
              >
                Try Again
              </Button>
            )}
          </Box>
        </Collapse>
      </Alert>
    </Box>
  );
};

// Connection status chip for header/sidebar
export interface ConnectionStatusChipProps {
  isOnline: boolean;
  size?: 'small' | 'medium';
}

export const ConnectionStatusChip: React.FC<ConnectionStatusChipProps> = ({
  isOnline,
  size = 'small',
}) => (
  <Chip
    icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
    label={isOnline ? 'Online' : 'Offline'}
    color={isOnline ? 'success' : 'warning'}
    variant="outlined"
    size={size}
  />
);

export default OfflineIndicator;