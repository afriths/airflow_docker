/**
 * Skeleton Loader Components
 * Provides skeleton loading states for different UI components
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Grid,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';

// Generic skeleton loader
export interface SkeletonLoaderProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | false;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'wave',
}) => (
  <Skeleton
    variant={variant}
    width={width}
    height={height}
    animation={animation}
  />
);

// DAG List skeleton
export interface DAGListSkeletonProps {
  count?: number;
}

export const DAGListSkeleton: React.FC<DAGListSkeletonProps> = ({
  count = 5,
}) => (
  <Stack spacing={2}>
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index} variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            {/* DAG name and status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="text" width="30%" height={28} />
              <Box sx={{ ml: 'auto' }}>
                <Skeleton variant="rectangular" width={80} height={24} />
              </Box>
            </Box>
            
            {/* Description */}
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
            
            {/* Metadata */}
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={100} />
              <Skeleton variant="text" width={140} />
            </Box>
          </Stack>
        </CardContent>
      </Card>
    ))}
  </Stack>
);

// DAG Run History skeleton
export interface DAGRunHistorySkeletonProps {
  count?: number;
}

export const DAGRunHistorySkeleton: React.FC<DAGRunHistorySkeletonProps> = ({
  count = 10,
}) => (
  <Table>
    <TableHead>
      <TableRow>
        <TableCell><Skeleton variant="text" width={80} /></TableCell>
        <TableCell><Skeleton variant="text" width={100} /></TableCell>
        <TableCell><Skeleton variant="text" width={120} /></TableCell>
        <TableCell><Skeleton variant="text" width={80} /></TableCell>
        <TableCell><Skeleton variant="text" width={100} /></TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {Array.from({ length: count }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Skeleton variant="circular" width={16} height={16} />
              <Skeleton variant="text" width={80} />
            </Box>
          </TableCell>
          <TableCell><Skeleton variant="text" width={100} /></TableCell>
          <TableCell><Skeleton variant="text" width={120} /></TableCell>
          <TableCell><Skeleton variant="text" width={80} /></TableCell>
          <TableCell><Skeleton variant="text" width={100} /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

// Task Status skeleton
export interface TaskStatusSkeletonProps {
  count?: number;
}

export const TaskStatusSkeleton: React.FC<TaskStatusSkeletonProps> = ({
  count = 8,
}) => (
  <Grid container spacing={2}>
    {Array.from({ length: count }).map((_, index) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              {/* Task name and status */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="circular" width={20} height={20} />
                <Skeleton variant="text" width="70%" />
              </Box>
              
              {/* Duration and details */}
              <Skeleton variant="text" width="50%" />
              <Skeleton variant="text" width="60%" />
              
              {/* Progress bar */}
              <Skeleton variant="rectangular" width="100%" height={4} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// Sidebar skeleton
export const SidebarSkeleton: React.FC = () => (
  <Box sx={{ p: 2 }}>
    <Stack spacing={2}>
      {/* Header */}
      <Skeleton variant="text" width="80%" height={32} />
      
      {/* Search bar */}
      <Skeleton variant="rectangular" width="100%" height={40} />
      
      {/* DAG list */}
      <List>
        {Array.from({ length: 6 }).map((_, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={<Skeleton variant="text" width="70%" />}
              secondary={<Skeleton variant="text" width="50%" />}
            />
          </ListItem>
        ))}
      </List>
    </Stack>
  </Box>
);

// Dashboard stats skeleton
export const DashboardStatsSkeleton: React.FC = () => (
  <Grid container spacing={3}>
    {Array.from({ length: 4 }).map((_, index) => (
      <Grid item xs={12} sm={6} md={3} key={index}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </Box>
              </Box>
              <Skeleton variant="text" width="80%" height={32} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// Generic card skeleton
export interface CardSkeletonProps {
  lines?: number;
  showAvatar?: boolean;
  showActions?: boolean;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  lines = 3,
  showAvatar = false,
  showActions = false,
}) => (
  <Card variant="outlined">
    <CardContent>
      <Stack spacing={2}>
        {showAvatar && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          </Box>
        )}
        
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            variant="text"
            width={index === lines - 1 ? '70%' : '100%'}
          />
        ))}
        
        {showActions && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Skeleton variant="rectangular" width={80} height={32} />
            <Skeleton variant="rectangular" width={80} height={32} />
          </Box>
        )}
      </Stack>
    </CardContent>
  </Card>
);

export default SkeletonLoader;