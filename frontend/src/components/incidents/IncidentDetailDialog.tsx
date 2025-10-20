'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Schedule,
} from '@mui/icons-material';
import { AgentWorkDisplay } from './AgentWorkDisplay';
import type { Incident } from '@/types';
import { INCIDENT_STATUS_CONFIG, INCIDENT_PRIORITY_CONFIG } from '@/constants';

interface IncidentDetailDialogProps {
  incident: Incident | null;
  open: boolean;
  onClose: () => void;
}

const getPriorityIcon = (priority: Incident['priority']) => {
  switch (priority) {
    case 'CRITICAL':
      return <Error color="error" />;
    case 'HIGH':
      return <Warning color="warning" />;
    case 'MEDIUM':
      return <Schedule color="info" />;
    default:
      return <CheckCircle color="success" />;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatDuration = (duration?: number) => {
  if (!duration) return 'N/A';

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const IncidentDetailDialog: React.FC<IncidentDetailDialogProps> = ({
  incident,
  open,
  onClose,
}) => {
  const [isTriggering, setIsTriggering] = useState(false);
  if (!incident) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {getPriorityIcon(incident.priority)}
          </Avatar>
          <Box>
            <Typography variant="h6">{incident.incidentId}</Typography>
            <Typography variant="body2" color="text.secondary">
              {incident.title}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Basic Information */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Incident Details
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Chip
                  label={INCIDENT_STATUS_CONFIG[incident.status].label}
                  color={INCIDENT_STATUS_CONFIG[incident.status].color as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                  size="small"
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Priority:
                </Typography>
                <Chip
                  label={INCIDENT_PRIORITY_CONFIG[incident.priority].label}
                  variant="outlined"
                  color={INCIDENT_PRIORITY_CONFIG[incident.priority].color as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Source: {incident.source}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Duration: {formatDuration(incident.duration)}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Created: {formatDate(incident.createdAt)}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Updated: {formatDate(incident.updatedAt)}
              </Typography>
            </Box>
          </Paper>

          {/* Description */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body2">
              {incident.description || 'No description available.'}
            </Typography>
          </Paper>

          {/* Tags */}
          {incident.tags.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {incident.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Paper>
          )}

          {/* Real AI Agent Work */}
          <Paper sx={{ p: 3 }}>
            <AgentWorkDisplay 
              incident={incident} 
              onRefresh={() => {
                // Optionally trigger a refresh of the incident data
                console.log('Refreshing agent data...');
              }}
            />
          </Paper>

          {/* Actions */}
          {incident.actions.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Actions Taken
              </Typography>

              <List>
                {incident.actions.map((action) => (
                  <React.Fragment key={action.id}>
                    <ListItem>
                      <ListItemText
                        primary={action.description}
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Type: {action.type} | Status: {action.status}
                            </Typography>
                            {action.executedAt && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                Executed: {formatDate(action.executedAt)}
                              </Typography>
                            )}
                            {action.result && (
                              <Typography variant="caption" display="block" color="success.main">
                                Result: {action.result}
                              </Typography>
                            )}
                            {action.error && (
                              <Typography variant="caption" display="block" color="error.main">
                                Error: {action.error}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}

          {/* Metrics */}
          {incident.metrics && Object.keys(incident.metrics).length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                System Metrics
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {Object.entries(incident.metrics).map(([key, value]) => (
                  <Typography key={key} variant="body2">
                    <strong>{key}:</strong> {String(value)}
                  </Typography>
                ))}
              </Box>
            </Paper>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {(incident.status === 'OPEN' || incident.status === 'INVESTIGATING') && (
          <Button 
            variant="contained" 
            color="primary"
            disabled={isTriggering}
            startIcon={isTriggering ? <CircularProgress size={16} /> : null}
            onClick={async () => {
              setIsTriggering(true);
              try {
                console.log('Triggering agent analysis for incident:', incident.incidentId || incident.id);
                
                // Trigger real agent analysis
                const { incidentService } = await import('@/services/apiService');
                const result = await incidentService.triggerAgentAnalysis(incident.incidentId || incident.id);
                
                console.log('Agent analysis triggered successfully:', result);
                
                // Show success message
                alert('AI Agent analysis refreshed successfully! The page will reload to show the latest results.');
                
                // Refresh the dialog data
                window.location.reload();
              } catch (error) {
                console.error('Failed to trigger agent analysis:', error);
                
                // Show error message to user
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                alert(`Failed to refresh AI Agent analysis: ${errorMessage}\n\nNote: The agent automatically processes incidents when they are created. This button refreshes the latest analysis results.`);
              } finally {
                setIsTriggering(false);
              }
            }}
          >
            {isTriggering ? 'Refreshing...' : '🤖 Refresh AI Analysis'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};