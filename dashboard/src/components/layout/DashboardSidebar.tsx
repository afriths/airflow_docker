/**
 * Dashboard Sidebar Component
 * Navigation sidebar with DAG list preview and menu items
 */

import React, { useEffect } from 'react';
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

interface DashboardSidebarProps {
  onClose: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { items: dags, loading, error } = useAppSelector((state) => state.dags);
  const { selectedDAG } = useAppSelector((state) => state.ui);

  const [dagsExpanded, setDAGsExpanded] = React.useState(true);

  // Load DAGs on component mount
  useEffect(() => {
    dispatch(fetchDAGs({}));
  }, [dispatch]);

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose(); // Close sidebar on mobile after navigation
  };

  const handleDAGSelect = (dagId: string) => {
    dispatch(setSelectedDAG(dagId));
    navigate(`/dags/${dagId}`);
    onClose();
  };

  const handleRefreshDAGs = () => {
    dispatch(fetchDAGs({}));
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
    },
    {
      text: 'All DAGs',
      icon: <PlayArrowIcon />,
      path: '/dags',
    },
    {
      text: 'Run History',
      icon: <HistoryIcon />,
      path: '/history',
    },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          <DAGIcon color="primary" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              fontSize: '1.1rem',
            }}
          >
            Airflow
          </Typography>
        </Box>
      </Toolbar>

      {/* Main navigation */}
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={isCurrentPath(item.path)}
              onClick={() => handleNavigation(item.path)}
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
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: isCurrentPath(item.path) ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mx: 2 }} />

      {/* DAGs section */}
      <Box sx={{ px: 1, py: 1, flexGrow: 1, overflow: 'hidden' }}>
        <ListItemButton
          onClick={() => setDAGsExpanded(!dagsExpanded)}
          sx={{ borderRadius: 1, mb: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <DAGIcon />
          </ListItemIcon>
          <ListItemText
            primary="DAGs"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleRefreshDAGs();
            }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={16} />
            ) : (
              <RefreshIcon fontSize="small" />
            )}
          </IconButton>
          {dagsExpanded ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        <Collapse in={dagsExpanded} timeout="auto" unmountOnExit>
          <Box
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
          >
            {error && (
              <Alert severity="error" sx={{ mx: 1, mb: 1, fontSize: '0.75rem' }}>
                Failed to load DAGs
              </Alert>
            )}

            {loading && dags.length === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {dags.length === 0 && !loading && !error && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ px: 2, py: 1, fontSize: '0.75rem' }}
              >
                No DAGs found
              </Typography>
            )}

            <List dense sx={{ py: 0 }}>
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
                              fontWeight: selectedDAG === dag.dag_id ? 600 : 400,
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