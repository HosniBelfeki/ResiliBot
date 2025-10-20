"use client";

import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Badge,
  useTheme,
} from "@mui/material";
import { Dashboard, BugReport } from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useIncidents } from "@/hooks/useIncidents";
import { ROUTES } from "@/constants";

interface SidebarProps {
  onNavigate?: () => void;
  isMobile?: boolean;
}

const getNavigationItems = (openIncidentsCount: number) => [
  {
    label: "Dashboard",
    icon: Dashboard,
    path: ROUTES.DASHBOARD,
    badge: null,
  },
  {
    label: "Incidents",
    icon: BugReport,
    path: ROUTES.INCIDENTS,
    badge: openIncidentsCount > 0 ? String(openIncidentsCount) : null,
  },
];

const bottomNavigationItems: Array<{
  label: string;
  icon: typeof Dashboard;
  path: string;
  badge: string | null;
}> = [
  // Removed settings and profile since they're not needed
];

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { data: incidents } = useIncidents();

  // Count open incidents
  const openIncidentsCount =
    incidents?.filter(
      (incident) =>
        incident.status === "OPEN" || incident.status === "INVESTIGATING"
    ).length || 0;

  const handleNavigation = (path: string) => {
    router.push(path);
    onNavigate?.();
  };

  const navigationItems = getNavigationItems(openIncidentsCount);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `1px solid ${theme.palette.divider}`,
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
        onClick={() => handleNavigation(ROUTES.DASHBOARD)}
      >
        <Box
          component="img"
          src="/resilibot-logo.png"
          alt="ResiliBot"
          sx={{
            width: "100%",
            maxWidth: 200,
            height: "auto",
            objectFit: "contain",
          }}
        />
      </Box>

      {/* Navigation Items */}
      <List sx={{ flex: 1, pt: 1 }}>
        {navigationItems.map((item, index) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    bgcolor: isActive ? "primary.main" : "transparent",
                    color: isActive ? "primary.contrastText" : "text.primary",
                    "&:hover": {
                      bgcolor: isActive ? "primary.dark" : "action.hover",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                    <Badge badgeContent={item.badge} color="error">
                      <Icon />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? "bold" : "normal",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </motion.div>
          );
        })}
      </List>

      <Divider />

      {/* Bottom Navigation */}
      <List>
        {bottomNavigationItems.map((item, index) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (navigationItems.length + index) * 0.1 }}
            >
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    bgcolor: isActive ? "primary.main" : "transparent",
                    color: isActive ? "primary.contrastText" : "text.primary",
                    "&:hover": {
                      bgcolor: isActive ? "primary.dark" : "action.hover",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? "bold" : "normal",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </motion.div>
          );
        })}

        {/* Logout removed since auth is disabled */}
      </List>

      {/* Version Info */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          display="block"
        >
          ResiliBot v1.0.0
        </Typography>
      </Box>
    </Box>
  );
};
