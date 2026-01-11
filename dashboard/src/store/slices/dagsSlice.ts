/**
 * DAGs Redux Slice
 * Manages DAG list state and actions
 */

import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { DAGsState, TriggerDAGPayload } from '../../types/store';
import type { DAG, DAGFilters } from '../../types/app';
import { airflowApiClient } from '../../services';
import { transformDAGs, transformDAGRun } from '../../services/apiTransformers';

// Initial state
const initialState: DAGsState = {
  items: [],
  loading: false,
  error: null,
  lastUpdated: null,
  selectedDAG: null,
};

// Async thunks for DAG actions
export const fetchDAGs = createAsyncThunk(
  'dags/fetchDAGs',
  async (filters: DAGFilters = {}, { rejectWithValue }) => {
    try {
      const response = await airflowApiClient.getDAGs(filters);
      return {
        dags: transformDAGs(response.data.dags), // Transform Airflow DAGs to app DAGs
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch DAGs');
    }
  }
);

export const triggerDAG = createAsyncThunk(
  'dags/triggerDAG',
  async (payload: TriggerDAGPayload, { rejectWithValue }) => {
    try {
      const response = await airflowApiClient.triggerDAG({
        dag_id: payload.dagId,
        conf: payload.conf,
      });
      return {
        dagId: payload.dagId,
        dagRun: transformDAGRun(response.data),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to trigger DAG');
    }
  }
);

export const pauseDAG = createAsyncThunk(
  'dags/pauseDAG',
  async (dagId: string, { rejectWithValue }) => {
    try {
      await airflowApiClient.pauseDAG(dagId);
      return dagId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to pause DAG');
    }
  }
);

export const unpauseDAG = createAsyncThunk(
  'dags/unpauseDAG',
  async (dagId: string, { rejectWithValue }) => {
    try {
      await airflowApiClient.unpauseDAG(dagId);
      return dagId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to unpause DAG');
    }
  }
);

// DAGs slice
const dagsSlice = createSlice({
  name: 'dags',
  initialState,
  reducers: {
    // Clear DAGs error
    clearDAGsError: state => {
      state.error = null;
    },
    // Set selected DAG
    setSelectedDAG: (state, action: PayloadAction<string | null>) => {
      state.selectedDAG = action.payload;
    },
    // Update DAG in the list
    updateDAG: (
      state,
      action: PayloadAction<Partial<DAG> & { dag_id: string }>
    ) => {
      const index = state.items.findIndex(
        dag => dag.dag_id === action.payload.dag_id
      );
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    },
    // Reset DAGs state
    resetDAGs: state => {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.lastUpdated = null;
      state.selectedDAG = null;
    },
  },
  extraReducers: builder => {
    // Fetch DAGs
    builder
      .addCase(fetchDAGs.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDAGs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.dags;
        state.lastUpdated = action.payload.timestamp;
        state.error = null;
      })
      .addCase(fetchDAGs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Trigger DAG
    builder
      .addCase(triggerDAG.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(triggerDAG.fulfilled, (state, action) => {
        state.loading = false;
        // Update the DAG's last run information
        const dagIndex = state.items.findIndex(
          dag => dag.dag_id === action.payload.dagId
        );
        if (dagIndex !== -1) {
          state.items[dagIndex].last_run_state = action.payload.dagRun.state;
          state.items[dagIndex].last_run_date =
            action.payload.dagRun.start_date;
        }
        state.error = null;
      })
      .addCase(triggerDAG.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Pause DAG
    builder
      .addCase(pauseDAG.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(pauseDAG.fulfilled, (state, action) => {
        state.loading = false;
        const dagIndex = state.items.findIndex(
          dag => dag.dag_id === action.payload
        );
        if (dagIndex !== -1) {
          state.items[dagIndex].is_paused = true;
        }
        state.error = null;
      })
      .addCase(pauseDAG.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Unpause DAG
    builder
      .addCase(unpauseDAG.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unpauseDAG.fulfilled, (state, action) => {
        state.loading = false;
        const dagIndex = state.items.findIndex(
          dag => dag.dag_id === action.payload
        );
        if (dagIndex !== -1) {
          state.items[dagIndex].is_paused = false;
        }
        state.error = null;
      })
      .addCase(unpauseDAG.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { clearDAGsError, setSelectedDAG, updateDAG, resetDAGs } =
  dagsSlice.actions;

// Export reducer
export default dagsSlice.reducer;
