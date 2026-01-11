/**
 * UI Selectors
 * Selectors for UI state and user interface elements
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../types/store';
import type { Notification } from '../../types/app';

// Base UI selector
export const selectUI = (state: RootState) => state.ui;

// Sidebar selectors
export const selectSidebarOpen = createSelector(
  [selectUI],
  ui => ui.sidebarOpen
);

// Theme selectors
export const selectTheme = createSelector([selectUI], ui => ui.theme);

export const selectIsDarkTheme = createSelector(
  [selectTheme],
  theme => theme === 'dark'
);

// Notification selectors
export const selectNotifications = createSelector(
  [selectUI],
  ui => ui.notifications
);

export const selectNotificationCount = createSelector(
  [selectNotifications],
  notifications => notifications.length
);

export const selectUnreadNotifications = createSelector(
  [selectNotifications],
  notifications => notifications.filter(notification => !notification.autoHide)
);

export const selectNotificationsByType = createSelector(
  [selectNotifications],
  notifications => {
    const notificationsByType: Record<Notification['type'], Notification[]> = {
      success: [],
      error: [],
      warning: [],
      info: [],
    };

    notifications.forEach(notification => {
      notificationsByType[notification.type].push(notification);
    });

    return notificationsByType;
  }
);

export const selectErrorNotifications = createSelector(
  [selectNotifications],
  notifications =>
    notifications.filter(notification => notification.type === 'error')
);

export const selectSuccessNotifications = createSelector(
  [selectNotifications],
  notifications =>
    notifications.filter(notification => notification.type === 'success')
);

export const selectWarningNotifications = createSelector(
  [selectNotifications],
  notifications =>
    notifications.filter(notification => notification.type === 'warning')
);

export const selectInfoNotifications = createSelector(
  [selectNotifications],
  notifications =>
    notifications.filter(notification => notification.type === 'info')
);

// Recent notifications (last 10)
export const selectRecentNotifications = createSelector(
  [selectNotifications],
  notifications =>
    notifications.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
);

// Auto-refresh selectors
export const selectAutoRefresh = createSelector(
  [selectUI],
  ui => ui.autoRefresh
);

export const selectRefreshInterval = createSelector(
  [selectUI],
  ui => ui.refreshInterval
);

// Notification that should auto-hide
export const selectAutoHideNotifications = createSelector(
  [selectNotifications],
  notifications =>
    notifications.filter(
      notification =>
        notification.autoHide &&
        notification.duration &&
        Date.now() - notification.timestamp >= notification.duration
    )
);

// Persistent notifications (don't auto-hide)
export const selectPersistentNotifications = createSelector(
  [selectNotifications],
  notifications => notifications.filter(notification => !notification.autoHide)
);

// UI state summary for debugging
export const selectUIStateSummary = createSelector([selectUI], ui => ({
  sidebarOpen: ui.sidebarOpen,
  theme: ui.theme,
  notificationCount: ui.notifications.length,
  autoRefresh: ui.autoRefresh,
  refreshInterval: ui.refreshInterval,
}));
