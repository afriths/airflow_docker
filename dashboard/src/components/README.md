# Components Structure

This directory contains all React components organized by category for better maintainability and discoverability.

## 📁 Folder Structure

```
components/
├── auth/           # Authentication & authorization components
├── common/         # Shared/reusable UI components  
├── dag/            # DAG-specific components
├── error/          # Error handling components
├── layout/         # Layout & navigation components
├── notification/   # Notification & alert components
├── task/           # Task-specific components
└── index.ts        # Central export point
```

## 🔐 Auth Components
- `AuthProvider` - Authentication context provider
- `LoginForm` - User login form
- `LogoutButton` - Logout functionality
- `ProtectedRoute` - Route protection wrapper

## 🔄 DAG Components  
- `DAGList` - Display list of DAGs
- `DAGRunHistory` - Show DAG run history
- `DAGTriggerDialog` - Trigger DAG runs

## ⚙️ Task Components
- `TaskDetailModal` - Task details modal
- `TaskLogViewer` - View task logs
- `TaskStatus` - Display task status
- `TaskTimeline` - Task execution timeline

## 🚨 Error Components
- `ErrorBoundary` - React error boundary
- `ErrorDisplay` - Error message display

## 📢 Notification Components
- `NotificationList` - Display notifications

## 🎨 Common Components
- `LoadingSpinner` - Loading indicators
- `OfflineIndicator` - Connection status
- `RealTimeStatusIndicator` - Real-time status
- `ResponsiveGrid` - Responsive grid layouts
- `SkeletonLoader` - Loading skeletons
- `SkipLink` - Accessibility skip links

## 🏗️ Layout Components
- `DashboardHeader` - Main header
- `DashboardLayout` - Main layout wrapper
- `DashboardSidebar` - Navigation sidebar

## 📦 Usage

All components are exported from the main index file:

```typescript
import { LoginForm, DAGList, TaskStatus } from '../components';

// Or import from specific categories:
import { LoginForm } from '../components/auth';
import { DAGList } from '../components/dag';
import { TaskStatus } from '../components/task';
```

## 🔄 Adding New Components

1. Create the component in the appropriate category folder
2. Add export to the category's `index.ts` file
3. Add re-export to the main `components/index.ts` file

## 📝 Naming Conventions

- Use PascalCase for component names
- Use descriptive names that indicate purpose
- Group related components in the same category
- Prefix with category when needed (e.g., `DAGList`, `TaskStatus`)