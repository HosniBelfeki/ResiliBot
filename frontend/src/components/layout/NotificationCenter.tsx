'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  Button,
  Badge,
} from '@mui/material';
import {
  Close,
  Notifications,
  CheckCircle,
  Error,
  Warning,
  Info,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import type { Notification } from '@/types';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'SUCCESS':
      return <CheckCircle color="success" />;
    case 'ERROR':
      return <Error color="error" />;
    case 'WARNING':
      return <Warning color="warning" />;
    default:
      return <Info color="info" />;
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

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  open,
  onClose,
}) => {
  const { notifications, markNotificationAsRead, clearNotifications } = useAppStore();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      sx={{
        '& .MuiDrawer-paper': {
          width: 400,
          maxWidth: '90vw',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications />
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error" />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={() => {
                  notifications.forEach(n => {
                    if (!n.read) markNotificationAsRead(n.id);
                  });
                }}
              >
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                size="small"
                onClick={clearNotifications}
                color="inherit"
              >
                Clear all
              </Button>
            )}
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        {/* Notifications List */}
        <Box sx={{ mt: 2, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
          <AnimatePresence>
            {notifications.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 8,
                  color: 'text.secondary',
                }}
              >
                <Notifications sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="body2">
                  No notifications yet
                </Typography>
              </Box>
            ) : (
              <List>
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ListItem
                      component="div"
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        bgcolor: notification.read ? 'transparent' : 'action.hover',
                        borderRadius: 2,
                        mb: 1,
                        cursor: notification.actionUrl ? 'pointer' : 'default',
                        '&:hover': {
                          bgcolor: notification.read ? 'action.hover' : 'primary.light',
                          opacity: 0.9,
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: notification.read ? 'transparent' : 'primary.main',
                            color: notification.read ? 'text.secondary' : 'primary.contrastText',
                          }}
                        >
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={notification.read ? 'normal' : 'bold'}>
                              {notification.title}
                            </Typography>
                            {!notification.read && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <React.Fragment>
                            <Box component="span" sx={{ display: 'block', mb: 0.5, fontSize: '0.875rem' }}>
                              {notification.message}
                            </Box>
                            <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary' }}>
                              {formatTimestamp(notification.createdAt)}
                            </Box>
                          </React.Fragment>
                        }
                        secondaryTypographyProps={{
                          component: 'div'
                        }}
                      />
                    </ListItem>
                  </motion.div>
                ))}
              </List>
            )}
          </AnimatePresence>
        </Box>
      </Box>
    </Drawer>
  );
};