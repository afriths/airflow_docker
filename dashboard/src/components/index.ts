/**
 * Components Index
 * Central export point for all components organized by category
 */

// Authentication Components
export * from './auth';

// DAG Components  
export * from './dag';

// Task Components
export * from './task';

// Error Components
export * from './error';

// Notification Components
export * from './notification';

// Common/Shared Components
export * from './common';

// Layout Components
export * from './layout';

// Re-export specific components for backward compatibility
export { AuthProvider, LoginForm, LogoutButton, ProtectedRoute } from './auth';
export { DAGList, DAGRunHistory, DAGTriggerDialog } from './dag';
export { TaskDetailModal, TaskLogViewer, TaskStatus, TaskTimeline } from './task';
export { ErrorBoundary, ErrorDisplay } from './error';
export { NotificationList } from './notification';
export { LoadingSpinner, OfflineIndicator, RealTimeStatusIndicator, ResponsiveGrid, SkeletonLoader, SkipLink } from './common';
export { DashboardHeader, DashboardLayout, DashboardSidebar } from './layout';

// Export specific named exports from components that have them
export { ConnectionStatusChip } from './common/OfflineIndicator';
export { 
  DAGListSkeleton,
  DAGRunHistorySkeleton,
  TaskStatusSkeleton,
  SidebarSkeleton,
  DashboardStatsSkeleton,
  CardSkeleton,
} from './common/SkeletonLoader';
export { 
  ResponsiveCardGrid, 
  ResponsiveListGrid, 
  ResponsiveTwoColumnGrid 
} from './common/ResponsiveGrid';
