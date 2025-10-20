"use client";

import React from "react";
import { Container, Paper, Typography, Box } from "@mui/material";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { SystemHealthChart } from "@/components/dashboard/SystemHealthChart";
import { IncidentsList } from "@/components/dashboard/IncidentsList";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { ConnectionStatus } from "@/components/common/ConnectionStatus";
import {
  ErrorBoundary,
  DashboardErrorFallback,
} from "@/components/common/ErrorBoundary";
import { IncidentDetailDialog } from "@/components/incidents/IncidentDetailDialog";
import { useIncidents } from "@/hooks/useIncidents";
import { useSystemMetrics } from "@/hooks/useSystemMetrics";
import { useAlerts } from "@/hooks/useAlerts";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import type { Incident } from "@/types";

export default function DashboardPage() {
  const [selectedIncident, setSelectedIncident] =
    React.useState<Incident | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);

  // Enable real-time updates
  useRealTimeUpdates();

  const {
    data: incidents,
    isLoading: incidentsLoading,
    error: incidentsError,
  } = useIncidents();
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useSystemMetrics();
  const {
    data: alerts,
    isLoading: alertsLoading,
    error: alertsError,
  } = useAlerts();

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedIncident(null);
  };

  return (
    <MainLayout>
      <ErrorBoundary fallback={DashboardErrorFallback}>
        <Container maxWidth="xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 3,
                }}
              >
                <Box sx={{ flex: 1, maxWidth: "800px" }}>
                  <Typography
                    variant="h4"
                    component="h1"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    ResiliBot AI Dashboard
                  </Typography>
                  <Typography
                    variant="h6"
                    color="primary"
                    gutterBottom
                    sx={{ fontWeight: "medium" }}
                  >
                    Autonomous Incident Response Agent
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 2, lineHeight: 1.6 }}
                  >
                    Powered by{" "}
                    <strong>Amazon Bedrock with Claude 3 Sonnet</strong>,
                    ResiliBot autonomously detects, diagnoses, and resolves
                    infrastructure incidents using advanced AI reasoning. Our
                    intelligent agent reduces Mean Time to Resolution (MTTR) by
                    up to 96% through the Observe-Reason-Plan-Act (ORPA)
                    pattern.
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 3,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "success.main",
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        <strong>AI-Powered:</strong> Claude 3 Sonnet LLM
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "info.main",
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Safe:</strong> Human-in-the-loop controls
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "warning.main",
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Fast:</strong> 35s avg resolution time
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <ConnectionStatus showDetails={true} />
              </Box>
            </Box>
          </motion.div>

          {/* Metrics Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Paper sx={{ p: 3, mb: 4 }}>
              {metricsError ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="error">
                    Unable to load system metrics. Showing default values.
                  </Typography>
                </Box>
              ) : (
                <MetricsCards metrics={metrics} loading={metricsLoading} />
              )}
            </Paper>
          </motion.div>

          {/* Main Content Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
              gap: 3,
              mb: 3,
            }}
          >
            {/* System Health Chart - Takes up 2/3 of the width */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Paper sx={{ p: 3, height: "100%" }}>
                {metricsError ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body2" color="error">
                      Unable to load health chart data.
                    </Typography>
                  </Box>
                ) : (
                  <SystemHealthChart
                    data={metrics?.healthHistory || []}
                    loading={metricsLoading}
                  />
                )}
              </Paper>
            </motion.div>

            {/* Alerts Panel - Takes up 1/3 of the width */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Paper sx={{ p: 3, height: "100%" }}>
                {alertsError ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body2" color="error">
                      Unable to load alerts data.
                    </Typography>
                  </Box>
                ) : (
                  <AlertsPanel alerts={alerts} loading={alertsLoading} />
                )}
              </Paper>
            </motion.div>
          </Box>

          {/* Incidents List - Full width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Paper sx={{ p: 3 }}>
              {incidentsError ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="error">
                    Unable to load incidents data. Please check your connection.
                  </Typography>
                </Box>
              ) : (
                <IncidentsList
                  incidents={incidents}
                  loading={incidentsLoading}
                  onIncidentClick={handleIncidentClick}
                />
              )}
            </Paper>
          </motion.div>
        </Container>
      </ErrorBoundary>

      {/* Incident Detail Dialog */}
      <IncidentDetailDialog
        incident={selectedIncident}
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
      />
    </MainLayout>
  );
}
