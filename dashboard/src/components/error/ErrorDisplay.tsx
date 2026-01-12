/**
 * Error Display Component
 * Displays errors with appropriate actions and styling
 */

import React from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Button,
  Typography,
  Stack,
  Collapse,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Login as LoginIcon,
  Home as HomeIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  WifiOff as NetworkIcon,
  Security as AuthIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import type { EnhancedError } from '../../services/errorHandler';
import { formatErrorForDisplay } from '../../services/errorHandler';

export interface ErrorDisplayProps {
  error: EnhancedError | string | null;
  onRetry?: () => void;
  onLogin?: () => void;
  onRefresh?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
  compact?: boolean;
  variant?: 'alert' | 'card' | 'inline';
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onLogin,
  onRefresh,
  onGoHome,
  showDetails = false,
  compact = false,
  variant = 'alert',
}) => {
  const [expanded, setExpanded] = React.useState(false);

  if (!error) return null;

  // Handle string errors
  if (typeof error === 'string') {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );
  }

  const displayInfo = formatErrorForDisplay(error);
  
  // Get appropriate icon based on error category
  const getIcon = () => {
    switch (error.category) {
      case 'network':
        return <NetworkIcon />;
      case 'authentication':
        return <AuthIcon />;
      case 'authorization':
        return <BlockIcon />;
      default:
        return error.severity === 'high' || error.severity === 'critical' 
          ? <ErrorIcon /> 
          : <WarningIcon />;
    }
  };

  // Get alert severity
  const getSeverity = () => {
    switch (error.severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'error';
    }
  };

  // Get action buttons
  const getActionButtons = () => {
    const buttons: React.ReactNode[] = [];

    if (error.retryable && onRetry) {
      buttons.push(
        <Button
          key="retry"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          variant="outlined"
        >
          Retry
        </Button>
      );
    }

    if (error.category === 'authentication' && onLogin) {
      buttons.push(
        <Button
          key="login"
          size="small"
          startIcon={<LoginIcon />}
          onClick={onLogin}
          variant="contained"
        >
          Login
        </Button>
      );
    }

    if (error.category === 'network' && onRefresh) {
      buttons.push(
        <Button
          key="refresh"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          variant="outlined"
        >
          Refresh
        </Button>
      );
    }

    if (onGoHome && error.severity === 'critical') {
      buttons.push(
        <Button
          key="home"
          size="small"
          startIcon={<HomeIcon />}
          onClick={onGoHome}
          variant="text"
        >
          Go Home
        </Button>
      );
    }

    return buttons;
  };

  const actionButtons = getActionButtons();

  // Compact inline variant
  if (variant === 'inline' || compact) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          bgcolor: 'error.light',
          color: 'error.contrastText',
          borderRadius: 1,
          fontSize: '0.875rem',
        }}
      >
        {getIcon()}
        <Typography variant="body2" sx={{ flex: 1 }}>
          {displayInfo.message}
        </Typography>
        {actionButtons.length > 0 && actionButtons[0]}
      </Box>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <Box
        sx={{
          border: 1,
          borderColor: `${getSeverity()}.main`,
          borderRadius: 1,
          p: 2,
          bgcolor: `${getSeverity()}.light`,
          color: `${getSeverity()}.contrastText`,
        }}
      >
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getIcon()}
            <Typography variant="h6">{displayInfo.title}</Typography>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Chip
                label={error.category}
                size="small"
                variant="outlined"
              />
              <Chip
                label={error.severity}
                size="small"
                color={getSeverity()}
              />
            </Box>
          </Box>
          
          <Typography variant="body2">
            {displayInfo.message}
          </Typography>
          
          {actionButtons.length > 0 && (
            <Stack direction="row" spacing={1}>
              {actionButtons}
            </Stack>
          )}
        </Stack>
      </Box>
    );
  }

  // Default alert variant
  return (
    <Alert
      severity={getSeverity()}
      icon={getIcon()}
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
        </Box>
      }
      sx={{ mb: 2 }}
    >
      <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {displayInfo.title}
        <Chip
          label={error.category}
          size="small"
          variant="outlined"
          sx={{ ml: 1 }}
        />
      </AlertTitle>
      
      <Typography variant="body2" paragraph>
        {displayInfo.message}
      </Typography>

      {actionButtons.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          {actionButtons}
        </Stack>
      )}

      <Collapse in={expanded && showDetails}>
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Error Code:</strong> {error.code || 'N/A'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Status:</strong> {error.status}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Category:</strong> {error.category}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Severity:</strong> {error.severity}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Retryable:</strong> {error.retryable ? 'Yes' : 'No'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Timestamp:</strong> {new Date(error.timestamp).toLocaleString()}
          </Typography>
          
          {error.details && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Details:</strong>
              <pre style={{ 
                fontSize: '0.75rem', 
                marginTop: '0.5rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </Typography>
          )}
        </Box>
      </Collapse>
    </Alert>
  );
};

export default ErrorDisplay;