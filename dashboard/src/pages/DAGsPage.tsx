/**
 * DAGs List Page
 * Displays all DAGs with filtering and search capabilities
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { DAGList } from '../components';

const DAGsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleDAGSelect = (dagId: string) => {
    navigate(`/dags/${dagId}`);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        All DAGs
      </Typography>

      <DAGList onDAGSelect={handleDAGSelect} />
    </Box>
  );
};

export default DAGsPage;
