/**
 * Authentication Selectors
 * Selectors for authentication state
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../types/store';

// Base auth selector
export const selectAuth = (state: RootState) => state.auth;

// Authentication status selectors
export const selectIsAuthenticated = createSelector(
  [selectAuth],
  (auth) => auth.isAuthenticated
);

export const selectAuthToken = createSelector(
  [selectAuth],
  (auth) => auth.token
);

export const selectCurrentUser = createSelector(
  [selectAuth],
  (auth) => auth.user
);

export const selectAuthLoading = createSelector(
  [selectAuth],
  (auth) => auth.loading
);

export const selectAuthError = createSelector(
  [selectAuth],
  (auth) => auth.error
);

// Token expiration selector
export const selectIsTokenExpired = createSelector(
  [selectAuthToken],
  (token) => {
    if (!token) return true;
    return Date.now() >= token.expires_at;
  }
);

// Token needs refresh selector (refresh 5 minutes before expiry)
export const selectTokenNeedsRefresh = createSelector(
  [selectAuthToken],
  (token) => {
    if (!token) return false;
    const fiveMinutesInMs = 5 * 60 * 1000;
    return Date.now() >= (token.expires_at - fiveMinutesInMs);
  }
);

// User roles selector
export const selectUserRoles = createSelector(
  [selectCurrentUser],
  (user) => user?.roles || []
);

// User permissions selectors
export const selectCanTriggerDAGs = createSelector(
  [selectUserRoles],
  (roles) => roles.includes('Admin') || roles.includes('Op') || roles.includes('User')
);

export const selectCanDeleteDAGRuns = createSelector(
  [selectUserRoles],
  (roles) => roles.includes('Admin') || roles.includes('Op')
);

export const selectCanModifyTasks = createSelector(
  [selectUserRoles],
  (roles) => roles.includes('Admin') || roles.includes('Op')
);