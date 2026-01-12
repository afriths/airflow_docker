/**
 * Dashboard Sidebar Component
 * Navigation sidebar with DAG list preview and menu items
 * Enhanced with keyboard navigation and accessibility features
 */

import React, { useEffect, useRef } from 'react';
import {
  Box,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
  IconButton,
  Collapse,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  PlayArrow as PlayArrowIcon,
  History as HistoryIcon,
  ExpandLess,
  ExpandMore,
  Refresh as RefreshIcon,
  AccountTree as DAGIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import type { DAG } from '../../types/app';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchDAGs } from '../../store/slices/dagsSlice';
import { setSelectedDAG } from '../../store/slices/uiSlice';
import { useKeyboardNavigation, useAccessibility } from '../../hooks';

interface DashboardSidebarProps {
  onClose: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const { items: dags, loading, error } = useAppSelector(state => state.dags);
  const { selectedDAG } = useAppSelector(state => state.ui);

  const [dagsExpanded, setDAGsExpanded] = React.useState(true);

  const { generateId, getAriaLabel, announce } = useAccessibility();
  const { handleKeyDown, trapFocus } = useKeyboardNavigation({
    enableArrowNavigation: true,
    enableTabNavigation: true,
    onEscape: onClose,
    customShortcuts: {
      'enter': () => {
        const focusedElement = document.activeElement as HTMLElement;
        if (focusedElement && focusedElement.click) {
          focusedElement.click();
        }
      },
    },
  });

  // Load DAGs on component mount
  useEffect(() => {
    dispatch(fetchDAGs({}));
  }, [dispatch]);

  // Set up focus trap for sidebar
  useEffect(() => {
    if (sidebarRef.current) {
      const cleanup = trapFocus(sidebarRef);
      return cleanup;
    }
  }, [trapFocus]);

  const handleNavigation = (path: string, label: string) => {
    navigate(path);
    announce(`Navigated to ${label}`, 'polite');
    onClose(); // Close sidebar on mobile after navigation
  };

  const handleDAGSelect = (dagId: string) => {
    dispatch(setSelectedDAG(dagId));
    navigate(`/dags/${dagId}`);
    announce(`Selected DAG ${dagId}`, 'polite');
    onClose();
  };

  const handleRefreshDAGs = () => {
    dispatch(fetchDAGs({}));
    announce('Refreshing DAG list', 'polite');
  };

  const handleDAGsToggle = () => {
    const newExpanded = !dagsExpanded;
    setDAGsExpanded(newExpanded);
    announce(
      newExpanded ? 'DAG list expanded' : 'DAG list collapsed',
      'polite'
    );
  };

