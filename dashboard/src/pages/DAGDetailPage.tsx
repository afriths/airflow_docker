/**
 * DAG Detail Page
 * Shows detailed information about a specific DAG
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
} from '@mui/material';

const DAGDetailPage: React.FC = () => {
  const { dagId } = useParams<{ dagId: string }>();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        DAG: {dagId}
      </Typography>

      <Card>
        <CardContent>
          <Alert severity="info">
            DAG detail view will be implemented in future tasks.
            This page will show task status, run history, and trigger capabilities for {dagId}.
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DAGDetailPage;