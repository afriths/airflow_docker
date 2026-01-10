/**
 * DAG Runs Redux Slice
 * Manages DAG run history state and actions
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { DAGRunsState, FetchDAGRunsPayload } from '../../types/store';
import type { DAGRun, DAGRunFilters } from '../../types/app';
import { airflowApiClient } from '../../services';
import { transformDAGRuns, transformDAGRun } from '../../services/apiTransformers';

// Initial state
const initialState: DAGRunsState = {};

// Async thunks for DAG run actions
export const fetchDAGRuns = createAsyncThunk(
  'dagRuns/fetchDAGRuns',
  async (payload: FetchDAGRunsPayload & { filters?: DAGRunFilters }, { rejectWithValue }) => {
    try {
      const response = await airflowApiClient.getDAGRuns({
        dag_id: payload.dagId,
        limit: payload.limit || 50,
        offset: payload.offset || 0,
        ...payload.filters,
      });
      
      return {
        dagId: payload.dagId,
        runs: transformDAGRuns(response.data.dag_runs), // Transform Airflow DAG runs to app DAG runs
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch DAG runs');
    }
  }
);

export const fetchDAGRun = createAsyncThunk(
  'dagRuns/fetchDAGRun',
  async ({ dagId, dagRunId }: { dagId: string; dagRunId: string }, { rejectWithValue }) => {
    try {
      const response = await airflowApiClient.getDAGRun(dagId, dagRunId);
      return {
        dagId,
        dagRun: transformDAGRun(response.data),
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch DAG run');
    }
  }
);

export const deleteDAGRun = createAsyncThunk(
  'dagRuns/deleteDAGRun',
  async ({ dagId, dagRunId }: { dagId: string; dagRunId: string }, { rejectWithValue }) => {
    try {
      await airflowApiClient.deleteDAGRun(dagId, dagRunId);
      return { dagId, dagRunId };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete DAG run');
    }
  }
);

// Helper function to get DAG run key
// const getDAGRunKey = (dagId: string) => dagId;

// DAG runs slice
const dagRunsSlice = createSlice({
  name: 'dagRuns',
  initialState,
  reducers: {
    // Clear DAG runs error for specific DAG
    clearDAGRunsError: (state, action: PayloadAction<string>) => {
      const dagId = action.payload;
      if (state[dagId]) {
        state[dagId].error = null;
      }
    },
    // Set selected DAG run
    setSelectedDAGRun: (state, action: PayloadAction<{ dagId: string; runId: string | null }>) => {
      const { dagId, runId } = action.payload;
      if (state[dagId]) {
        state[dagId].selectedRun = runId;
      }
    },
    // Update specific DAG run
    updateDAGRun: (state, action: PayloadAction<{ dagId: string; dagRun: Partial<DAGRun> & { dag_run_id: string } }>) => {
      const { dagId, dagRun } = action.payload;
      if (state[dagId]) {
        const runIndex = state[dagId].runs.findIndex(run => run.dag_run_id === dagRun.dag_run_id);
        if (runIndex !== -1) {
          state[dagId].runs[runIndex] = { ...state[dagId].runs[runIndex], ...dagRun };
        }
      }
    },
    // Add new DAG run (for when a DAG is triggered)
    addDAGRun: (state, action: PayloadAction<{ dagId: string; dagRun: DAGRun }>) => {
      const { dagId, dagRun } = action.payload;
      if (!state[dagId]) {
        state[dagId] = {
          runs: [],
          loading: false,
          error: null,
          lastUpdated: null,
          selectedRun: null,
        };
      }
      // Add to the beginning of the array (most recent first)
      state[dagId].runs.unshift(dagRun);
    },
    // Reset DAG runs for specific DAG
    resetDAGRuns: (state, action: PayloadAction<string>) => {
      const dagId = action.payload;
      delete state[dagId];
    },
    // Reset all DAG runs
    resetAllDAGRuns: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch DAG runs
    builder
      .addCase(fetchDAGRuns.pending, (state, action) => {
        const dagId = action.meta.arg.dagId;
        if (!state[dagId]) {
          state[dagId] = {
            runs: [],
            loading: false,
            error: null,
            lastUpdated: null,
            selectedRun: null,
          };
        }
        state[dagId].loading = true;
        state[dagId].error = null;
      })
      .addCase(fetchDAGRuns.fulfilled, (state, action) => {
        const { dagId, runs, timestamp } = action.payload;
        state[dagId].loading = false;
        state[dagId].runs = runs;
        state[dagId].lastUpdated = timestamp;
        state[dagId].error = null;
      })
      .addCase(fetchDAGRuns.rejected, (state, action) => {
        const dagId = action.meta.arg.dagId;
        if (state[dagId]) {
          state[dagId].loading = false;
          state[dagId].error = action.payload as string;
        }
      });

    // Fetch single DAG run
    builder
      .addCase(fetchDAGRun.pending, (state, action) => {
        const dagId = action.meta.arg.dagId;
        if (!state[dagId]) {
          state[dagId] = {
            runs: [],
            loading: false,
            error: null,
            lastUpdated: null,
            selectedRun: null,
          };
        }
        state[dagId].loading = true;
        state[dagId].error = null;
      })
      .addCase(fetchDAGRun.fulfilled, (state, action) => {
        const { dagId, dagRun, timestamp } = action.payload;
        state[dagId].loading = false;
        
        // Update existing run or add new one
        const runIndex = state[dagId].runs.findIndex(run => run.dag_run_id === dagRun.dag_run_id);
        if (runIndex !== -1) {
          state[dagId].runs[runIndex] = dagRun;
        } else {
          state[dagId].runs.unshift(dagRun);
        }
        
        state[dagId].lastUpdated = timestamp;
        state[dagId].error = null;
      })
      .addCase(fetchDAGRun.rejected, (state, action) => {
        const dagId = action.meta.arg.dagId;
        if (state[dagId]) {
          state[dagId].loading = false;
          state[dagId].error = action.payload as string;
        }
      });

    // Delete DAG run
    builder
      .addCase(deleteDAGRun.pending, (state, action) => {
        const dagId = action.meta.arg.dagId;
        if (state[dagId]) {
          state[dagId].loading = true;
          state[dagId].error = null;
        }
      })
      .addCase(deleteDAGRun.fulfilled, (state, action) => {
        const { dagId, dagRunId } = action.payload;
        if (state[dagId]) {
          state[dagId].loading = false;
          state[dagId].runs = state[dagId].runs.filter(run => run.dag_run_id !== dagRunId);
          if (state[dagId].selectedRun === dagRunId) {
            state[dagId].selectedRun = null;
          }
          state[dagId].error = null;
        }
      })
      .addCase(deleteDAGRun.rejected, (state, action) => {
        const dagId = action.meta.arg.dagId;
        if (state[dagId]) {
          state[dagId].loading = false;
          state[dagId].error = action.payload as string;
        }
      });
  },
});

// Export actions
export const {
  clearDAGRunsError,
  setSelectedDAGRun,
  updateDAGRun,
  addDAGRun,
  resetDAGRuns,
  resetAllDAGRuns,
} = dagRunsSlice.actions;

// Export reducer
export default dagRunsSlice.reducer;