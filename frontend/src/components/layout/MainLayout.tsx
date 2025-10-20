'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Drawer,
  useMediaQuery,
  useTheme,
  IconButton,
  Typography,
  Badge,
  Button,
} from '@mui/material';
import { Menu as MenuIcon, Notifications, Settings } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { NotificationCenter } from './NotificationCenter';
import { SystemCheckDialog } from '@/components/setup/SystemCheckDialog';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';

const DRAWER_WIDTH = 280;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { user, isAuthenticated, notifications } = useAppStore();
  const router = useRouter();
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Auto-authenticate if not already authenticated
  useEffect(() => {
    if (!isAuthenticated && !user) {
      const defaultUser = {
        id: '1',
        name: 'ResiliBot User',
        email: 'user@resilibot.com',
        role: 'Admin',
        avatar: null,
      };
      
      useAppStore.getState().setUser(defaultUser);
      useAppStore.getState().setAuthenticated(true);
    }
  }, [isAuthenticated, user, router]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNotificationsToggle = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  const handleSettingsToggle = () => {
    setSettingsOpen(!settingsOpen);
  };

  const drawer = (
    <Sidebar
      onNavigate={() => isMobile && setMobileOpen(false)}
      isMobile={isMobile}
    />
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          zIndex: theme.zIndex.drawer + 1,
        }}
        elevation={0}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Box
              component="img"
              src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg"
              alt="AWS"
              sx={{
                height: 28,
                width: 'auto',
                display: { xs: 'none', sm: 'block' }
              }}
            />
            <Typography variant="h6" noWrap component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Built for AWS AI Agent Hackathon 2025
            </Typography>
          </Box>

          <Button
            variant="contained"
            href="https://github.com/HosniBelfeki/ResiliBot"
            target="_blank"
            rel="noopener noreferrer"
            startIcon={
              <img 
                src="https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png" 
                alt="GitHub" 
                style={{ width: 20, height: 20, filter: 'invert(1)', borderRadius: '50%' }}
              />
            }
            sx={{
              mr: 2,
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.25)',
              },
              textTransform: 'none',
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            GitHub
          </Button>

          <IconButton
            color="inherit"
            onClick={handleNotificationsToggle}
            sx={{ mr: 1 }}
          >
            <Badge 
              badgeContent={unreadCount} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                },
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                    opacity: 0.8,
                  },
                  '100%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                },
              }}
            >
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton
            color="inherit"
            onClick={handleSettingsToggle}
            sx={{ mr: 1 }}
          >
            <Settings />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="navigation menu"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px', // AppBar height
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </Box>

      {/* Notification Center */}
      <NotificationCenter
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      {/* System Check Dialog */}
      <SystemCheckDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </Box>
  );
};