'use client';

import React from 'react';
import {
  Typography,
  Box,
  Skeleton,
  Chip,
} from '@mui/material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { motion } from 'framer-motion';
import type { HealthDataPoint } from '@/types';
import { CHART_CONFIG } from '@/constants';

interface SystemHealthChartProps {
  data?: HealthDataPoint[];
  loading?: boolean;
}

export const SystemHealthChart: React.FC<SystemHealthChartProps> = ({
  data = [],
  loading = false,
}) => {
  // Use real data from API
  const chartData = data;

  const currentHealth = chartData[chartData.length - 1];
  const averageHealth = chartData.reduce((acc, point) => acc + point.value, 0) / chartData.length;

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
          System Health Trend
        </Typography>

        {currentHealth && !loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={`${Math.round(currentHealth.value)}% Health`}
              color={
                currentHealth.status === 'HEALTHY' ? 'success' :
                currentHealth.status === 'WARNING' ? 'warning' : 'error'
              }
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              Avg: {Math.round(averageHealth)}%
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ width: '100%', height: 300, minHeight: 300 }}>
        {loading ? (
          <Skeleton variant="rectangular" width="100%" height={300} />
        ) : chartData.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              No health data available
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={300} minHeight={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={CHART_CONFIG.COLORS.PRIMARY}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_CONFIG.COLORS.PRIMARY}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_CONFIG.GRID.COLOR}
                opacity={0.3}
              />

              <XAxis
                dataKey="timestamp"
                tickFormatter={(tickItem: string) => {
                  const date = new Date(tickItem);
                  return date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                }}
                stroke={CHART_CONFIG.COLORS.SECONDARY}
                fontSize={12}
              />

              <YAxis
                domain={[0, 100]}
                stroke={CHART_CONFIG.COLORS.SECONDARY}
                fontSize={12}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: CHART_CONFIG.TOOLTIP.BACKGROUND,
                  border: `1px solid ${CHART_CONFIG.TOOLTIP.BORDER}`,
                  borderRadius: 8,
                }}
                formatter={(value: number) => [
                  `${Math.round(value)}%`,
                  'Health Score',
                ]}
                labelFormatter={(label: string) => {
                  const date = new Date(label);
                  return date.toLocaleString();
                }}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke={CHART_CONFIG.COLORS.PRIMARY}
                strokeWidth={2}
                fill="url(#healthGradient)"
                animationDuration={1500}
                animationBegin={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Box>

      {/* Health Indicators */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-around',
              mt: 3,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            {[
              { label: 'Healthy', count: chartData.filter(d => d.status === 'HEALTHY').length, color: 'success' },
              { label: 'Warning', count: chartData.filter(d => d.status === 'WARNING').length, color: 'warning' },
              { label: 'Critical', count: chartData.filter(d => d.status === 'CRITICAL').length, color: 'error' },
            ].map((item) => (
              <Box key={item.label} sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color={`${item.color}.main`}>
                  {item.count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </motion.div>
      )}
    </Box>
  );
};