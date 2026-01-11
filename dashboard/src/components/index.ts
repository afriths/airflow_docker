/**
 * Components Index
 * Central export point for all components
 */

// Authentication Components
export { default as LoginForm } from './LoginForm';
export { default as ProtectedRoute } from './ProtectedRoute';
export { default as AuthProvider } from './AuthProvider';
export { default as LogoutButton } from './LogoutButton';

// Layout Components
export { default as DashboardLayout } from './layout/DashboardLayout';
export { default as DashboardHeader } from './layout/DashboardHeader';
export { default as DashboardSidebar } from './layout/DashboardSidebar';

// DAG Components
export { default as DAGList } from './DAGList';
export { default as DAGTriggerDialog } from './DAGTriggerDialog';
export { default as DAGRunHistory } from './DAGRunHistory';

// Task Components
export { default as TaskStatus } from './TaskStatus';
export { default as TaskDetailModal } from './TaskDetailModal';
export { default as TaskLogViewer } from './TaskLogViewer';
export { default as TaskTimeline } from './TaskTimeline';

// Notification Components
export { default as NotificationList } from './NotificationList';

// Real-time Components
export { default as RealTimeStatusIndicator } from './RealTimeStatusIndicator';

// Error handling and feedback components
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as ErrorDisplay } from './ErrorDisplay';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as OfflineIndicator, ConnectionStatusChip } from './OfflineIndicator';

// Skeleton loading components
export { 
  default as SkeletonLoader,
  DAGListSkeleton,
  DAGRunHistorySkeleton,
  TaskStatusSkeleton,
  SidebarSkeleton,
  DashboardStatsSkeleton,
  CardSkeleton,
} from './SkeletonLoader';

// Responsive and accessibility components
export { default as SkipLink } from './SkipLink';
export { 
  default as ResponsiveGrid, 
  ResponsiveCardGrid, 
  ResponsiveListGrid, 
  ResponsiveTwoColumnGrid 
} from './ResponsiveGrid';

// Component types are available through the component imports
