/**
 * Dashboard Home Page
 * Main dashboard overview with key metrics and recent activity
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import type { DAG } from '../types/app';
import { useAppSelector } from '../store';

const DashboardPage: React.FC = () => {
  const { items: dags, loading } = useAppSelector((state) => state.dags);

  // Calculate dashboard metrics
  const totalDAGs = dags.length;
  const activeDAGs = dags.filter((dag: DAG) => !dag.is_paused).length;
  const pausedDAGs = dags.filter((dag: DAG) => dag.is_paused).length;
  const successfulRuns = dags.filter((dag: DAG) => dag.last_run_state === 'success').length;
  const failedRuns = dags.filter((dag: DAG) => dag.last_run_state === 'failed').length;
  const runningDAGs = dags.filter((dag: DAG) => dag.last_run_state === 'running').length;

  const metrics = [
    {
      title: 'Total DAGs',
      value: totalDAGs,
      icon: <PlayArrowIcon />,
      color: 'primary',
    },
    {
      title: 'Active DAGs',
      value: activeDAGs,
      icon: <PlayArrowIcon />,
      color: 'success',
    },
    {
      title: 'Paused DAGs',
      value: pausedDAGs,
      icon: <ScheduleIcon />,
      color: 'warning',
    },
    {
      title: 'Running',
      value: runningDAGs,
      icon: <PlayArrowIcon />,
      color: 'info',
    },
    {
      title: 'Successful Runs',
      value: successfulRuns,
      icon: <SuccessIcon />,
      color: 'success',
    },
    {
      title: 'Failed Runs',
      value: failedRuns,
      icon: <ErrorIcon />,
      color: 'error',
    },
  ];

  if (loading && dags.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard Overview
      </Typography>

      {/* Metrics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {metrics.map((metric) => (
          <Box
            key={metric.title}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.333% - 16px)', lg: '1 1 calc(16.666% - 20px)' },
              minWidth: 200,
            }}
          >
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1,
                    color: `${metric.color}.main`,
                  }}
                >
                  {metric.icon}
                </Box>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{ fontWeight: 700, mb: 1 }}
                >
                  {metric.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metric.title}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent DAG Activity
          </Typography>
          
          {dags.length === 0 ? (
            <Typography color="text.secondary">
              No DAGs available. Start by creating your first DAG.
            </Typography>
          ) : (
            <Box>
              {dags.slice(0, 10).map((dag: DAG) => (
                <Box
                  key={dag.dag_id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {dag.dag_id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dag.description || 'No description'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {dag.is_paused && (
                      <Chip
                        label="Paused"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                    
                    {dag.last_run_state && (
                      <Chip
                        label={dag.last_run_state}
                        size="small"
                        color={
                          dag.last_run_state === 'success'
                            ? 'success'
                            : dag.last_run_state === 'failed'
                            ? 'error'
                            : dag.last_run_state === 'running'
                            ? 'warning'
                            : 'default'
                        }
                      />
                    )}
                    
                    {dag.last_run_date && (
                      <Typography variant="caption" color="text.secondary">
                        {new Date(dag.last_run_date).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
              
              {dags.length > 10 && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing 10 of {dags.length} DAGs
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage;