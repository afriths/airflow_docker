/**
 * Authentication Hook
 * Custom hook for accessing authentication state and actions
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  loginUser,
  logoutUser,
  refreshToken,
  clearAuthError,
} from '../store/slices/authSlice';
import {
  selectIsAuthenticated,
  selectCurrentUser,
  selectAuthToken,
  selectAuthLoading,
  selectAuthError,
} from '../store/selectors';
import { authService } from '../services';
import type { LoginPayload } from '../types/store';

export interface UseAuthReturn {
  // State
  isAuthenticated: boolean;
  user: ReturnType<typeof selectCurrentUser>;
  token: ReturnType<typeof selectAuthToken>;
  loading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;

  // Utility functions
  isTokenExpiringSoon: () => boolean;
  getTokenExpirationTime: () => number;
  ensureValidToken: () => Promise<void>;
}

/**
 * Custom hook for authentication operations
 */
export const useAuth = (): UseAuthReturn => {
  const dispatch = useAppDispatch();

  // Selectors
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const token = useAppSelector(selectAuthToken);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  // Login action
  const login = useCallback(
    async (credentials: LoginPayload) => {
      await dispatch(loginUser(credentials)).unwrap();
    },
    [dispatch]
  );

  // Logout action
  const logout = useCallback(async () => {
    await dispatch(logoutUser()).unwrap();
  }, [dispatch]);

  // Refresh token action
  const refresh = useCallback(async () => {
    await dispatch(refreshToken()).unwrap();
  }, [dispatch]);

  // Clear error action
  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Check if token is expiring soon
  const isTokenExpiringSoon = useCallback(() => {
    return authService.isTokenExpiringSoon();
  }, []);

  // Get token expiration time
  const getTokenExpirationTime = useCallback(() => {
    return authService.getTokenExpirationTime();
  }, []);

  // Ensure valid token
  const ensureValidToken = useCallback(async () => {
    await authService.ensureValidToken();
  }, []);

  return {
    // State
    isAuthenticated,
    user,
    token,
    loading,
    error,

    // Actions
    login,
    logout,
    refresh,
    clearError,

    // Utility functions
    isTokenExpiringSoon,
    getTokenExpirationTime,
    ensureValidToken,
  };
};

export default useAuth;