  const getStatusColor = (state: string | null) => {
    switch (state) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'warning';
      default:
        return 'default';
    }
  };

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
      shortcut: 'Ctrl+1',
    },
    {
      text: 'All DAGs',
      icon: <PlayArrowIcon />,
      path: '/dags',
      shortcut: 'Ctrl+2',
    },
    {
      text: 'Run History',
      icon: <HistoryIcon />,
      path: '/history',
      shortcut: 'Ctrl+3',
    },
  ];

  const navigationId = generateId('navigation');
  const dagsListId = generateId('dags-list');

  return (
    <Box 
      ref={sidebarRef}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      onKeyDown={handleKeyDown}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo/Brand area */}
      <Toolbar
        sx={{
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: '64px !important',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DAGIcon color="primary" aria-hidden="true" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              fontSize: '1.1rem',
            }}
            component="h2"
          >
            Airflow
          </Typography>
        </Box>
      </Toolbar>

      {/* Main navigation */}
      <List 
        sx={{ px: 1, py: 2 }}
        role="menubar"
        aria-labelledby={navigationId}
      >
        <Typography
          id={navigationId}
          variant="srOnly"
          component="h3"
          sx={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          Main Navigation
        </Typography>
        
        {menuItems.map(item => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip 
              title={`${item.text} (${item.shortcut})`}
              placement="right"
              arrow
            >
              <ListItemButton
                selected={isCurrentPath(item.path)}
                onClick={() => handleNavigation(item.path, item.text)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
                role="menuitem"
                aria-label={getAriaLabel(item.text, `Navigate to ${item.text}`)}
                tabIndex={0}
              >
                <ListItemIcon sx={{ minWidth: 40 }} aria-hidden="true">
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isCurrentPath(item.path) ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mx: 2 }} />

      {/* DAGs section */}
      <Box sx={{ px: 1, py: 1, flexGrow: 1, overflow: 'hidden' }}>
        <ListItemButton
          onClick={handleDAGsToggle}
          sx={{ borderRadius: 1, mb: 1 }}
          aria-expanded={dagsExpanded}
          aria-controls={dagsListId}
          aria-label={getAriaLabel(
            'DAGs section',
            dagsExpanded ? 'Collapse DAG list' : 'Expand DAG list'
          )}
        >
          <ListItemIcon sx={{ minWidth: 40 }} aria-hidden="true">
            <DAGIcon />
          </ListItemIcon>
          <ListItemText
            primary="DAGs"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          />
          <Tooltip title="Refresh DAGs">
            <span>
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  handleRefreshDAGs();
                }}
                disabled={loading}
                aria-label="Refresh DAG list"
              >
                {loading ? (
                  <CircularProgress size={16} />
                ) : (
                  <RefreshIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
          {dagsExpanded ? (
            <ExpandLess aria-hidden="true" />
          ) : (
            <ExpandMore aria-hidden="true" />
          )}
        </ListItemButton>

        <Collapse in={dagsExpanded} timeout="auto" unmountOnExit>
          <Box
            id={dagsListId}
            sx={{
              maxHeight: 'calc(100vh - 300px)',
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: 6,
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: 3,
              },
            }}
            role="region"
            aria-label="DAG list"
          >
            {error && (
              <Alert
                severity="error"
                sx={{ mx: 1, mb: 1, fontSize: '0.75rem' }}
                role="alert"
              >
                Failed to load DAGs
              </Alert>
            )}

            {loading && dags.length === 0 && (
              <Box 
                sx={{ display: 'flex', justifyContent: 'center', py: 2 }}
                role="status"
                aria-label="Loading DAGs"
              >
                <CircularProgress size={24} />
              </Box>
            )}

            {dags.length === 0 && !loading && !error && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ px: 2, py: 1, fontSize: '0.75rem' }}
                role="status"
              >
                No DAGs found
              </Typography>
            )}

            <List dense sx={{ py: 0 }} role="menu" aria-label="Available DAGs">
              {dags.slice(0, 20).map((dag: DAG) => (
                <ListItem key={dag.dag_id} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={selectedDAG === dag.dag_id}
                    onClick={() => handleDAGSelect(dag.dag_id)}
                    sx={{
                      borderRadius: 1,
                      pl: 3,
                      minHeight: 36,
                      '&.Mui-selected': {
                        backgroundColor: 'action.selected',
                      },
                    }}
                    role="menuitem"
                    aria-label={getAriaLabel(
                      dag.dag_id,
                      `DAG ${dag.dag_id}, status: ${dag.last_run_state || 'never run'}${
                        dag.is_paused ? ', paused' : ''
                      }`
                    )}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight:
                                selectedDAG === dag.dag_id ? 600 : 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                            }}
                          >
                            {dag.dag_id}
                          </Typography>
                          {dag.last_run_state && (
                            <Chip
                              size="small"
                              label={dag.last_run_state}
                              color={getStatusColor(dag.last_run_state) as any}
                              sx={{
                                height: 16,
                                fontSize: '0.625rem',
                                '& .MuiChip-label': {
                                  px: 0.5,
                                },
                              }}
                              aria-label={`Status: ${dag.last_run_state}`}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        dag.is_paused && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.625rem' }}
                          >
                            Paused
                          </Typography>
                        )
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>

            {dags.length > 20 && (
              <Box sx={{ px: 2, py: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.625rem' }}
                  role="status"
                >
                  +{dags.length - 20} more DAGs
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

export default DashboardSidebar;
