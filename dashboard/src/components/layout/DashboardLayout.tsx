/**
 * Dashboard Layout Component
 * Main layout wrapper with responsive sidebar and header
 * Enhanced with accessibility features and responsive design
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  useTheme,
  Fab,
  Zoom,
} from '@mui/material';
import { KeyboardArrowUp as ScrollTopIcon } from '@mui/icons-material';
import type { DashboardLayoutProps } from '../../types/components';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import { OfflineIndicator, LoadingSpinner, SkipLink } from '../';
import { useOfflineSupport, useResponsive, useAccessibility, useKeyboardNavigation } from '../../hooks';

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  actions,
  loading = false,
}) => {
  const theme = useTheme();
  const { isMobile, getSidebarWidth } = useResponsive();
  const { announcePageChange, prefersReducedMotion } = useAccessibility();
  const { handleKeyDown } = useKeyboardNavigation({
    enableGlobalShortcuts: true,
    customShortcuts: {
      'ctrl+m': () => setSidebarOpen(!sidebarOpen),
      'alt+1': () => setFocusToMain(),
    },
  });

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const DRAWER_WIDTH = getSidebarWidth();
  
  const { 
    isOnline, 
    lastOnline, 
    cachedDataCount, 
    retryConnection 
  } = useOfflineSupport({
    enableNotifications: true,
    enableCaching: true,
  });

  // Announce page changes for screen readers
  useEffect(() => {
    if (title) {
      announcePageChange(title);
    }
  }, [title, announcePageChange]);

  // Handle scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const setFocusToMain = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ 
        behavior: prefersReducedMotion ? 'auto' : 'smooth', 
        block: 'start' 
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <Box 
      sx={{ display: 'flex', minHeight: '100vh' }}
      onKeyDown={handleKeyDown}
    >
      {/* Skip Link for Accessibility */}
      <SkipLink targetId="main-content" />

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
        role="banner"
      >
        <DashboardHeader
          title={title}
          actions={actions}
          onMenuClick={handleSidebarToggle}
          showMenuButton={isMobile || !sidebarOpen}
          isOnline={isOnline}
        />
      </AppBar>

      {/* Sidebar Navigation */}
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
        role="navigation"
        aria-label="Main navigation"
      >
        <DashboardSidebar onClose={handleSidebarClose} />
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          flexGrow: 1,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: isMobile ? 0 : sidebarOpen ? 0 : `-${DRAWER_WIDTH}px`,
          position: 'relative',
          outline: 'none', // Remove focus outline since we handle it with skip links
        }}
        role="main"
        aria-label="Main content"
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
            p: {
              xs: 2,
              sm: 3,
              md: 3,
            },
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
          
          {/* Page Title for Screen Readers */}
          <Box
            component="h1"
            sx={{
              position: 'absolute',
              left: '-10000px',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
            }}
            aria-live="polite"
          >
            {title}
          </Box>

          {children}
        </Box>

        {/* Scroll to Top Button */}
        <Zoom in={showScrollTop}>
          <Fab
            color="primary"
            size="small"
            onClick={scrollToTop}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: theme.zIndex.speedDial,
            }}
            aria-label="Scroll to top"
          >
            <ScrollTopIcon />
          </Fab>
        </Zoom>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
