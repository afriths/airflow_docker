/**
 * Redux Store Configuration
 * Configures the Redux Toolkit store with all slices and middleware
 */

import { configureStore } from '@reduxjs/toolkit';
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from 'react-redux';

import authSlice from './slices/authSlice';
import dagsSlice from './slices/dagsSlice';
import dagRunsSlice from './slices/dagRunsSlice';
import tasksSlice from './slices/tasksSlice';
import uiSlice from './slices/uiSlice';

import type { RootState } from '../types/store';

// Configure the Redux store
export const store = configureStore({
  reducer: {
    auth: authSlice,
    dags: dagsSlice,
    dagRuns: dagRunsSlice,
    tasks: tasksSlice,
    ui: uiSlice,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.token.expires_at'],
      },
    }),
  devTools: import.meta.env.NODE_ENV !== 'production',
});

// Export store types
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

// Export typed hooks for use throughout the app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
