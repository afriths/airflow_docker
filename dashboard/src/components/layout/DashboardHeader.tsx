/**
 * Dashboard Header Component
 * Top navigation bar with user info and actions
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
} from '@mui/material';
import { Menu as MenuIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks';
import { LogoutButton, RealTimeStatusIndicator } from '../index';

interface DashboardHeaderProps {
  title: string;
  actions?: React.ReactNode;
  onMenuClick: () => void;
  showMenuButton: boolean;
  showRealTimeStatus?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  actions,
  onMenuClick,
  showMenuButton,
  showRealTimeStatus = true,
}) => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

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
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Page title */}
      <Typography
        variant="h6"
        noWrap
        component="div"
        sx={{ flexGrow: 1, fontWeight: 600 }}
      >
        {title}
      </Typography>

      {/* Real-time status indicator */}
      {showRealTimeStatus && (
        <Box sx={{ mr: 2, display: { xs: 'none', md: 'block' } }}>
          <RealTimeStatusIndicator showRefreshButton showSettings compact />
        </Box>
      )}

      {/* Custom actions */}
      {actions && <Box sx={{ mr: 2 }}>{actions}</Box>}

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
          />
        )}

        {/* User avatar and menu */}
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="user-menu"
          aria-haspopup="true"
          onClick={handleUserMenuOpen}
          color="inherit"
          sx={{ p: 0.5 }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              fontSize: '0.875rem',
            }}
          >
            {getUserInitials()}
          </Avatar>
        </IconButton>

        <Menu
          id="user-menu"
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
        >
          {/* User info */}
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {getUserDisplayName()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || user?.username}
            </Typography>
            {user?.roles && user.roles.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {user.roles.map(role => (
                  <Chip
                    key={role}
                    label={role}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem', height: 20 }}
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
          >
            <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
            <LogoutButton variant="menu" />
          </MenuItem>
        </Menu>
      </Box>
    </Toolbar>
  );
};

export default DashboardHeader;
