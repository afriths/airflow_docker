/**
 * Dashboard Layout Component
 * Main layout wrapper with responsive sidebar and header
 */

import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import type { DashboardLayoutProps } from '../../types/components';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import { OfflineIndicator, LoadingSpinner } from '../';
import { useOfflineSupport } from '../../hooks';

const DRAWER_WIDTH = 280;

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  actions,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  const { 
    isOnline, 
    lastOnline, 
    cachedDataCount, 
    retryConnection 
  } = useOfflineSupport({
    enableNotifications: true,
    enableCaching: true,
  });

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(sidebarOpen &&
            !isMobile && {
              marginLeft: DRAWER_WIDTH,
              width: `calc(100% - ${DRAWER_WIDTH}px)`,
              transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }),
        }}
      >
        <DashboardHeader
          title={title}
          actions={actions}
          onMenuClick={handleSidebarToggle}
          showMenuButton={isMobile || !sidebarOpen}
          isOnline={isOnline}
        />
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={sidebarOpen}
        onClose={handleSidebarClose}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        <DashboardSidebar onClose={handleSidebarClose} />
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: isMobile ? 0 : sidebarOpen ? 0 : `-${DRAWER_WIDTH}px`,
          position: 'relative',
        }}
      >
        {/* Toolbar spacer */}
        <Toolbar />

        {/* Offline Indicator */}
        <OfflineIndicator
          isOnline={isOnline}
          lastUpdated={lastOnline}
          cachedDataCount={cachedDataCount}
          onRetry={retryConnection}
          showDetails={true}
        />

        {/* Page content */}
        <Box
          sx={{
            p: 3,
            minHeight: 'calc(100vh - 64px)', // Account for toolbar height
            backgroundColor: theme.palette.grey[50],
            position: 'relative',
          }}
        >
          {loading && (
            <LoadingSpinner
              overlay={true}
              message="Loading..."
              size="large"
            />
          )}
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
