/**
 * Protected Route Component
 * Wrapper component that ensures user authentication before rendering protected content
 */

import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../store';
import {
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthToken,
} from '../../store/selectors';
import { refreshToken } from '../../store/slices/authSlice';
import { authService } from '../../services';
import LoginForm from './LoginForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
}) => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authLoading = useAppSelector(selectAuthLoading);
  const token = useAppSelector(selectAuthToken);

  const [isInitializing, setIsInitializing] = useState(true);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // Initialize authentication state on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a stored token and if it's still valid
        const storedToken = authService.getToken();
        const isValidAuth = authService.isAuthenticated();

        if (storedToken && isValidAuth) {
          // Token exists and is valid, check if it needs refresh
          if (authService.isTokenExpiringSoon()) {
            try {
              await dispatch(refreshToken()).unwrap();
            } catch (error) {
              console.warn(
                'Token refresh failed during initialization:',
                error
              );
              // Continue with existing token if refresh fails
            }
          }
        }
      } catch (error) {
        console.error('Error initializing authentication:', error);
      } finally {
        setIsInitializing(false);
        setAuthCheckComplete(true);
      }
    };

    initializeAuth();
  }, [dispatch]);

  // Set up event listeners for authentication events
  useEffect(() => {
    const handleAuthEvents = () => {
      // Handle session expiration
      const handleSessionExpired = () => {
        console.warn('Session expired, redirecting to login');
        // The auth service will handle logout, Redux state will update automatically
      };

      // Handle logout events
      const handleLogout = () => {
        console.log('User logged out');
        setAuthCheckComplete(true);
      };

      // Add event listeners
      window.addEventListener('auth:session-expired', handleSessionExpired);
      window.addEventListener('auth:logout', handleLogout);

      // Cleanup
      return () => {
        window.removeEventListener(
          'auth:session-expired',
          handleSessionExpired
        );
        window.removeEventListener('auth:logout', handleLogout);
      };
    };

    const cleanup = handleAuthEvents();
    return cleanup;
  }, []);

  // Set up automatic token refresh check
  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    // Check token expiration every minute
    const tokenCheckInterval = setInterval(async () => {
      try {
        if (authService.isTokenExpiringSoon()) {
          console.log('Token expiring soon, attempting refresh...');
          await dispatch(refreshToken()).unwrap();
        }
      } catch (error) {
        console.error('Automatic token refresh failed:', error);
        // Let the auth service handle the logout
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(tokenCheckInterval);
    };
  }, [isAuthenticated, token, dispatch]);

  // Handle login success
  const handleLoginSuccess = () => {
    setAuthCheckComplete(true);
  };

  // Show loading spinner during initialization
  if (isInitializing || (authLoading && !authCheckComplete)) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Initializing authentication...
        </Typography>
      </Box>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return fallback || <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
