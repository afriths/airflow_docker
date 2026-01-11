/**
 * DAG Detail Page
 * Shows detailed information about a specific DAG
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchDAGRuns } from '../store/slices/dagRunsSlice';
import { fetchTaskInstances } from '../store/slices/tasksSlice';
import { TaskStatus } from '../components';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dag-tabpanel-${index}`}
      aria-labelledby={`dag-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DAGDetailPage: React.FC = () => {
  const { dagId } = useParams<{ dagId: string }>();
  const dispatch = useAppDispatch();
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Get DAG runs from store
  const dagRunsState = useAppSelector(state => 
    dagId ? state.dagRuns[dagId] : undefined
  );

  // Get task instances from store
  const tasksState = useAppSelector(state => {
    if (!dagId || !selectedRunId) return undefined;
    const taskKey = `${dagId}:${selectedRunId}`;
    return state.tasks[taskKey];
  });

  // Fetch DAG runs when component mounts
  useEffect(() => {
    if (dagId) {
      dispatch(fetchDAGRuns({ dagId, limit: 10 }));
    }
  }, [dispatch, dagId]);

  // Auto-select the latest DAG run
  useEffect(() => {
    if (dagRunsState?.runs && dagRunsState.runs.length > 0 && !selectedRunId) {
      const latestRun = dagRunsState.runs[0]; // Assuming runs are sorted by date
      setSelectedRunId(latestRun.dag_run_id);
    }
  }, [dagRunsState?.runs, selectedRunId]);

  // Fetch task instances when a run is selected
  useEffect(() => {
    if (dagId && selectedRunId) {
      dispatch(fetchTaskInstances({ dagId, dagRunId: selectedRunId }));
    }
  }, [dispatch, dagId, selectedRunId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTaskClick = (taskId: string) => {
    console.log('Task clicked:', taskId);
  };

  const handleRefresh = () => {
    if (dagId && selectedRunId) {
      dispatch(fetchTaskInstances({ dagId, dagRunId: selectedRunId }));
    }
  };

  if (!dagId) {
    return (
      <Alert severity="error">
        DAG ID is required to view DAG details.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        DAG: {dagId}
      </Typography>

      {/* DAG Run Selection */}
      {dagRunsState?.runs && dagRunsState.runs.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Latest DAG Runs
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {dagRunsState.runs.slice(0, 5).map((run) => (
                <Card
                  key={run.dag_run_id}
                  sx={{
                    cursor: 'pointer',
                    border: selectedRunId === run.dag_run_id ? 2 : 1,
                    borderColor: selectedRunId === run.dag_run_id ? 'primary.main' : 'divider',
                    minWidth: 200,
                  }}
                  onClick={() => setSelectedRunId(run.dag_run_id)}
                >
                  <CardContent sx={{ py: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {run.dag_run_id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {run.state} • {new Date(run.execution_date).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Task Status" />
          <Tab label="Run History" />
          <Tab label="Configuration" />
        </Tabs>
      </Box>

      {/* Task Status Tab */}
      <TabPanel value={tabValue} index={0}>
        {selectedRunId ? (
          tasksState ? (
            <TaskStatus
              dagId={dagId}
              dagRunId={selectedRunId}
              tasks={tasksState.instances}
              onTaskClick={handleTaskClick}
              onRefresh={handleRefresh}
              loading={tasksState.loading}
              error={tasksState.error}
            />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )
        ) : (
          <Alert severity="info">
            Select a DAG run to view task status.
          </Alert>
        )}
      </TabPanel>

      {/* Run History Tab */}
      <TabPanel value={tabValue} index={1}>
        <Alert severity="info">
          DAG run history will be implemented in future tasks.
        </Alert>
      </TabPanel>

      {/* Configuration Tab */}
      <TabPanel value={tabValue} index={2}>
        <Alert severity="info">
          DAG configuration view will be implemented in future tasks.
        </Alert>
      </TabPanel>
    </Box>
  );
};

export default DAGDetailPage;
