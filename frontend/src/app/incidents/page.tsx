'use client';

import React, { useState } from 'react';
import { Container, Typography, Box, Paper, Button, Fab } from '@mui/material';
import { Add, Refresh } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { ConnectionStatus } from '@/components/common/ConnectionStatus';
import { ErrorBoundary, DashboardErrorFallback } from '@/components/common/ErrorBoundary';
import { IncidentsList } from '@/components/dashboard/IncidentsList';
import { CreateIncidentDialog } from '@/components/incidents/CreateIncidentDialog';
import { ApprovalDialog } from '@/components/incidents/ApprovalDialog';
import { IncidentDetailDialog } from '@/components/incidents/IncidentDetailDialog';
import { useIncidents } from '@/hooks/useIncidents';
import type { Incident } from '@/types';

export default function IncidentsPage() {
  const { data: incidents, isLoading, refetch } = useIncidents();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    
    // Check if incident needs approval
    const requiresApproval = 'requiresApproval' in incident ? (incident as Record<string, unknown>).requiresApproval : false;
    if (incident.status === 'PENDING_APPROVAL' || requiresApproval) {
      setApprovalDialogOpen(true);
    } else {
      setDetailDialogOpen(true);
    }
  };

  const handleCreateSuccess = () => {
    refetch();
  };

  const handleApprovalSuccess = () => {
    refetch();
  };

  const pendingApprovalIncidents = incidents?.filter(
    incident => {
      const requiresApproval = 'requiresApproval' in incident ? (incident as Record<string, unknown>).requiresApproval : false;
      return incident.status === 'PENDING_APPROVAL' || requiresApproval;
    }
  ) || [];

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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom>
                    Incidents Management
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Monitor and manage all incidents across your infrastructure
                  </Typography>
                  {pendingApprovalIncidents.length > 0 && (
                    <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                      ⚠️ {pendingApprovalIncidents.length} incident(s) pending approval
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <ConnectionStatus showDetails={true} />
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => refetch()}
                    disabled={isLoading}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    Create Incident
                  </Button>
                </Box>
              </Box>
            </Box>
          </motion.div>

          {/* Incidents List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Paper sx={{ p: 3 }}>
              <IncidentsList
                incidents={incidents}
                loading={isLoading}
                onIncidentClick={handleIncidentClick}
              />
            </Paper>
          </motion.div>

          {/* Floating Action Button for Mobile */}
          <Fab
            color="primary"
            aria-label="create incident"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              display: { xs: 'flex', md: 'none' },
            }}
            onClick={() => setCreateDialogOpen(true)}
          >
            <Add />
          </Fab>
        </Container>

        {/* Dialogs */}
        <CreateIncidentDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={handleCreateSuccess}
        />

        <ApprovalDialog
          open={approvalDialogOpen}
          incident={selectedIncident}
          onClose={() => {
            setApprovalDialogOpen(false);
            setSelectedIncident(null);
          }}
          onSuccess={handleApprovalSuccess}
        />

        <IncidentDetailDialog
          incident={selectedIncident}
          open={detailDialogOpen}
          onClose={() => {
            setDetailDialogOpen(false);
            setSelectedIncident(null);
          }}
        />
      </ErrorBoundary>
    </MainLayout>
  );
}