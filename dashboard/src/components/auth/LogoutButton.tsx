/**
 * Logout Button Component
 * Provides user logout functionality with confirmation
 */

import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Tooltip,
} from '@mui/material';
import { Logout, Person, MoreVert } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { selectCurrentUser, selectAuthLoading } from '../../store/selectors';

interface LogoutButtonProps {
  variant?: 'button' | 'icon' | 'menu';
  showConfirmation?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'button',
  showConfirmation = true,
  size = 'medium',
}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const loading = useAppSelector(selectAuthLoading);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // Handle logout action
  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, the auth service should handle cleanup
    }
  };

  // Handle logout with confirmation
  const handleLogoutClick = () => {
    if (showConfirmation) {
      setConfirmDialogOpen(true);
    } else {
      handleLogout();
    }
  };

  // Handle confirmation dialog
  const handleConfirmLogout = () => {
    setConfirmDialogOpen(false);
    handleLogout();
  };

  const handleCancelLogout = () => {
    setConfirmDialogOpen(false);
  };

  // Handle menu operations
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleMenuLogout = () => {
    handleMenuClose();
    handleLogoutClick();
  };

  // Render different variants
  const renderLogoutButton = () => {
    switch (variant) {
      case 'icon':
        return (
          <Tooltip title="Logout">
            <IconButton
              onClick={handleLogoutClick}
              disabled={loading}
              size={size}
              color="inherit"
            >
              <Logout />
            </IconButton>
          </Tooltip>
        );

      case 'menu':
        return (
          <>
            <Tooltip
              title={
                user ? `${user.username} - Click for options` : 'User menu'
              }
            >
              <IconButton
                onClick={handleMenuOpen}
                disabled={loading}
                size={size}
                color="inherit"
              >
                <MoreVert />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem disabled>
                <ListItemIcon>
                  <Person />
                </ListItemIcon>
                <ListItemText>
                  <Typography variant="body2">
                    {user?.username || 'Unknown User'}
                  </Typography>
                  {user?.roles && user.roles.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {user.roles.join(', ')}
                    </Typography>
                  )}
                </ListItemText>
              </MenuItem>
              <MenuItem onClick={handleMenuLogout} disabled={loading}>
                <ListItemIcon>
                  <Logout />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </>
        );

      default:
        return (
          <Button
            onClick={handleLogoutClick}
            disabled={loading}
            size={size}
            startIcon={<Logout />}
            variant="outlined"
            color="inherit"
          >
            {loading ? 'Logging out...' : 'Logout'}
          </Button>
        );
    }
  };

  return (
    <>
      {renderLogoutButton()}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelLogout}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to logout from the Airflow Dashboard?
          </Typography>
          {user && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You are currently logged in as: <strong>{user.username}</strong>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelLogout} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLogout}
            disabled={loading}
            variant="contained"
            color="primary"
          >
            {loading ? 'Logging out...' : 'Logout'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LogoutButton;
