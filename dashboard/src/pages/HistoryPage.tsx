/**
 * Run History Page
 * Shows DAG run history across all DAGs
 */

import React from 'react';
import { Box, Typography, Card, CardContent, Alert } from '@mui/material';

const HistoryPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Run History
      </Typography>

      <Card>
        <CardContent>
          <Alert severity="info">
            Run history component will be implemented in a future task. This
            page will show DAG run history with filtering and pagination.
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HistoryPage;
