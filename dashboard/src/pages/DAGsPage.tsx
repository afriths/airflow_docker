/**
 * DAGs List Page
 * Displays all DAGs with filtering and search capabilities
 */

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
} from '@mui/material';

const DAGsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        All DAGs
      </Typography>

      <Card>
        <CardContent>
          <Alert severity="info">
            DAG list component will be implemented in a future task.
            This page will show all DAGs with search, filtering, and trigger capabilities.
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DAGsPage;