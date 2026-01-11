/**
 * DAG Trigger Confirmation Dialog Component
 * Provides a confirmation dialog for triggering DAG runs with optional configuration
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import type { DAG } from '../types/app';

export interface DAGTriggerDialogProps {
  open: boolean;
  dag: DAG | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (dagId: string, config?: object) => void;
}

const DAGTriggerDialog: React.FC<DAGTriggerDialogProps> = ({
  open,
  dag,
  loading = false,
  error = null,
  onClose,
  onConfirm,
}) => {
  const [config, setConfig] = useState<string>('');
  const [configError, setConfigError] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setConfig('');
      setConfigError(null);
    }
  }, [open]);

  // Handle config input change with JSON validation
  const handleConfigChange = (value: string) => {
    setConfig(value);
    setConfigError(null);

    // Validate JSON if not empty
    if (value.trim()) {
      try {
        JSON.parse(value);
      } catch (err) {
        setConfigError('Invalid JSON format');
      }
    }
  };

  // Handle confirm action
  const handleConfirm = () => {
    if (!dag) return;

    let parsedConfig: object | undefined;

    // Parse config if provided
    if (config.trim()) {
      try {
        parsedConfig = JSON.parse(config);
      } catch (err) {
        setConfigError('Invalid JSON format');
        return;
      }
    }

    onConfirm(dag.dag_id, parsedConfig);
  };

  // Handle cancel action
  const handleCancel = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!dag) return null;

  const canTrigger = !loading && !configError;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlayIcon color="primary" />
          <Typography variant="h6" component="span">
            Trigger DAG Run
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          {/* DAG Information */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              {dag.dag_id}
            </Typography>
            {dag.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {dag.description}
              </Typography>
            )}
            
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip
                label={`Schedule: ${dag.schedule_interval || 'None'}`}
                size="small"
                variant="outlined"
              />
              {dag.owners.length > 0 && (
                <Chip
                  label={`Owner: ${dag.owners.join(', ')}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>

            {dag.tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
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

          <Divider sx={{ my: 2 }} />

          {/* Warning for paused DAGs */}
          {dag.is_paused && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon fontSize="small" />
                <Typography variant="body2">
                  This DAG is currently paused. Triggering will create a run, but it may not execute immediately.
                </Typography>
              </Box>
            </Alert>
          )}

          {/* Configuration Input */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Configuration (Optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder='{"key": "value"}'
              value={config}
              onChange={(e) => handleConfigChange(e.target.value)}
              error={!!configError}
              helperText={
                configError || 
                'Provide JSON configuration to pass to the DAG run (optional)'
              }
              disabled={loading}
              variant="outlined"
            />
          </Box>

          {/* API Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {error}
              </Typography>
            </Alert>
          )}

          {/* Confirmation Message */}
          <Alert severity="info">
            <Typography variant="body2">
              This will create a new DAG run for <strong>{dag.dag_id}</strong>.
              {config.trim() && ' The provided configuration will be passed to the DAG.'}
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleCancel}
          disabled={loading}
          startIcon={<CancelIcon />}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!canTrigger}
          startIcon={
            loading ? (
              <CircularProgress size={16} />
            ) : (
              <PlayIcon />
            )
          }
        >
          {loading ? 'Triggering...' : 'Trigger DAG'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DAGTriggerDialog;