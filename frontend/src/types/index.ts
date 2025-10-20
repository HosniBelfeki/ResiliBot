// Core incident types
export interface Incident {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  severity: IncidentSeverity;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  duration?: number;
  tags: string[];
  source: string;
  metrics: IncidentMetrics;
  aiAnalysis?: AIAnalysis;
  actions: IncidentAction[];
  assignee?: string;
  postmortem?: Postmortem;
}

export type IncidentStatus =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'IDENTIFIED'
  | 'MONITORING'
  | 'RESOLVED'
  | 'CLOSED'
  | 'PENDING_APPROVAL';

export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface IncidentMetrics {
  cpuUsage?: number;
  memoryUsage?: number;
  errorRate?: number;
  responseTime?: number;
  throughput?: number;
}

export interface AIAnalysis {
  confidence: number;
  rootCause: string;
  impact: string;
  recommendations: string[];
  patterns: Pattern[];
  riskScore: number;
}

export interface Pattern {
  type: string;
  description: string;
  frequency: number;
  lastSeen: string;
}

export interface IncidentAction {
  id: string;
  type: ActionType;
  description: string;
  status: ActionStatus;
  createdAt: string;
  executedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  result?: string;
  error?: string;
}

export type ActionType =
  | 'RESTART_SERVICE'
  | 'SCALE_RESOURCES'
  | 'ROLLBACK_DEPLOYMENT'
  | 'NOTIFY_TEAM'
  | 'CREATE_TICKET'
  | 'RUN_DIAGNOSTIC'
  | 'UPDATE_CONFIG';

export type ActionStatus = 'PENDING' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Postmortem {
  id: string;
  incidentId: string;
  rootCause: string;
  timeline: TimelineEvent[];
  lessonsLearned: string[];
  preventiveMeasures: string[];
  createdAt: string;
  author: string;
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'ACTION';
  details?: string;
}

// System metrics types
export interface SystemMetrics {
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  avgResolutionTime: number;
  systemHealth: SystemHealth;
  healthHistory: HealthDataPoint[];
}

export interface SystemHealth {
  overall: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  services: ServiceHealth[];
  lastUpdated: string;
}

export interface ServiceHealth {
  name: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  responseTime: number;
  uptime: number;
}

export interface HealthDataPoint {
  timestamp: string;
  value: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

// Alert types
export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  source: string;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

// Simplified user types (no authentication)
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string | null;
}

// Removed complex settings since they're not needed

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Chart data types
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
}

// Form types
export interface IncidentFormData {
  title: string;
  description: string;
  priority: IncidentPriority;
  severity: IncidentSeverity;
  tags: string[];
  assignee?: string;
}

// Real-time update types
export interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface RealTimeUpdate {
  incident?: Incident;
  alert?: Alert;
  metric?: SystemMetrics;
  action?: IncidentAction;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Filter and search types
export interface IncidentFilters {
  status?: IncidentStatus[];
  priority?: IncidentPriority[];
  severity?: IncidentSeverity[];
  assignee?: string[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}