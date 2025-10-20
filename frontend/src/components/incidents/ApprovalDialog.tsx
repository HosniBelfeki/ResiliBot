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
  TextField,
  Alert,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Warning,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { incidentService } from '@/services/apiService';
import { useAppStore } from '@/store/useAppStore';
import type { Incident } from '@/types';

interface ApprovalDialogProps {
  open: boolean;
  incident: Incident | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  open,
  incident,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, addNotification } = useAppStore();

  const handleApprove = async () => {
    if (!incident) return;

    setLoading(true);
    setError('');

    try {
      await incidentService.approveIncident(incident.incidentId, user?.name || 'Unknown User');

      addNotification({
        title: 'Incident Approved',
        message: `Incident ${incident.incidentId} has been approved for processing`,
        type: 'SUCCESS',
        read: false,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve incident');
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!incident) return;

    setLoading(true);
    setError('');

    try {
      await incidentService.denyIncident(
        incident.incidentId,
        user?.name || 'Unknown User',
        reason || 'No reason provided'
      );

      addNotification({
        title: 'Incident Denied',
        message: `Incident ${incident.incidentId} has been denied`,
        type: 'INFO',
        read: false,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deny incident');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  if (!incident) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.2 },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Incident Approval Required
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            This incident requires your approval before the AI agent can proceed with automated analysis and remediation.
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Incident Details
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={`ID: ${incident.incidentId}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={incident.severity}
              size="small"
              color={getSeverityColor(incident.severity) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
            />
            <Chip
              label={incident.priority}
              size="small"
              variant="outlined"
            />
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            {incident.title}
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            {incident.description}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {incident.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            What happens next?
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <CheckCircle color="success" />
            <Box>
              <Typography variant="subtitle2">If Approved:</Typography>
              <Typography variant="body2" color="text.secondary">
                The AI agent will analyze the incident, gather relevant metrics and logs, 
                determine root cause, and suggest remediation actions.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Cancel color="error" />
            <Box>
              <Typography variant="subtitle2">If Denied:</Typography>
              <Typography variant="body2" color="text.secondary">
                The incident will be marked as denied and no automated processing will occur. 
                Manual investigation may be required.
              </Typography>
            </Box>
          </Box>
        </Box>

        <TextField
          fullWidth
          label="Reason (optional for approval, recommended for denial)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={3}
          placeholder="Provide a reason for your decision..."
          margin="normal"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleDeny}
          disabled={loading}
          color="error"
          startIcon={<Cancel />}
        >
          {loading ? 'Processing...' : 'Deny'}
        </Button>
        <Button
          onClick={handleApprove}
          disabled={loading}
          variant="contained"
          color="success"
          startIcon={<CheckCircle />}
        >
          {loading ? 'Processing...' : 'Approve'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};