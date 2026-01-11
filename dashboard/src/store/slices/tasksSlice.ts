/**
 * Tasks Redux Slice
 * Manages task instances state and actions
 */

import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { TasksState, FetchTaskInstancesPayload } from '../../types/store';
import type { TaskInstance, TaskInstanceFilters } from '../../types/app';
import { airflowApiClient } from '../../services';
import {
  transformTaskInstances,
  transformTaskInstance,
} from '../../services/apiTransformers';

// Initial state
const initialState: TasksState = {
  taskLogs: {},
  logsLoading: false,
  logsError: null,
};

// Helper function to create task key
const createTaskKey = (dagId: string, dagRunId: string) =>
  `${dagId}:${dagRunId}`;

// Async thunks for task actions
export const fetchTaskInstances = createAsyncThunk(
  'tasks/fetchTaskInstances',
  async (
    payload: FetchTaskInstancesPayload & { filters?: TaskInstanceFilters },
    { rejectWithValue }
  ) => {
    try {
      const response = await airflowApiClient.getTaskInstances({
        dag_id: payload.dagId,
        dag_run_id: payload.dagRunId,
        limit: 100,
        offset: 0,
        ...payload.filters,
      });

      return {
        dagId: payload.dagId,
        dagRunId: payload.dagRunId,
        taskKey: createTaskKey(payload.dagId, payload.dagRunId),
        instances: transformTaskInstances(response.data.task_instances), // Transform Airflow task instances to app task instances
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch task instances');
    }
  }
);

export const fetchTaskInstance = createAsyncThunk(
  'tasks/fetchTaskInstance',
  async (
    {
      dagId,
      dagRunId,
      taskId,
    }: { dagId: string; dagRunId: string; taskId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await airflowApiClient.getTaskInstance(
        dagId,
        dagRunId,
        taskId
      );
      return {
        dagId,
        dagRunId,
        taskKey: createTaskKey(dagId, dagRunId),
        taskInstance: transformTaskInstance(response.data),
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch task instance');
    }
  }
);

export const fetchTaskLogs = createAsyncThunk(
  'tasks/fetchTaskLogs',
  async (
    {
      dag_id,
      dag_run_id,
      task_id,
      task_try_number,
      full_content,
    }: {
      dag_id: string;
      dag_run_id: string;
      task_id: string;
      task_try_number?: number;
      full_content?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await airflowApiClient.getTaskLogs({
        dag_id,
        dag_run_id,
        task_id,
        task_try_number: task_try_number || 1,
        full_content: full_content || true,
      });
      
      const logKey = `${dag_id}-${dag_run_id}-${task_id}-${task_try_number || 1}`;
      
      return {
        logKey,
        logs: response.data.content,
        dagId: dag_id,
        dagRunId: dag_run_id,
        taskId: task_id,
        tryNumber: task_try_number || 1,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch task logs');
    }
  }
);

export const clearTaskInstance = createAsyncThunk(
  'tasks/clearTaskInstance',
  async (
    {
      dagId,
      dagRunId,
      taskId,
    }: { dagId: string; dagRunId: string; taskId: string },
    { rejectWithValue }
  ) => {
    try {
      await airflowApiClient.clearTaskInstance(dagId, dagRunId, taskId);
      return { dagId, dagRunId, taskId };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to clear task instance');
    }
  }
);

export const markTaskSuccess = createAsyncThunk(
  'tasks/markTaskSuccess',
  async (
    {
      dagId,
      dagRunId,
      taskId,
    }: { dagId: string; dagRunId: string; taskId: string },
    { rejectWithValue }
  ) => {
    try {
      await airflowApiClient.markTaskSuccess(dagId, dagRunId, taskId);
      return { dagId, dagRunId, taskId };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark task as success');
    }
  }
);

export const markTaskFailed = createAsyncThunk(
  'tasks/markTaskFailed',
  async (
    {
      dagId,
      dagRunId,
      taskId,
    }: { dagId: string; dagRunId: string; taskId: string },
    { rejectWithValue }
  ) => {
    try {
      await airflowApiClient.markTaskFailed(dagId, dagRunId, taskId);
      return { dagId, dagRunId, taskId };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark task as failed');
    }
  }
);

// Tasks slice
const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // Clear tasks error for specific DAG run
    clearTasksError: (
      state,
      action: PayloadAction<{ dagId: string; dagRunId: string }>
    ) => {
      const { dagId, dagRunId } = action.payload;
      const taskKey = createTaskKey(dagId, dagRunId);
      if (state[taskKey]) {
        state[taskKey].error = null;
      }
    },
    // Update specific task instance
    updateTaskInstance: (
      state,
      action: PayloadAction<{
        dagId: string;
        dagRunId: string;
        taskInstance: Partial<TaskInstance> & { task_id: string };
      }>
    ) => {
      const { dagId, dagRunId, taskInstance } = action.payload;
      const taskKey = createTaskKey(dagId, dagRunId);

      if (state[taskKey]) {
        const taskIndex = state[taskKey].instances.findIndex(
          task => task.task_id === taskInstance.task_id
        );
        if (taskIndex !== -1) {
          state[taskKey].instances[taskIndex] = {
            ...state[taskKey].instances[taskIndex],
            ...taskInstance,
          };
        }
      }
    },
    // Reset tasks for specific DAG run
    resetTasks: (
      state,
      action: PayloadAction<{ dagId: string; dagRunId: string }>
    ) => {
      const { dagId, dagRunId } = action.payload;
      const taskKey = createTaskKey(dagId, dagRunId);
      delete state[taskKey];
    },
    // Reset all tasks
    resetAllTasks: () => ({
      taskLogs: {},
      logsLoading: false,
      logsError: null,
    }),
  },
  extraReducers: builder => {
    // Fetch task instances
    builder
      .addCase(fetchTaskInstances.pending, (state, action) => {
        const { dagId, dagRunId } = action.meta.arg;
        const taskKey = createTaskKey(dagId, dagRunId);

        if (!state[taskKey]) {
          state[taskKey] = {
            instances: [],
            loading: false,
            error: null,
            lastUpdated: null,
          };
        }
        state[taskKey].loading = true;
        state[taskKey].error = null;
      })
      .addCase(fetchTaskInstances.fulfilled, (state, action) => {
        const { taskKey, instances, timestamp } = action.payload;
        state[taskKey].loading = false;
        state[taskKey].instances = instances;
        state[taskKey].lastUpdated = timestamp;
        state[taskKey].error = null;
      })
      .addCase(fetchTaskInstances.rejected, (state, action) => {
        const { dagId, dagRunId } = action.meta.arg;
        const taskKey = createTaskKey(dagId, dagRunId);

        if (state[taskKey]) {
          state[taskKey].loading = false;
          state[taskKey].error = action.payload as string;
        }
      });

    // Fetch single task instance
    builder
      .addCase(fetchTaskInstance.pending, (state, action) => {
        const { dagId, dagRunId } = action.meta.arg;
        const taskKey = createTaskKey(dagId, dagRunId);

        if (!state[taskKey]) {
          state[taskKey] = {
            instances: [],
            loading: false,
            error: null,
            lastUpdated: null,
          };
        }
        state[taskKey].loading = true;
        state[taskKey].error = null;
      })
      .addCase(fetchTaskInstance.fulfilled, (state, action) => {
        const { taskKey, taskInstance, timestamp } = action.payload;
        state[taskKey].loading = false;

        // Update existing task or add new one
        const taskIndex = state[taskKey].instances.findIndex(
          task => task.task_id === taskInstance.task_id
        );
        if (taskIndex !== -1) {
          state[taskKey].instances[taskIndex] = taskInstance;
        } else {
          state[taskKey].instances.push(taskInstance);
        }

        state[taskKey].lastUpdated = timestamp;
        state[taskKey].error = null;
      })
      .addCase(fetchTaskInstance.rejected, (state, action) => {
        const { dagId, dagRunId } = action.meta.arg;
        const taskKey = createTaskKey(dagId, dagRunId);

        if (state[taskKey]) {
          state[taskKey].loading = false;
          state[taskKey].error = action.payload as string;
        }
      });

    // Clear task instance
    builder
      .addCase(clearTaskInstance.pending, (state, action) => {
        const { dagId, dagRunId } = action.meta.arg;
        const taskKey = createTaskKey(dagId, dagRunId);

        if (state[taskKey]) {
          state[taskKey].loading = true;
          state[taskKey].error = null;
        }
      })
      .addCase(clearTaskInstance.fulfilled, (state, action) => {
        const { dagId, dagRunId, taskId } = action.payload;
        const taskKey = createTaskKey(dagId, dagRunId);

        if (state[taskKey]) {
          state[taskKey].loading = false;
          // Update the task state to indicate it was cleared
          const taskIndex = state[taskKey].instances.findIndex(
            task => task.task_id === taskId
          );
          if (taskIndex !== -1) {
            state[taskKey].instances[taskIndex].state = null;
            state[taskKey].instances[taskIndex].start_date = null;
            state[taskKey].instances[taskIndex].end_date = null;
            state[taskKey].instances[taskIndex].duration = null;
          }
          state[taskKey].error = null;
        }
      })
      .addCase(clearTaskInstance.rejected, (state, action) => {
        const { dagId, dagRunId } = action.meta.arg;
        const taskKey = createTaskKey(dagId, dagRunId);

        if (state[taskKey]) {
          state[taskKey].loading = false;
          state[taskKey].error = action.payload as string;
        }
      });

    // Mark task success
    builder.addCase(markTaskSuccess.fulfilled, (state, action) => {
      const { dagId, dagRunId, taskId } = action.payload;
      const taskKey = createTaskKey(dagId, dagRunId);

      if (state[taskKey]) {
        const taskIndex = state[taskKey].instances.findIndex(
          task => task.task_id === taskId
        );
        if (taskIndex !== -1) {
          state[taskKey].instances[taskIndex].state = 'success';
        }
      }
    });

    // Mark task failed
    builder.addCase(markTaskFailed.fulfilled, (state, action) => {
      const { dagId, dagRunId, taskId } = action.payload;
      const taskKey = createTaskKey(dagId, dagRunId);

      if (state[taskKey]) {
        const taskIndex = state[taskKey].instances.findIndex(
          task => task.task_id === taskId
        );
        if (taskIndex !== -1) {
          state[taskKey].instances[taskIndex].state = 'failed';
        }
      }
    });

    // Fetch task logs
    builder
      .addCase(fetchTaskLogs.pending, (state) => {
        state.logsLoading = true;
        state.logsError = null;
      })
      .addCase(fetchTaskLogs.fulfilled, (state, action) => {
        const { logKey, logs } = action.payload;
        state.logsLoading = false;
        state.taskLogs[logKey] = logs;
        state.logsError = null;
      })
      .addCase(fetchTaskLogs.rejected, (state, action) => {
        state.logsLoading = false;
        state.logsError = action.payload as string;
      });
  },
});

// Export actions
export const {
  clearTasksError,
  updateTaskInstance,
  resetTasks,
  resetAllTasks,
} = tasksSlice.actions;

// Export reducer
export default tasksSlice.reducer;
