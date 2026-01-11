/**
 * Component Props Types
 * Defines prop interfaces for React components
 */

import React from 'react';
import type {
  DAG,
  DAGRun,
  TaskInstance,
  Notification,
  PaginationInfo,
} from './app';

// Layout components
export interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
  loading?: boolean;
}

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
  dags: DAG[];
  selectedDAG?: string;
  onDAGSelect: (dagId: string) => void;
}

export interface HeaderProps {
  title: string;
  user?: {
    username: string;
    email?: string;
  };
  onLogout: () => void;
  actions?: React.ReactNode;
}

// DAG components
export interface DAGListProps {
  dags: DAG[];
  onTrigger: (dagId: string) => void;
  onRefresh: () => void;
  onDAGSelect: (dagId: string) => void;
  loading: boolean;
  error?: string | null;
  selectedDAG?: string;
}

export interface DAGCardProps {
  dag: DAG;
  onTrigger: (dagId: string) => void;
  onSelect: (dagId: string) => void;
  selected?: boolean;
  showTriggerButton?: boolean;
}

export interface DAGTriggerDialogProps {
  open: boolean;
  dag: DAG | null;
  onClose: () => void;
  onConfirm: (dagId: string, conf?: object) => void;
  loading?: boolean;
}

// DAG Run components
export interface DAGRunHistoryProps {
  dagId: string;
  runs: DAGRun[];
  onRunSelect: (runId: string) => void;
  onRefresh: () => void;
  loading: boolean;
  error?: string | null;
  pagination?: PaginationInfo;
  selectedRun?: string;
}

export interface DAGRunCardProps {
  run: DAGRun;
  onSelect: (runId: string) => void;
  selected?: boolean;
  showDetails?: boolean;
}

// Task components
export interface TaskStatusProps {
  dagId: string;
  dagRunId: string;
  tasks: TaskInstance[];
  onTaskClick: (taskId: string) => void;
  onRefresh: () => void;
  loading: boolean;
  error?: string | null;
}

export interface TaskInstanceCardProps {
  task: TaskInstance;
  onClick: (taskId: string) => void;
  showDetails?: boolean;
}

export interface TaskLogViewerProps {
  open: boolean;
  dagId: string;
  dagRunId: string;
  taskId: string;
  onClose: () => void;
}

// Authentication components
export interface LoginFormProps {
  onSubmit: (username: string, password: string) => void;
  loading?: boolean;
  error?: string | null;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

// UI components
export interface NotificationProps {
  notification: Notification;
  onClose: (id: string) => void;
}

export interface NotificationListProps {
  notifications: Notification[];
  onClose: (id: string) => void;
  onClearAll: () => void;
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary';
  overlay?: boolean;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  severity?: 'info' | 'warning' | 'error';
}

// Filter and search components
export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export interface FilterChipsProps {
  filters: Array<{
    key: string;
    label: string;
    value: string;
  }>;
  onRemove: (key: string) => void;
  onClear: () => void;
}

// Status indicator components
export interface StatusBadgeProps {
  status: string;
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
}

export interface StatusIconProps {
  status: string;
  size?: number;
}

// Pagination components
export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
  showPageSize?: boolean;
  onPageSizeChange?: (size: number) => void;
}

// Chart and visualization components
export interface TaskTimelineProps {
  tasks: TaskInstance[];
  height?: number;
  showLabels?: boolean;
}

export interface DAGRunChartProps {
  runs: DAGRun[];
  height?: number;
  timeRange?: {
    start: string;
    end: string;
  };
}
