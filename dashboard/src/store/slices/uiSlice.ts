/**
 * UI Redux Slice
 * Manages UI state and user interface interactions
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UIState, AddNotificationPayload, RemoveNotificationPayload } from '../../types/store';
import type { Notification } from '../../types/app';

// Initial state
const initialState: UIState = {
  sidebarOpen: true,
  notifications: [],
  theme: 'light',
  refreshInterval: 30000, // 30 seconds default
  autoRefresh: true,
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Toggle sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    // Set sidebar state
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    // Add notification
    addNotification: (state, action: PayloadAction<AddNotificationPayload>) => {
      const notification: Notification = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: action.payload.type,
        title: action.payload.title,
        message: action.payload.message,
        timestamp: Date.now(),
        autoHide: action.payload.autoHide ?? true,
        duration: action.payload.duration ?? 5000,
      };
      state.notifications.push(notification);
    },
    // Remove notification
    removeNotification: (state, action: PayloadAction<RemoveNotificationPayload>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload.id
      );
    },
    // Clear all notifications
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    // Set theme
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    // Toggle theme
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    // Set refresh interval
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = action.payload;
    },
    // Toggle auto refresh
    toggleAutoRefresh: (state) => {
      state.autoRefresh = !state.autoRefresh;
    },
    // Set auto refresh
    setAutoRefresh: (state, action: PayloadAction<boolean>) => {
      state.autoRefresh = action.payload;
    },
    // Reset UI state
    resetUI: () => initialState,
  },
});

// Export actions
export const {
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearAllNotifications,
  setTheme,
  toggleTheme,
  setRefreshInterval,
  toggleAutoRefresh,
  setAutoRefresh,
  resetUI,
} = uiSlice.actions;

// Export reducer
export default uiSlice.reducer;