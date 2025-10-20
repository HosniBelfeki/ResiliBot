'use client';

import React from 'react';
import {
  Typography,
  Box,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Chip,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import type { Alert } from '@/types';

interface AlertsPanelProps {
  alerts?: Alert[];
  loading?: boolean;
}

const getAlertIcon = (severity: Alert['severity']) => {
  switch (severity) {
    case 'CRITICAL':
    case 'ERROR':
      return <Error color="error" />;
    case 'WARNING':
      return <Warning color="warning" />;
    case 'INFO':
      return <Info color="info" />;
    default:
      return <CheckCircle color="success" />;
  }
};

const getSeverityColor = (severity: Alert['severity']) => {
  switch (severity) {
    case 'CRITICAL':
    case 'ERROR':
      return 'error';
    case 'WARNING':
      return 'warning';
    case 'INFO':
      return 'info';
    default:
      return 'success';
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts = [],
  loading = false,
}) => {
  // Use real alerts from API
  const displayAlerts = alerts || [];

  const unacknowledgedCount = displayAlerts.filter(alert => !alert.acknowledged).length;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h6">
          Active Alerts
        </Typography>

        {unacknowledgedCount > 0 && !loading && (
          <Chip
            label={`${unacknowledgedCount} unacknowledged`}
            color="error"
            size="small"
          />
        )}
      </Box>

      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {loading ? (
          <List>
            {Array.from({ length: 3 }).map((_, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton width={200} />}
                  secondary={<Skeleton width={150} />}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <List sx={{ py: 0 }}>
            <AnimatePresence>
              {displayAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <ListItem
                    sx={{
                      px: 0,
                      mb: 1,
                      borderRadius: 2,
                      bgcolor: alert.acknowledged ? 'transparent' : 'action.hover',
                      border: alert.acknowledged ? 'none' : '1px solid',
                      borderColor: 'primary.light',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: `${getSeverityColor(alert.severity)}.light`,
                          color: `${getSeverityColor(alert.severity)}.main`,
                        }}
                      >
                        {getAlertIcon(alert.severity)}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={alert.acknowledged ? 'normal' : 'bold'}>
                            {alert.title}
                          </Typography>
                          {!alert.acknowledged && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                animation: 'status-pulse 2s infinite',
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <React.Fragment>
                          <Box component="span" sx={{ display: 'block', mb: 0.5, fontSize: '0.875rem' }}>
                            {alert.message}
                          </Box>
                          <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary' }}>
                            {alert.source} • {formatTimestamp(alert.createdAt)}
                            {alert.acknowledged && (
                              <Box component="span" sx={{ ml: 1, color: 'success.main' }}>
                                ✓ Acknowledged
                              </Box>
                            )}
                          </Box>
                        </React.Fragment>
                      }
                      secondaryTypographyProps={{
                        component: 'div'
                      }}
                    />

                    {!alert.acknowledged && (
                      <IconButton size="small" color="primary">
                        <CheckCircle />
                      </IconButton>
                    )}
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        )}
      </Box>

      {displayAlerts.length === 0 && !loading && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 6,
            color: 'text.secondary',
          }}
        >
          <CheckCircle sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="body2">
            No active alerts
          </Typography>
        </Box>
      )}
    </Box>
  );
};