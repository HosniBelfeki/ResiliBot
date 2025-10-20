'use client';

import React from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import { Wifi, WifiOff } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { healthService } from '@/services/apiService';

interface ConnectionStatusProps {
  showDetails?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showDetails = false,
}) => {
  const { data: health, isLoading, error, refetch } = useQuery({
    queryKey: ['health'],
    queryFn: healthService.checkHealth,
    refetchInterval: 30000, // Check every 30 seconds
    retry: 2,
    retryDelay: 5000,
  });

  const isConnected = health?.status === 'healthy';
  const isApiError = error && !isLoading;

  if (isLoading && !showDetails) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={
        isConnected
          ? `Connected to ResiliBot API (${health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'Active'})`
          : isApiError
          ? 'Unable to connect to ResiliBot API - check your connection'
          : 'Checking connection...'
      }>
        <Chip
          icon={isConnected ? <Wifi /> : <WifiOff />}
          label={
            showDetails
              ? (isConnected ? 'API Connected' : 'API Error')
              : isConnected ? 'Live' : 'Error'
          }
          color={isConnected ? 'success' : 'error'}
          variant={isConnected ? 'filled' : 'outlined'}
          size="small"
          onClick={() => refetch()}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8,
            },
          }}
        />
      </Tooltip>

      {showDetails && isApiError && (
        <Typography variant="caption" color="text.secondary">
          Using demo data - API unavailable
        </Typography>
      )}
    </Box>
  );
};