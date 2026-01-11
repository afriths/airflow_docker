import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider, ProtectedRoute, ErrorBoundary, NotificationList } from './components';
import { AppRouter } from './router';
import './App.css';

// Create responsive Material-UI theme with accessibility enhancements
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2.125rem',
      fontWeight: 600,
      lineHeight: 1.2,
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  components: {
    // Global CSS baseline for accessibility
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          height: '100%',
          width: '100%',
        },
        body: {
          height: '100%',
          width: '100%',
          margin: 0,
          padding: 0,
        },
        '#root': {
          height: '100%',
          width: '100%',
        },
        // Focus styles for accessibility
        '*:focus-visible': {
          outline: '2px solid #1976d2',
          outlineOffset: '2px',
        },
        // High contrast mode support
        '@media (prefers-contrast: high)': {
          '*': {
            borderColor: 'ButtonText !important',
          },
        },
        // Reduced motion support
        '@media (prefers-reduced-motion: reduce)': {
          '*': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
          },
        },
      },
    },
    // Enhanced Drawer component
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#fafafa',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        },
      },
    },
    // Enhanced AppBar component
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          '@media (max-width:600px)': {
            paddingLeft: 0,
            paddingRight: 0,
          },
        },
      },
    },
    // Enhanced Button component for accessibility
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44, // Minimum touch target size
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          '&:focus-visible': {
            outline: '2px solid currentColor',
            outlineOffset: '2px',
          },
        },
        sizeSmall: {
          minHeight: 36,
          padding: '6px 16px',
        },
        sizeLarge: {
          minHeight: 48,
          padding: '12px 24px',
        },
      },
    },
    // Enhanced IconButton for touch targets
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          '&:focus-visible': {
            outline: '2px solid currentColor',
            outlineOffset: '2px',
          },
        },
        sizeSmall: {
          minWidth: 36,
          minHeight: 36,
        },
        sizeLarge: {
          minWidth: 48,
          minHeight: 48,
        },
      },
    },
    // Enhanced TextField for accessibility
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            '&.Mui-focused': {
              fontWeight: 600,
            },
          },
          '& .MuiOutlinedInput-root': {
            '&:focus-within': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
            },
          },
        },
      },
    },
    // Enhanced Card component
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          '&:hover': {
            boxShadow: '0 4px 6px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
          },
        },
      },
    },
    // Enhanced List components for keyboard navigation
    MuiListItemButton: {
      styleOverrides: {
        root: {
          minHeight: 48,
          borderRadius: 8,
          '&:focus-visible': {
            outline: '2px solid currentColor',
            outlineOffset: '2px',
          },
          '&.Mui-selected': {
            '&:focus-visible': {
              outline: '2px solid #ffffff',
              outlineOffset: '2px',
            },
          },
        },
      },
    },
    // Enhanced Chip component
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          '&:focus-visible': {
            outline: '2px solid currentColor',
            outlineOffset: '2px',
          },
        },
      },
    },
    // Enhanced Pagination for accessibility
    MuiPagination: {
      styleOverrides: {
        root: {
          '& .MuiPaginationItem-root': {
            minWidth: 44,
            minHeight: 44,
            '&:focus-visible': {
              outline: '2px solid currentColor',
              outlineOffset: '2px',
            },
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <ProtectedRoute>
            <AppRouter />
            <NotificationList />
          </ProtectedRoute>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
