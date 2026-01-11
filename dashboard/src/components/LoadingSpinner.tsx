/**
 * Loading Spinner Component
 * Reusable loading indicator with different sizes and overlay options
 */

import React from 'react';
import {
  Box,
  CircularProgress,
  Backdrop,
  Typography,
  type CircularProgressProps,
} from '@mui/material';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large' | number;
  color?: CircularProgressProps['color'];
  overlay?: boolean;
  message?: string;
  backdrop?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  overlay = false,
  message,
  backdrop = false,
}) => {
  // Convert size to number
  const getSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'small':
        return 24;
      case 'medium':
        return 40;
      case 'large':
        return 56;
      default:
        return 40;
    }
  };

  const spinner = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress
        size={getSize()}
        color={color}
        thickness={4}
      />
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (backdrop) {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: theme => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        open={true}
      >
        {spinner}
      </Backdrop>
    );
  }

  if (overlay) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 1,
        }}
      >
        {spinner}
      </Box>
    );
  }

  return spinner;
};

export default LoadingSpinner;