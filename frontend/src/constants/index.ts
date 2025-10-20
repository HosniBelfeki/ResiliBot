// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_GATEWAY_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

// WebSocket Configuration
export const WS_CONFIG = {
  URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  RECONNECT_INTERVAL: 5000,
  MAX_RECONNECT_ATTEMPTS: 10,
} as const;

// Application Configuration
export const APP_CONFIG = {
  NAME: 'ResiliBot',
  VERSION: '1.0.0',
  DESCRIPTION: 'Autonomous Incident Response Agent',
  COMPANY: 'Hosni Belfeki',
  REFRESH_INTERVAL: parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || '10000'),
  THEME: (process.env.NEXT_PUBLIC_THEME as 'light' | 'dark') || 'light',
  ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  ENABLE_DARK_MODE: process.env.NEXT_PUBLIC_ENABLE_DARK_MODE === 'true',
  ENABLE_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
  ENABLE_REAL_TIME: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME === 'true',
  SHOW_DEBUG_INFO: process.env.NEXT_PUBLIC_SHOW_DEBUG_INFO === 'true',
  DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
  SHOW_TUTORIAL: process.env.NEXT_PUBLIC_SHOW_TUTORIAL !== 'false',
} as const;

// Incident Status Configuration
export const INCIDENT_STATUS_CONFIG = {
  OPEN: {
    label: 'Open',
    color: 'error',
    description: 'Newly created incident awaiting investigation',
  },
  INVESTIGATING: {
    label: 'Investigating',
    color: 'warning',
    description: 'Actively investigating root cause',
  },
  IDENTIFIED: {
    label: 'Identified',
    color: 'info',
    description: 'Root cause identified, planning remediation',
  },
  MONITORING: {
    label: 'Monitoring',
    color: 'secondary',
    description: 'Monitoring after remediation',
  },
  RESOLVED: {
    label: 'Resolved',
    color: 'success',
    description: 'Incident has been resolved',
  },
  CLOSED: {
    label: 'Closed',
    color: 'default',
    description: 'Incident closed after verification',
  },
  PENDING_APPROVAL: {
    label: 'Pending Approval',
    color: 'warning',
    description: 'Awaiting human approval before processing',
  },
} as const;

// Incident Priority Configuration
export const INCIDENT_PRIORITY_CONFIG = {
  LOW: {
    label: 'Low',
    color: 'info',
    weight: 1,
  },
  MEDIUM: {
    label: 'Medium',
    color: 'warning',
    weight: 2,
  },
  HIGH: {
    label: 'High',
    color: 'error',
    weight: 3,
  },
  CRITICAL: {
    label: 'Critical',
    color: 'error',
    weight: 4,
  },
} as const;

// Incident Severity Configuration
export const INCIDENT_SEVERITY_CONFIG = {
  INFO: {
    label: 'Info',
    color: 'info',
    weight: 1,
  },
  WARNING: {
    label: 'Warning',
    color: 'warning',
    weight: 2,
  },
  ERROR: {
    label: 'Error',
    color: 'error',
    weight: 3,
  },
  CRITICAL: {
    label: 'Critical',
    color: 'error',
    weight: 4,
  },
} as const;

// Action Type Configuration
export const ACTION_TYPE_CONFIG = {
  RESTART_SERVICE: {
    label: 'Restart Service',
    category: 'SAFE',
    description: 'Restart a system service',
  },
  SCALE_RESOURCES: {
    label: 'Scale Resources',
    category: 'SAFE',
    description: 'Scale up/down compute resources',
  },
  ROLLBACK_DEPLOYMENT: {
    label: 'Rollback Deployment',
    category: 'RISKY',
    description: 'Rollback to previous deployment',
  },
  NOTIFY_TEAM: {
    label: 'Notify Team',
    category: 'SAFE',
    description: 'Send notification to team',
  },
  CREATE_TICKET: {
    label: 'Create Ticket',
    category: 'SAFE',
    description: 'Create support ticket',
  },
  RUN_DIAGNOSTIC: {
    label: 'Run Diagnostic',
    category: 'SAFE',
    description: 'Run system diagnostic',
  },
  UPDATE_CONFIG: {
    label: 'Update Configuration',
    category: 'RISKY',
    description: 'Update system configuration',
  },
} as const;

// System Health Thresholds
export const HEALTH_THRESHOLDS = {
  CPU_USAGE: {
    WARNING: 70,
    CRITICAL: 90,
  },
  MEMORY_USAGE: {
    WARNING: 80,
    CRITICAL: 95,
  },
  ERROR_RATE: {
    WARNING: 5,
    CRITICAL: 10,
  },
  RESPONSE_TIME: {
    WARNING: 2000,
    CRITICAL: 5000,
  },
} as const;

// Dashboard Configuration
export const DASHBOARD_CONFIG = {
  DEFAULT_REFRESH_INTERVAL: 30000,
  CHART_COLORS: [
    '#0ea5e9', // ResiliBot blue
    '#22c55e', // Green
    '#f59e0b', // Orange
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
  ],
  MAX_WIDGETS_PER_ROW: 3,
  ANIMATION_DURATION: 300,
} as const;

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  DEFAULT_DURATION: 5000,
  MAX_NOTIFICATIONS: 10,
  QUIET_HOURS_START: '22:00',
  QUIET_HOURS_END: '08:00',
} as const;

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// Chart Configuration
export const CHART_CONFIG = {
  HEIGHT: 300,
  COLORS: {
    PRIMARY: '#0ea5e9',
    SECONDARY: '#64748b',
    SUCCESS: '#22c55e',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
  },
  GRID: {
    COLOR: '#e2e8f0',
  },
  TOOLTIP: {
    BACKGROUND: '#ffffff',
    BORDER: '#e2e8f0',
  },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'resilibot_preferences',
  DASHBOARD_LAYOUT: 'resilibot_dashboard_layout',
  AUTH_TOKEN: 'resilibot_auth_token',
  THEME: 'resilibot_theme',
  NOTIFICATIONS: 'resilibot_notifications',
} as const;

// Route Configuration
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  INCIDENTS: '/incidents',
  INCIDENT_DETAIL: '/incidents/[id]',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access to this resource is forbidden.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Internal server error occurred.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  INCIDENT_CREATED: 'Incident created successfully.',
  INCIDENT_UPDATED: 'Incident updated successfully.',
  ACTION_APPROVED: 'Action approved successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
  LOGIN_SUCCESS: 'Login successful.',
  LOGOUT_SUCCESS: 'Logout successful.',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  INCIDENT_TITLE_MIN_LENGTH: 10,
  INCIDENT_DESCRIPTION_MIN_LENGTH: 20,
  TAG_MAX_LENGTH: 50,
} as const;

// Animation Configuration
export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

// Breakpoint Configuration (for responsive design)
export const BREAKPOINTS = {
  XS: 0,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_AI_ANALYTICS: true,
  ENABLE_REAL_TIME_UPDATES: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_EXPORT: true,
  ENABLE_BULK_OPERATIONS: true,
  ENABLE_ADVANCED_FILTERS: true,
} as const;