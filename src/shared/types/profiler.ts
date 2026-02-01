// Performance Profiler types

export interface ExecutionProfile {
  executionId: string;
  taskId: string;
  taskTitle: string;
  sessionId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  exitCode?: number;
  errorMessage?: string;
}

export interface TaskStats {
  taskId: string;
  taskTitle: string;
  totalExecutions: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  successCount: number;
  failCount: number;
  cancelCount: number;
  successRate: number;
}

export interface SessionStats {
  sessionId: string;
  sessionName: string;
  totalExecutions: number;
  totalDurationMs: number;
  avgDurationMs: number;
  successRate: number;
  statusBreakdown: Record<string, number>;
}

export interface TimelineEntry {
  executionId: string;
  taskTitle: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  status: string;
}

export interface BottleneckInfo {
  taskId: string;
  taskTitle: string;
  avgDurationMs: number;
  totalExecutions: number;
  failRate: number;
  severity: 'low' | 'medium' | 'high';
}

export interface ProfilerSummary {
  totalExecutions: number;
  totalDurationMs: number;
  avgDurationMs: number;
  successRate: number;
  statusBreakdown: Record<string, number>;
  taskStats: TaskStats[];
  bottlenecks: BottleneckInfo[];
  recentTimeline: TimelineEntry[];
}

export interface ProfilerFilter {
  sessionId?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
  limit?: number;
}
