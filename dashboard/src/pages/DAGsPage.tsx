/**
 * DAGs List Page
 * Displays all DAGs with filtering and search capabilities
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { DAGList, ErrorDisplay, DAGListSkeleton } from '../components';
import { useDAGsQuery } from '../hooks';
import { enhanceError } from '../services/errorHandler';

const DAGsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: dagCollection, isLoading, error, refetch } = useDAGsQuery();
  const dags = dagCollection?.dags || [];

  const handleDAGSelect = (dagId: string) => {
    navigate(`/dags/${dagId}`);
  };

  const handleRetry = () => {
    refetch();
  };

  // Show error state
  if (error && !isLoading) {
    // Create a proper APIError from the generic error
    const apiError = {
      message: error.message || 'Failed to load DAGs',
      status: 500,
      timestamp: Date.now(),
    };
    const enhancedError = enhanceError(apiError);
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          All DAGs
        </Typography>
        <ErrorDisplay
          error={enhancedError}
          onRetry={handleRetry}
          showDetails={true}
          variant="alert"
        />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        All DAGs
      </Typography>

      {isLoading ? (
        <DAGListSkeleton count={6} />
      ) : (
        <DAGList 
          dags={dags}
          onDAGSelect={handleDAGSelect}
          loading={isLoading}
          error={error}
          onRefresh={refetch}
        />
      )}
    </Box>
  );
};

export default DAGsPage;
