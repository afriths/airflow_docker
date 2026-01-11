/**
 * DAG Runs Selectors
 * Selectors for DAG run history state and computed values
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../types/store';
import type { DAGRun } from '../../types/app';

// Base DAG runs selector
export const selectDAGRuns = (state: RootState) => state.dagRuns;

// DAG runs for specific DAG selector factory
export const selectDAGRunsForDAG = (dagId: string) =>
  createSelector(
    [selectDAGRuns],
    dagRuns =>
      dagRuns[dagId] || {
        runs: [],
        loading: false,
        error: null,
        lastUpdated: null,
        selectedRun: null,
      }
  );

// DAG runs list for specific DAG
export const selectDAGRunsList = (dagId: string) =>
  createSelector(
    [selectDAGRunsForDAG(dagId)],
    dagRunsState => dagRunsState.runs
  );

// DAG runs loading state for specific DAG
export const selectDAGRunsLoading = (dagId: string) =>
  createSelector(
    [selectDAGRunsForDAG(dagId)],
    dagRunsState => dagRunsState.loading
  );

// DAG runs error for specific DAG
export const selectDAGRunsError = (dagId: string) =>
  createSelector(
    [selectDAGRunsForDAG(dagId)],
    dagRunsState => dagRunsState.error
  );

// Selected DAG run ID for specific DAG
export const selectSelectedDAGRunId = (dagId: string) =>
  createSelector(
    [selectDAGRunsForDAG(dagId)],
    dagRunsState => dagRunsState.selectedRun
  );

// Selected DAG run for specific DAG
export const selectSelectedDAGRun = (dagId: string) =>
  createSelector(
    [selectDAGRunsList(dagId), selectSelectedDAGRunId(dagId)],
    (runs, selectedRunId) => {
      if (!selectedRunId) return null;
      return runs.find(run => run.dag_run_id === selectedRunId) || null;
    }
  );

// Latest DAG run for specific DAG
export const selectLatestDAGRun = (dagId: string) =>
  createSelector([selectDAGRunsList(dagId)], runs => {
    if (runs.length === 0) return null;
    // Runs are typically sorted by execution_date descending
    return runs[0];
  });

// DAG run by ID selector factory
export const selectDAGRunById = (dagId: string, runId: string) =>
  createSelector(
    [selectDAGRunsList(dagId)],
    runs => runs.find(run => run.dag_run_id === runId) || null
  );

// Filtered DAG runs selectors
export const selectRunningDAGRuns = (dagId: string) =>
  createSelector([selectDAGRunsList(dagId)], runs =>
    runs.filter(run => run.state === 'running')
  );

export const selectFailedDAGRuns = (dagId: string) =>
  createSelector([selectDAGRunsList(dagId)], runs =>
    runs.filter(run => run.state === 'failed')
  );

export const selectSuccessfulDAGRuns = (dagId: string) =>
  createSelector([selectDAGRunsList(dagId)], runs =>
    runs.filter(run => run.state === 'success')
  );

export const selectManualDAGRuns = (dagId: string) =>
  createSelector([selectDAGRunsList(dagId)], runs =>
    runs.filter(run => run.run_type === 'manual')
  );

export const selectScheduledDAGRuns = (dagId: string) =>
  createSelector([selectDAGRunsList(dagId)], runs =>
    runs.filter(run => run.run_type === 'scheduled')
  );

// DAG run statistics for specific DAG
export const selectDAGRunStats = (dagId: string) =>
  createSelector([selectDAGRunsList(dagId)], runs => {
    const stats = {
      total: runs.length,
      running: 0,
      success: 0,
      failed: 0,
      manual: 0,
      scheduled: 0,
      avgDuration: 0,
    };

    let totalDuration = 0;
    let completedRuns = 0;

    runs.forEach(run => {
      // Count by state
      switch (run.state) {
        case 'running':
          stats.running++;
          break;
        case 'success':
          stats.success++;
          break;
        case 'failed':
          stats.failed++;
          break;
      }

      // Count by run type
      switch (run.run_type) {
        case 'manual':
          stats.manual++;
          break;
        case 'scheduled':
          stats.scheduled++;
          break;
      }

      // Calculate average duration
      if (run.duration) {
        totalDuration += run.duration;
        completedRuns++;
      }
    });

    if (completedRuns > 0) {
      stats.avgDuration = totalDuration / completedRuns;
    }

    return stats;
  });

// Recent DAG runs (last 10)
export const selectRecentDAGRuns = (dagId: string) =>
  createSelector([selectDAGRunsList(dagId)], runs => runs.slice(0, 10));

// DAG runs with duration calculated
export const selectDAGRunsWithDuration = (dagId: string) =>
  createSelector([selectDAGRunsList(dagId)], runs =>
    runs.map(run => ({
      ...run,
      duration:
        run.end_date && run.start_date
          ? new Date(run.end_date).getTime() -
            new Date(run.start_date).getTime()
          : run.duration || null,
    }))
  );

// Filter DAG runs by date range
export const selectDAGRunsByDateRange = (
  dagId: string,
  startDate: string,
  endDate: string
) =>
  createSelector([selectDAGRunsList(dagId)], runs =>
    runs.filter(run => {
      const runDate = new Date(run.execution_date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return runDate >= start && runDate <= end;
    })
  );

// All DAG runs across all DAGs (for global statistics)
export const selectAllDAGRuns = createSelector([selectDAGRuns], dagRuns => {
  const allRuns: DAGRun[] = [];
  Object.values(dagRuns).forEach(dagRunState => {
    allRuns.push(...dagRunState.runs);
  });
  return allRuns;
});

// Global DAG run statistics
export const selectGlobalDAGRunStats = createSelector(
  [selectAllDAGRuns],
  allRuns => {
    const stats = {
      total: allRuns.length,
      running: 0,
      success: 0,
      failed: 0,
      manual: 0,
      scheduled: 0,
    };

    allRuns.forEach(run => {
      switch (run.state) {
        case 'running':
          stats.running++;
          break;
        case 'success':
          stats.success++;
          break;
        case 'failed':
          stats.failed++;
          break;
      }

      switch (run.run_type) {
        case 'manual':
          stats.manual++;
          break;
        case 'scheduled':
          stats.scheduled++;
          break;
      }
    });

    return stats;
  }
);

// Data freshness selectors
export const selectDAGRunsDataAge = (dagId: string) =>
  createSelector([selectDAGRunsForDAG(dagId)], dagRunsState => {
    if (!dagRunsState.lastUpdated) return null;
    return Date.now() - dagRunsState.lastUpdated;
  });

export const selectDAGRunsNeedRefresh = (dagId: string) =>
  createSelector([selectDAGRunsDataAge(dagId)], dataAge => {
    if (dataAge === null) return true;
    // Consider data stale after 30 seconds for active runs, 2 minutes for completed
    return dataAge > 30000;
  });
