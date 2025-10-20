'use client';

import React, { useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Avatar,
  TableSortLabel,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Warning,
  Error,
  Schedule,
  Search,
  Clear,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { Incident } from '@/types';
import { INCIDENT_STATUS_CONFIG, INCIDENT_PRIORITY_CONFIG } from '@/constants';

interface IncidentsListProps {
  incidents?: Incident[];
  loading?: boolean;
  onIncidentClick?: (incident: Incident) => void;
}

type SortField = 'createdAt' | 'priority' | 'status' | 'title' | 'severity';
type SortOrder = 'asc' | 'desc';

const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
const statusOrder = { 'OPEN': 4, 'IN_PROGRESS': 3, 'INVESTIGATING': 2, 'RESOLVED': 1 };

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

const formatDuration = (duration?: number) => {
  if (!duration) return 'N/A';

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Removed unused formatDate function

export const IncidentsList: React.FC<IncidentsListProps> = ({
  incidents = [],
  loading = false,
  onIncidentClick,
}) => {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedAndFilteredIncidents = useMemo(() => {
    let filtered = [...incidents];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(incident => 
        incident.title.toLowerCase().includes(query) ||
        incident.description?.toLowerCase().includes(query) ||
        incident.incidentId.toLowerCase().includes(query) ||
        incident.source.toLowerCase().includes(query) ||
        incident.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter(incident => incident.status === statusFilter);
    }
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(incident => incident.priority === priorityFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'priority':
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'status':
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 0;
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'severity':
          aValue = a.severity || '';
          bValue = b.severity || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [incidents, sortField, sortOrder, statusFilter, priorityFilter, searchQuery]);

  const displayIncidents = sortedAndFilteredIncidents;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h6">
          All Incidents
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                    sx={{ p: 0.5 }}
                  >
                    <Clear sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="OPEN">Open</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="INVESTIGATING">Investigating</MenuItem>
              <MenuItem value="RESOLVED">Resolved</MenuItem>
            </Select>
          </FormControl>

          {/* Priority Filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              label="Priority"
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="all">All Priority</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            {loading ? (
              <Skeleton width={100} />
            ) : (
              `${displayIncidents.length} of ${incidents.length} incidents`
            )}
          </Typography>
        </Box>
      </Box>

      <TableContainer 
        sx={{ 
          border: '1px solid', 
          borderColor: 'divider', 
          borderRadius: 2,
          overflowX: 'auto',
          overflowY: 'auto',
          width: '100%',
          maxHeight: '70vh',
          position: 'relative'
        }}
      >
        <Table 
          sx={{ 
            minWidth: 1200,
            tableLayout: 'fixed',
            '& .MuiTableCell-root': {
              borderBottom: '1px solid',
              borderColor: 'divider'
            }
          }}
        >
          <TableHead>
            <TableRow 
              sx={{ 
                bgcolor: 'grey.50',
                '& .MuiTableCell-head': {
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'grey.50',
                  zIndex: 10,
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }
              }}
            >
              <TableCell 
                sx={{ 
                  fontWeight: 'bold', 
                  width: '25%',
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'grey.50',
                  zIndex: 10,
                  borderBottom: '2px solid',
                  borderColor: 'divider'
                }}
              >
                <TableSortLabel
                  active={sortField === 'title'}
                  direction={sortField === 'title' ? sortOrder : 'asc'}
                  onClick={() => handleSort('title')}
                >
                  Incident
                </TableSortLabel>
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold', 
                  width: '10%',
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'grey.50',
                  zIndex: 10,
                  borderBottom: '2px solid',
                  borderColor: 'divider'
                }}
              >
                <TableSortLabel
                  active={sortField === 'createdAt'}
                  direction={sortField === 'createdAt' ? sortOrder : 'asc'}
                  onClick={() => handleSort('createdAt')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold', 
                  width: '10%',
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'grey.50',
                  zIndex: 10,
                  borderBottom: '2px solid',
                  borderColor: 'divider'
                }}
              >
                <TableSortLabel
                  active={sortField === 'status'}
                  direction={sortField === 'status' ? sortOrder : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold', 
                  width: '10%',
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'grey.50',
                  zIndex: 10,
                  borderBottom: '2px solid',
                  borderColor: 'divider'
                }}
              >
                <TableSortLabel
                  active={sortField === 'priority'}
                  direction={sortField === 'priority' ? sortOrder : 'asc'}
                  onClick={() => handleSort('priority')}
                >
                  Priority
                </TableSortLabel>
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold', 
                  width: '12%',
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'grey.50',
                  zIndex: 10,
                  borderBottom: '2px solid',
                  borderColor: 'divider'
                }}
              >
                Source
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold', 
                  width: '8%',
                  textAlign: 'center',
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'grey.50',
                  zIndex: 10,
                  borderBottom: '2px solid',
                  borderColor: 'divider'
                }}
              >
                Duration
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold', 
                  width: '15%',
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'grey.50',
                  zIndex: 10,
                  borderBottom: '2px solid',
                  borderColor: 'divider'
                }}
              >
                Tags
              </TableCell>
              <TableCell 
                align="center" 
                sx={{ 
                  fontWeight: 'bold', 
                  width: '10%',
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'grey.50',
                  zIndex: 10,
                  borderBottom: '2px solid',
                  borderColor: 'divider'
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              // Loading skeleton rows
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ py: 2, width: '25%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Skeleton variant="circular" width={36} height={36} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="60%" height={16} sx={{ mb: 0.5 }} />
                        <Skeleton width="90%" height={14} />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2, width: '10%' }}>
                    <Skeleton width="80%" height={14} sx={{ mb: 0.5 }} />
                    <Skeleton width="60%" height={12} />
                  </TableCell>
                  <TableCell sx={{ py: 2, width: '10%' }}>
                    <Skeleton width="90%" height={24} sx={{ borderRadius: 3 }} />
                  </TableCell>
                  <TableCell sx={{ py: 2, width: '10%' }}>
                    <Skeleton width="80%" height={24} sx={{ borderRadius: 3 }} />
                  </TableCell>
                  <TableCell sx={{ py: 2, width: '12%' }}>
                    <Skeleton width="85%" height={14} />
                  </TableCell>
                  <TableCell sx={{ py: 2, width: '8%', textAlign: 'center' }}>
                    <Skeleton width="70%" height={14} sx={{ mx: 'auto' }} />
                  </TableCell>
                  <TableCell sx={{ py: 2, width: '15%' }}>
                    <Box sx={{ display: 'flex', gap: 0.25 }}>
                      <Skeleton width={40} height={20} sx={{ borderRadius: 3 }} />
                      <Skeleton width={35} height={20} sx={{ borderRadius: 3 }} />
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2, width: '10%' }}>
                    <Skeleton variant="circular" width={32} height={32} sx={{ mx: 'auto' }} />
                  </TableCell>
                </TableRow>
              ))
            ) : displayIncidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', opacity: 0.5 }} />
                    <Typography variant="h6" color="text.secondary">
                      No Recent Incidents
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      All systems are running smoothly. New incidents will appear here.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              displayIncidents.map((incident, index) => (
                <TableRow
                  key={incident.id}
                  hover
                  onClick={() => onIncidentClick?.(incident)}
                  component={motion.tr}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      cursor: 'pointer',
                    },
                  }}
                >
                    <TableCell sx={{ py: 2, width: '25%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            flexShrink: 0,
                            bgcolor: incident.priority === 'CRITICAL' ? 'error.light' :
                                    incident.priority === 'HIGH' ? 'warning.light' :
                                    incident.priority === 'MEDIUM' ? 'info.light' : 'success.light',
                          }}
                        >
                          {getPriorityIcon(incident.priority)}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <Typography 
                            variant="body2" 
                            fontWeight="bold" 
                            sx={{ 
                              mb: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {incident.incidentId}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              fontSize: '0.875rem'
                            }}
                          >
                            {incident.title}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ py: 2, width: '10%' }}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                          {new Date(incident.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {new Date(incident.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ py: 2, width: '10%' }}>
                      <Chip
                        label={INCIDENT_STATUS_CONFIG[incident.status].label}
                        size="small"
                        sx={{
                          bgcolor: `${INCIDENT_STATUS_CONFIG[incident.status].color}.light`,
                          color: `${INCIDENT_STATUS_CONFIG[incident.status].color}.main`,
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          height: 24,
                          '& .MuiChip-label': {
                            px: 1.5
                          }
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ py: 2, width: '10%' }}>
                      <Chip
                        label={INCIDENT_PRIORITY_CONFIG[incident.priority].label}
                        size="small"
                        variant="filled"
                        color={INCIDENT_PRIORITY_CONFIG[incident.priority].color as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                        sx={{
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          height: 24,
                          '& .MuiChip-label': {
                            px: 1.5
                          }
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ py: 2, width: '12%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            flexShrink: 0
                          }}
                        />
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          sx={{
                            fontSize: '0.875rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {incident.source}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ py: 2, width: '8%', textAlign: 'center' }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.875rem' }}>
                        {formatDuration(incident.duration)}
                      </Typography>
                      {incident.duration && incident.duration > 3600 && (
                        <Typography variant="caption" color="error.main" sx={{ display: 'block', fontSize: '0.7rem' }}>
                          Long
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ py: 2, width: '15%' }}>
                      <Box sx={{ display: 'flex', gap: 0.25, flexWrap: 'wrap', overflow: 'hidden' }}>
                        {incident.tags && incident.tags.length > 0 ? (
                          <>
                            {incident.tags.slice(0, 2).map((tag) => (
                              <Chip
                                key={tag}
                                label={tag.length > 10 ? `${tag.substring(0, 10)}...` : tag}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  bgcolor: 'grey.50',
                                  fontSize: '0.7rem',
                                  height: 20,
                                  '& .MuiChip-label': {
                                    px: 0.75
                                  }
                                }}
                              />
                            ))}
                            {incident.tags.length > 2 && (
                              <Chip
                                label={`+${incident.tags.length - 2}`}
                                size="small"
                                variant="filled"
                                color="primary"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  height: 20,
                                  '& .MuiChip-label': {
                                    px: 0.75
                                  }
                                }}
                              />
                            )}
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            No tags
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell align="center" sx={{ py: 2, width: '10%' }}>
                      <IconButton 
                        size="small"
                        sx={{
                          bgcolor: 'primary.light',
                          color: 'primary.main',
                          width: 32,
                          height: 32,
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText'
                          }
                        }}
                      >
                        <Visibility sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};