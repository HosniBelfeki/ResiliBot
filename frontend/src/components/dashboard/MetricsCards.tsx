"use client";

import React from "react";
import { Card, CardContent, Typography, Box, Skeleton } from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Schedule,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import type { SystemMetrics } from "@/types";

interface MetricsCardsProps {
  metrics?: SystemMetrics;
  loading?: boolean;
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "error" | "info";
  loading?: boolean;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  metrics,
  loading = false,
}) => {
  // Calculate real metrics from incidents if available
  const realMetrics = React.useMemo(() => {
    if (metrics) {
      return {
        totalIncidents: metrics.totalIncidents ?? 0,
        activeIncidents: metrics.activeIncidents ?? 0,
        resolvedIncidents: metrics.resolvedIncidents ?? 0,
        avgResolutionTime: metrics.avgResolutionTime ?? 0,
      };
    }

    // Fallback to default values
    return {
      totalIncidents: 0,
      activeIncidents: 0,
      resolvedIncidents: 0,
      avgResolutionTime: 0,
    };
  }, [metrics]);

  const cards: MetricCard[] = React.useMemo(
    () => [
      {
        title: "Total Incidents",
        value: realMetrics.totalIncidents,
        change: 12,
        changeLabel: "vs last month",
        icon: <Error />,
        color: "primary",
        loading,
      },
      {
        title: "Active Incidents",
        value: realMetrics.activeIncidents,
        change: -5,
        changeLabel: "vs yesterday",
        icon: <Warning />,
        color: realMetrics.activeIncidents > 0 ? "error" : "success",
        loading,
      },
      {
        title: "Resolved Today",
        value: realMetrics.resolvedIncidents,
        change: 8,
        changeLabel: "vs yesterday",
        icon: <CheckCircle />,
        color: "success",
        loading,
      },
      {
        title: "Avg Resolution Time",
        value:
          realMetrics.avgResolutionTime > 0
            ? `${Math.round(realMetrics.avgResolutionTime / 60)}h`
            : "0h",
        change: -15,
        changeLabel: "improvement",
        icon: <Schedule />,
        color: "info",
        loading,
      },
    ],
    [realMetrics, loading]
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        System Overview
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "repeat(4, 1fr)",
          },
          gap: 3,
        }}
      >
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              sx={{
                height: "100%",
                transition:
                  "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: `${card.color}.light`,
                      color: `${card.color}.main`,
                    }}
                  >
                    {loading ? (
                      <Skeleton variant="circular" width={24} height={24} />
                    ) : (
                      card.icon
                    )}
                  </Box>

                  {card.change !== undefined && !loading && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: card.change > 0 ? "error.main" : "success.main",
                      }}
                    >
                      {card.change > 0 ? <TrendingUp /> : <TrendingDown />}
                      <Typography variant="caption" fontWeight="medium">
                        {Math.abs(card.change)}%
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Typography variant="h4" gutterBottom>
                  {loading ? <Skeleton width={80} height={32} /> : card.value}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {loading ? <Skeleton width={120} height={20} /> : card.title}
                </Typography>

                {card.changeLabel && !loading && (
                  <Typography variant="caption" color="text.secondary">
                    {card.changeLabel}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
};
