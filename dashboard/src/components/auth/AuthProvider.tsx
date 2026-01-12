/**
 * Authentication Provider Component
 * Provides authentication context and handles global auth state management
 */

import React, { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setAuthToken,
  setUser,
  resetAuth,
  refreshToken,
} from '../../store/slices/authSlice';
import {
  selectIsAuthenticated,
  selectAuthToken,
  selectCurrentUser,
} from '../../store/selectors';
import { authService } from '../../services';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const reduxToken = useAppSelector(selectAuthToken);
  const reduxUser = useAppSelector(selectCurrentUser);

  // Sync Redux state with auth service on mount
  useEffect(() => {
    const syncAuthState = () => {
      const serviceToken = authService.getToken();
      const serviceUser = authService.getUser();
      const serviceIsAuth = authService.isAuthenticated();

      // If service has auth data but Redux doesn't, sync to Redux
      if (serviceIsAuth && serviceToken && !isAuthenticated) {
        dispatch(setAuthToken(serviceToken));
        if (serviceUser) {
          dispatch(setUser(serviceUser));
        }
      }
      // If Redux has auth data but service doesn't, clear Redux
      else if (isAuthenticated && !serviceIsAuth) {
        dispatch(resetAuth());
      }
    };

    syncAuthState();
  }, [dispatch, isAuthenticated]);

  // Handle authentication events from the auth service
  useEffect(() => {
    const handleAuthEvents = () => {
      // Handle logout events
      const handleLogout = () => {
        dispatch(resetAuth());
      };

      // Handle session expiration
      const handleSessionExpired = () => {
        dispatch(resetAuth());
      };

      // Handle token updates (from other tabs)
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'airflow_auth_token') {
          if (event.newValue) {
            try {
              const token = JSON.parse(event.newValue);
              dispatch(setAuthToken(token));
            } catch (error) {
              console.error('Error parsing token from storage:', error);
            }
          } else {
            dispatch(resetAuth());
          }
        }

        if (event.key === 'airflow_user') {
          if (event.newValue) {
            try {
              const user = JSON.parse(event.newValue);
              dispatch(setUser(user));
            } catch (error) {
              console.error('Error parsing user from storage:', error);
            }
          }
        }
      };

      // Add event listeners
      window.addEventListener('auth:logout', handleLogout);
      window.addEventListener('auth:session-expired', handleSessionExpired);
      window.addEventListener('storage', handleStorageChange);

      // Cleanup function
      return () => {
        window.removeEventListener('auth:logout', handleLogout);
        window.removeEventListener(
          'auth:session-expired',
          handleSessionExpired
        );
        window.removeEventListener('storage', handleStorageChange);
      };
    };

    const cleanup = handleAuthEvents();
    return cleanup;
  }, [dispatch]);

  // Set up periodic token validation
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Validate token every 5 minutes
    const validationInterval = setInterval(
      async () => {
        try {
          // Check if token is still valid
          if (!authService.isAuthenticated()) {
            console.warn('Token validation failed, logging out');
            dispatch(resetAuth());
            return;
          }

          // Check if token needs refresh
          if (authService.isTokenExpiringSoon()) {
            console.log('Token expiring soon, attempting refresh...');
            try {
              await dispatch(refreshToken()).unwrap();
              console.log('Token refreshed successfully');
            } catch (error) {
              console.error('Token refresh failed:', error);
              // Don't logout immediately, let the user continue with current token
            }
          }
        } catch (error) {
          console.error('Token validation error:', error);
        }
      },
      5 * 60 * 1000
    ); // Every 5 minutes

    return () => {
      clearInterval(validationInterval);
    };
  }, [isAuthenticated, dispatch]);

  // Provide logout function
  const logout = useCallback(() => {
    authService.logout();
    dispatch(resetAuth());
  }, [dispatch]);

  // Provide manual token refresh function
  const forceRefreshToken = useCallback(async () => {
    try {
      await dispatch(refreshToken()).unwrap();
      return true;
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      return false;
    }
  }, [dispatch]);

  // Add global methods to window for debugging (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).authDebug = {
        logout,
        refreshToken: forceRefreshToken,
        getAuthState: () => ({
          isAuthenticated,
          token: reduxToken,
          user: reduxUser,
          serviceAuth: authService.isAuthenticated(),
          serviceToken: authService.getToken(),
          serviceUser: authService.getUser(),
        }),
      };
    }

    return () => {
      if (process.env.NODE_ENV === 'development') {
        delete (window as any).authDebug;
      }
    };
  }, [isAuthenticated, reduxToken, reduxUser, logout, forceRefreshToken]);

  return <>{children}</>;
};

export default AuthProvider;
