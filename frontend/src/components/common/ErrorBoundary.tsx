'use client';

import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Refresh, ErrorOutline } from '@mui/icons-material';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
      }

      return (
        <Alert
          severity="error"
          sx={{ m: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={this.handleRetry}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          }
        >
          <Typography variant="h6" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body2">
            {this.state.error?.message || 'An unexpected error occurred while loading the dashboard.'}
          </Typography>
        </Alert>
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
}

export const DashboardErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  retry,
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      p: 4,
      minHeight: 200,
    }}
  >
    <ErrorOutline sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
    <Typography variant="h6" color="error" gutterBottom>
      Dashboard Error
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
      {error.message || 'Failed to load dashboard data'}
    </Typography>
    <Button
      variant="contained"
      onClick={retry}
      startIcon={<Refresh />}
    >
      Try Again
    </Button>
  </Box>
);