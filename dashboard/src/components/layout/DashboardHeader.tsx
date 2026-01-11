/**
 * Dashboard Header Component
 * Top navigation bar with user info and actions
 * Enhanced with accessibility features
 */

import React from 'react';
import {
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Tooltip,
} from '@mui/material';
import { Menu as MenuIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { useAuth, useAccessibility } from '../../hooks';
import { LogoutButton, RealTimeStatusIndicator, ConnectionStatusChip } from '../index';

interface DashboardHeaderProps {
  title: string;
  actions?: React.ReactNode;
  onMenuClick: () => void;
  showMenuButton: boolean;
  showRealTimeStatus?: boolean;
  isOnline?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  actions,
  onMenuClick,
  showMenuButton,
  showRealTimeStatus = true,
  isOnline = true,
}) => {
  const { user } = useAuth();
  const { generateId, getAriaLabel } = useAccessibility();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const menuId = generateId('user-menu');

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'User';
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || 'U';
  };

  return (
    <Toolbar>
      {/* Menu button for mobile/collapsed sidebar */}
      {showMenuButton && (
        <Tooltip title="Toggle navigation menu">
          <IconButton
            color="inherit"
            aria-label="Toggle navigation menu"
            onClick={onMenuClick}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>
      )}

      {/* Page title */}
      <Typography
        variant="h6"
        noWrap
        component="h1"
        sx={{ 
          flexGrow: 1, 
          fontWeight: 600,
          fontSize: {
            xs: '1rem',
            sm: '1.25rem',
          },
        }}
        id="page-title"
      >
        {title}
      </Typography>

      {/* Connection status */}
      <Box sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
        <ConnectionStatusChip 
          isOnline={isOnline} 
          size="small"
          aria-label={getAriaLabel(
            isOnline ? 'Connected' : 'Offline',
            'Connection status'
          )}
        />
      </Box>

      {/* Real-time status indicator */}
      {showRealTimeStatus && (
        <Box sx={{ mr: 2, display: { xs: 'none', md: 'block' } }}>
          <RealTimeStatusIndicator 
            showRefreshButton 
            showSettings 
            compact 
            aria-label="Real-time updates status"
          />
        </Box>
      )}

      {/* Custom actions */}
      {actions && (
        <Box sx={{ mr: 2, display: 'flex', gap: 1 }}>
          {actions}
        </Box>
      )}

      {/* User info and menu */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* User roles chip */}
        {user?.roles && user.roles.length > 0 && (
          <Chip
            label={user.roles[0]}
            size="small"
            variant="outlined"
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              display: { xs: 'none', sm: 'flex' },
            }}
            aria-label={getAriaLabel(user.roles[0], 'User role')}
          />
        )}

        {/* User avatar and menu */}
        <Tooltip title={`User menu for ${getUserDisplayName()}`}>
          <IconButton
            size="large"
            aria-label={getAriaLabel('User account menu', getUserDisplayName())}
            aria-controls={Boolean(anchorEl) ? menuId : undefined}
            aria-haspopup="true"
            aria-expanded={Boolean(anchorEl)}
            onClick={handleUserMenuOpen}
            color="inherit"
            sx={{ p: 0.5 }}
          >
            <Avatar
              sx={{
                width: { xs: 28, sm: 32 },
                height: { xs: 28, sm: 32 },
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
              alt={getUserDisplayName()}
            >
              {getUserInitials()}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          id={menuId}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleUserMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
            },
          }}
          MenuListProps={{
            'aria-labelledby': 'user-menu-button',
            role: 'menu',
          }}
        >
          {/* User info */}
          <Box sx={{ px: 2, py: 1 }} role="presentation">
            <Typography 
              variant="subtitle2" 
              sx={{ fontWeight: 600 }}
              id="user-display-name"
            >
              {getUserDisplayName()}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              aria-describedby="user-display-name"
            >
              {user?.email || user?.username}
            </Typography>
            {user?.roles && user.roles.length > 0 && (
              <Box 
                sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}
                role="list"
                aria-label="User roles"
              >
                {user.roles.map(role => (
                  <Chip
                    key={role}
                    label={role}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem', height: 20 }}
                    role="listitem"
                  />
                ))}
              </Box>
            )}
          </Box>

          <Divider />

          {/* Logout option */}
          <MenuItem
            onClick={() => {
              handleUserMenuClose();
              // LogoutButton will handle the actual logout
            }}
            sx={{ py: 1 }}
            role="menuitem"
          >
            <LogoutIcon sx={{ mr: 1, fontSize: 20 }} aria-hidden="true" />
            <LogoutButton variant="menu" />
          </MenuItem>
        </Menu>
      </Box>
    </Toolbar>
  );
};

export default DashboardHeader;
