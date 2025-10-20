import { useQuery } from '@tanstack/react-query';
import type { Alert } from '@/types';
import { alertService } from '@/services/apiService';

// Real API service calls - only return real data from API
const fetchAlerts = async (): Promise<Alert[]> => {
  try {
    return await alertService.getAlerts();
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    throw new Error('Unable to fetch alerts from API');
  }
};

export const useAlerts = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    refetchInterval: 20000, // Refetch every 20 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });
};

export const useAlert = (id: string) => {
  return useQuery({
    queryKey: ['alert', id],
    queryFn: async (): Promise<Alert | null> => {
      const alerts = await fetchAlerts();
      return alerts.find(alert => alert.id === id) || null;
    },
    enabled: !!id,
  });
};