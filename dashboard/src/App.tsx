import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, AppBar, Toolbar, Typography } from '@mui/material';
import { AuthProvider, ProtectedRoute, LogoutButton } from './components';
import { useAuth } from './hooks';
import './App.css';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Main dashboard content (protected)
const DashboardContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Airflow Dashboard
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.username}
          </Typography>
          <LogoutButton variant="icon" />
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to Airflow Dashboard
        </Typography>

        <Typography variant="body1" paragraph>
          You are successfully authenticated and can now access the dashboard
          features.
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Authentication System Status:
          </Typography>
          <ul>
            <li>✅ Login component with form validation</li>
            <li>✅ Authentication service with token storage</li>
            <li>✅ Protected route wrapper component</li>
            <li>✅ Automatic token refresh logic</li>
            <li>✅ Logout functionality</li>
            <li>✅ Authentication hooks</li>
            <li>✅ Multi-tab session synchronization</li>
          </ul>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            User Information:
          </Typography>
          <ul>
            <li>Username: {user?.username}</li>
            <li>Roles: {user?.roles?.join(', ') || 'None'}</li>
            <li>Email: {user?.email || 'Not provided'}</li>
          </ul>
        </Box>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ProtectedRoute>
          <DashboardContent />
        </ProtectedRoute>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
