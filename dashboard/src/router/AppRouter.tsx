/**
 * Application Router
 * Defines all routes and navigation structure
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components';
import {
  DashboardPage,
  DAGsPage,
  DAGDetailPage,
  HistoryPage,
} from '../pages';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main dashboard routes */}
        <Route
          path="/"
          element={
            <DashboardLayout title="Dashboard">
              <DashboardPage />
            </DashboardLayout>
          }
        />
        
        <Route
          path="/dags"
          element={
            <DashboardLayout title="All DAGs">
              <DAGsPage />
            </DashboardLayout>
          }
        />
        
        <Route
          path="/dags/:dagId"
          element={
            <DashboardLayout title="DAG Details">
              <DAGDetailPage />
            </DashboardLayout>
          }
        />
        
        <Route
          path="/history"
          element={
            <DashboardLayout title="Run History">
              <HistoryPage />
            </DashboardLayout>
          }
        />

        {/* Redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;