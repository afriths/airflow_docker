/**
 * DAGs Selectors
 * Selectors for DAG list state and computed values
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../types/store';
import type { DAG } from '../../types/app';

// Base DAGs selector
export const selectDAGs = (state: RootState) => state.dags;

// DAG list selectors
export const selectDAGsList = createSelector([selectDAGs], dags => dags.items);

export const selectDAGsLoading = createSelector(
  [selectDAGs],
  dags => dags.loading
);

export const selectDAGsError = createSelector([selectDAGs], dags => dags.error);

export const selectDAGsLastUpdated = createSelector(
  [selectDAGs],
  dags => dags.lastUpdated
);

export const selectSelectedDAGId = createSelector(
  [selectDAGs],
  dags => dags.selectedDAG
);

// Selected DAG selector
export const selectSelectedDAG = createSelector(
  [selectDAGsList, selectSelectedDAGId],
  (dagsList, selectedDAGId) => {
    if (!selectedDAGId) return null;
    return dagsList.find(dag => dag.dag_id === selectedDAGId) || null;
  }
);

// DAG by ID selector factory
export const selectDAGById = (dagId: string) =>
  createSelector(
    [selectDAGsList],
    dagsList => dagsList.find(dag => dag.dag_id === dagId) || null
  );

// Filtered DAGs selectors
export const selectActiveDAGs = createSelector([selectDAGsList], dagsList =>
  dagsList.filter(dag => !dag.is_paused)
);

export const selectPausedDAGs = createSelector([selectDAGsList], dagsList =>
  dagsList.filter(dag => dag.is_paused)
);

export const selectDAGsWithErrors = createSelector([selectDAGsList], dagsList =>
  dagsList.filter(dag => dag.has_import_errors)
);

// DAGs with running status
export const selectRunningDAGs = createSelector([selectDAGsList], dagsList =>
  dagsList.filter(dag => dag.last_run_state === 'running')
);

export const selectFailedDAGs = createSelector([selectDAGsList], dagsList =>
  dagsList.filter(dag => dag.last_run_state === 'failed')
);

export const selectSuccessfulDAGs = createSelector([selectDAGsList], dagsList =>
  dagsList.filter(dag => dag.last_run_state === 'success')
);

// DAG statistics
export const selectDAGStats = createSelector([selectDAGsList], dagsList => {
  const stats = {
    total: dagsList.length,
    active: 0,
    paused: 0,
    running: 0,
    failed: 0,
    success: 0,
    withErrors: 0,
  };

  dagsList.forEach(dag => {
    if (dag.is_paused) {
      stats.paused++;
    } else {
      stats.active++;
    }

    if (dag.has_import_errors) {
      stats.withErrors++;
    }

    switch (dag.last_run_state) {
      case 'running':
        stats.running++;
        break;
      case 'failed':
        stats.failed++;
        break;
      case 'success':
        stats.success++;
        break;
    }
  });

  return stats;
});

// DAGs grouped by owner
export const selectDAGsByOwner = createSelector([selectDAGsList], dagsList => {
  const dagsByOwner: Record<string, DAG[]> = {};

  dagsList.forEach(dag => {
    dag.owners.forEach(owner => {
      if (!dagsByOwner[owner]) {
        dagsByOwner[owner] = [];
      }
      dagsByOwner[owner].push(dag);
    });
  });

  return dagsByOwner;
});

// DAGs grouped by tags
export const selectDAGsByTag = createSelector([selectDAGsList], dagsList => {
  const dagsByTag: Record<string, DAG[]> = {};

  dagsList.forEach(dag => {
    dag.tags.forEach(tag => {
      if (!dagsByTag[tag]) {
        dagsByTag[tag] = [];
      }
      dagsByTag[tag].push(dag);
    });
  });

  return dagsByTag;
});

// All unique owners
export const selectAllOwners = createSelector([selectDAGsList], dagsList => {
  const owners = new Set<string>();
  dagsList.forEach(dag => {
    dag.owners.forEach(owner => owners.add(owner));
  });
  return Array.from(owners).sort();
});

// All unique tags
export const selectAllTags = createSelector([selectDAGsList], dagsList => {
  const tags = new Set<string>();
  dagsList.forEach(dag => {
    dag.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
});

// Search and filter selector factory
export const selectFilteredDAGs = (
  searchTerm: string,
  filters: {
    paused?: boolean;
    tags?: string[];
    owners?: string[];
    states?: string[];
  }
) =>
  createSelector([selectDAGsList], dagsList => {
    return dagsList.filter(dag => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          dag.dag_id.toLowerCase().includes(searchLower) ||
          (dag.description &&
            dag.description.toLowerCase().includes(searchLower)) ||
          dag.owners.some(owner => owner.toLowerCase().includes(searchLower)) ||
          dag.tags.some(tag => tag.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Paused filter
      if (filters.paused !== undefined && dag.is_paused !== filters.paused) {
        return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => dag.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Owners filter
      if (filters.owners && filters.owners.length > 0) {
        const hasMatchingOwner = filters.owners.some(owner =>
          dag.owners.includes(owner)
        );
        if (!hasMatchingOwner) return false;
      }

      // States filter
      if (filters.states && filters.states.length > 0) {
        if (
          !dag.last_run_state ||
          !filters.states.includes(dag.last_run_state)
        ) {
          return false;
        }
      }

      return true;
    });
  });

// Data freshness selector
export const selectDAGsDataAge = createSelector(
  [selectDAGsLastUpdated],
  lastUpdated => {
    if (!lastUpdated) return null;
    return Date.now() - lastUpdated;
  }
);

export const selectDAGsNeedRefresh = createSelector(
  [selectDAGsDataAge],
  dataAge => {
    if (dataAge === null) return true;
    // Consider data stale after 1 minute
    return dataAge > 60000;
  }
);
