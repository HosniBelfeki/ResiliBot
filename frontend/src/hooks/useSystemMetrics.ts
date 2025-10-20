import { useQuery } from '@tanstack/react-query';
import type { SystemMetrics } from '@/types';
import { metricsService } from '@/services/apiService';

// Real API service calls - only return real data from API
const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
  try {
    return await metricsService.getSystemMetrics();
  } catch (error) {
    console.error('Failed to fetch system metrics:', error);
    throw new Error('Unable to fetch system metrics from API');
  }
};

export const useSystemMetrics = () => {
  return useQuery({
    queryKey: ['system-metrics'],
    queryFn: fetchSystemMetrics,
    refetchInterval: 15000, // Refetch every 15 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });
};