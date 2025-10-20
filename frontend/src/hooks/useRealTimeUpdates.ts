import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';

export const useRealTimeUpdates = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useAppStore();

  useEffect(() => {
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      // Invalidate and refetch incidents data
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, [queryClient]);

  // Simulate real-time notifications for demo
  useEffect(() => {
    const notificationInterval = setInterval(() => {
      // Randomly add notifications for demo purposes
      if (Math.random() > 0.95) { // 5% chance every 30 seconds
        const notifications = [
          {
            title: 'New Incident Detected',
            message: 'High CPU usage detected on production server',
            type: 'warning' as const,
            read: false,
          },
          {
            title: 'Incident Resolved',
            message: 'Database connection issue has been resolved',
            type: 'success' as const,
            read: false,
          },
          {
            title: 'Approval Required',
            message: 'New incident requires your approval for processing',
            type: 'info' as const,
            read: false,
          },
        ];

        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
        addNotification(randomNotification);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(notificationInterval);
  }, [addNotification]);
};