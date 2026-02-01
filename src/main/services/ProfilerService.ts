// Performance Profiler Service
// Aggregates execution data for analysis and bottleneck detection

import { getDatabase } from './db';
import type {
  ProfilerSummary,
  ProfilerFilter,
  TaskStats,
  SessionStats,
  TimelineEntry,
  BottleneckInfo,
  ExecutionProfile,
} from '../../shared/types/profiler';

class ProfilerService {
  private getDb() {
    return getDatabase();
  }

  /**
   * Get full profiler summary
   */
  getSummary(filter?: ProfilerFilter): ProfilerSummary {
    const executions = this.getExecutions(filter);

    const totalExecutions = executions.length;
    const completed = executions.filter(e => e.durationMs != null);
    const totalDurationMs = completed.reduce((sum, e) => sum + (e.durationMs || 0), 0);
    const avgDurationMs = completed.length > 0 ? Math.round(totalDurationMs / completed.length) : 0;
    const successCount = executions.filter(e => e.status === 'completed').length;
    const successRate = totalExecutions > 0 ? Math.round((successCount / totalExecutions) * 100) : 0;

    const statusBreakdown: Record<string, number> = {};
    for (const e of executions) {
      statusBreakdown[e.status] = (statusBreakdown[e.status] || 0) + 1;
    }

    const taskStats = this.getTaskStats(filter);
    const bottlenecks = this.getBottlenecks(taskStats);
    const recentTimeline = this.getTimeline({ ...filter, limit: 50 });

    return {
      totalExecutions,
      totalDurationMs,
      avgDurationMs,
      successRate,
      statusBreakdown,
      taskStats,
      bottlenecks,
      recentTimeline,
    };
  }

  /**
   * Get execution profiles from DB
   */
  getExecutions(filter?: ProfilerFilter): ExecutionProfile[] {
    const db = this.getDb();
    let query = `
      SELECT
        eh.id as executionId,
        eh.task_id as taskId,
        COALESCE(t.title, 'Unknown') as taskTitle,
        eh.session_id as sessionId,
        eh.status,
        eh.started_at as startedAt,
        eh.completed_at as completedAt,
        eh.exit_code as exitCode,
        eh.error_message as errorMessage,
        CASE
          WHEN eh.completed_at IS NOT NULL AND eh.started_at IS NOT NULL
          THEN CAST((julianday(eh.completed_at) - julianday(eh.started_at)) * 86400000 AS INTEGER)
          ELSE NULL
        END as durationMs
      FROM execution_history eh
      LEFT JOIN tasks t ON t.id = eh.task_id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (filter?.sessionId) {
      query += ' AND eh.session_id = ?';
      params.push(filter.sessionId);
    }
    if (filter?.fromDate) {
      query += ' AND eh.started_at >= ?';
      params.push(filter.fromDate);
    }
    if (filter?.toDate) {
      query += ' AND eh.started_at <= ?';
      params.push(filter.toDate);
    }
    if (filter?.status) {
      query += ' AND eh.status = ?';
      params.push(filter.status);
    }

    query += ' ORDER BY eh.started_at DESC';

    if (filter?.limit) {
      query += ' LIMIT ?';
      params.push(filter.limit);
    }

    const stmt = db.prepare(query);
    return stmt.all(...params) as ExecutionProfile[];
  }

  /**
   * Get per-task statistics
   */
  getTaskStats(filter?: ProfilerFilter): TaskStats[] {
    const db = this.getDb();
    let query = `
      SELECT
        eh.task_id as taskId,
        COALESCE(t.title, 'Unknown') as taskTitle,
        COUNT(*) as totalExecutions,
        COALESCE(AVG(
          CASE WHEN eh.completed_at IS NOT NULL
          THEN CAST((julianday(eh.completed_at) - julianday(eh.started_at)) * 86400000 AS INTEGER)
          ELSE NULL END
        ), 0) as avgDurationMs,
        COALESCE(MIN(
          CASE WHEN eh.completed_at IS NOT NULL
          THEN CAST((julianday(eh.completed_at) - julianday(eh.started_at)) * 86400000 AS INTEGER)
          ELSE NULL END
        ), 0) as minDurationMs,
        COALESCE(MAX(
          CASE WHEN eh.completed_at IS NOT NULL
          THEN CAST((julianday(eh.completed_at) - julianday(eh.started_at)) * 86400000 AS INTEGER)
          ELSE NULL END
        ), 0) as maxDurationMs,
        SUM(CASE WHEN eh.status = 'completed' THEN 1 ELSE 0 END) as successCount,
        SUM(CASE WHEN eh.status = 'failed' THEN 1 ELSE 0 END) as failCount,
        SUM(CASE WHEN eh.status = 'cancelled' THEN 1 ELSE 0 END) as cancelCount
      FROM execution_history eh
      LEFT JOIN tasks t ON t.id = eh.task_id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (filter?.sessionId) {
      query += ' AND eh.session_id = ?';
      params.push(filter.sessionId);
    }
    if (filter?.fromDate) {
      query += ' AND eh.started_at >= ?';
      params.push(filter.fromDate);
    }
    if (filter?.toDate) {
      query += ' AND eh.started_at <= ?';
      params.push(filter.toDate);
    }

    query += ' GROUP BY eh.task_id ORDER BY avgDurationMs DESC';

    const rows = db.prepare(query).all(...params) as Array<TaskStats & { successCount: number; totalExecutions: number }>;
    return rows.map(row => ({
      ...row,
      avgDurationMs: Math.round(row.avgDurationMs),
      successRate: row.totalExecutions > 0 ? Math.round((row.successCount / row.totalExecutions) * 100) : 0,
    }));
  }

  /**
   * Get per-session statistics
   */
  getSessionStats(): SessionStats[] {
    const db = this.getDb();
    const query = `
      SELECT
        eh.session_id as sessionId,
        COALESCE(s.name, 'Unknown') as sessionName,
        COUNT(*) as totalExecutions,
        COALESCE(SUM(
          CASE WHEN eh.completed_at IS NOT NULL
          THEN CAST((julianday(eh.completed_at) - julianday(eh.started_at)) * 86400000 AS INTEGER)
          ELSE 0 END
        ), 0) as totalDurationMs,
        COALESCE(AVG(
          CASE WHEN eh.completed_at IS NOT NULL
          THEN CAST((julianday(eh.completed_at) - julianday(eh.started_at)) * 86400000 AS INTEGER)
          ELSE NULL END
        ), 0) as avgDurationMs,
        SUM(CASE WHEN eh.status = 'completed' THEN 1 ELSE 0 END) as successCount,
        eh.status
      FROM execution_history eh
      LEFT JOIN sessions s ON s.id = eh.session_id
      GROUP BY eh.session_id
      ORDER BY totalExecutions DESC
    `;

    const rows = db.prepare(query).all() as Array<{
      sessionId: string;
      sessionName: string;
      totalExecutions: number;
      totalDurationMs: number;
      avgDurationMs: number;
      successCount: number;
    }>;

    // Get status breakdown per session
    return rows.map(row => {
      const breakdownQuery = `
        SELECT status, COUNT(*) as count
        FROM execution_history
        WHERE session_id = ?
        GROUP BY status
      `;
      const breakdownRows = db.prepare(breakdownQuery).all(row.sessionId) as Array<{ status: string; count: number }>;
      const statusBreakdown: Record<string, number> = {};
      for (const b of breakdownRows) {
        statusBreakdown[b.status] = b.count;
      }

      return {
        sessionId: row.sessionId,
        sessionName: row.sessionName,
        totalExecutions: row.totalExecutions,
        totalDurationMs: row.totalDurationMs,
        avgDurationMs: Math.round(row.avgDurationMs),
        successRate: row.totalExecutions > 0 ? Math.round((row.successCount / row.totalExecutions) * 100) : 0,
        statusBreakdown,
      };
    });
  }

  /**
   * Get timeline of executions
   */
  getTimeline(filter?: ProfilerFilter): TimelineEntry[] {
    const db = this.getDb();
    let query = `
      SELECT
        eh.id as executionId,
        COALESCE(t.title, 'Unknown') as taskTitle,
        eh.started_at as startedAt,
        eh.completed_at as completedAt,
        CASE
          WHEN eh.completed_at IS NOT NULL AND eh.started_at IS NOT NULL
          THEN CAST((julianday(eh.completed_at) - julianday(eh.started_at)) * 86400000 AS INTEGER)
          ELSE NULL
        END as durationMs,
        eh.status
      FROM execution_history eh
      LEFT JOIN tasks t ON t.id = eh.task_id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (filter?.sessionId) {
      query += ' AND eh.session_id = ?';
      params.push(filter.sessionId);
    }
    if (filter?.fromDate) {
      query += ' AND eh.started_at >= ?';
      params.push(filter.fromDate);
    }
    if (filter?.toDate) {
      query += ' AND eh.started_at <= ?';
      params.push(filter.toDate);
    }

    query += ' ORDER BY eh.started_at DESC';
    query += ` LIMIT ${filter?.limit || 100}`;

    return db.prepare(query).all(...params) as TimelineEntry[];
  }

  /**
   * Detect bottlenecks from task stats
   */
  private getBottlenecks(taskStats: TaskStats[]): BottleneckInfo[] {
    if (taskStats.length === 0) return [];

    const overallAvg = taskStats.reduce((sum, t) => sum + t.avgDurationMs, 0) / taskStats.length;

    const results: BottleneckInfo[] = [];

    for (const t of taskStats) {
      if (t.totalExecutions < 2) continue;

      const failRate = t.totalExecutions > 0
        ? Math.round((t.failCount / t.totalExecutions) * 100)
        : 0;

      let severity: 'low' | 'medium' | 'high' = 'low';
      if (t.avgDurationMs > overallAvg * 3 || failRate > 50) severity = 'high';
      else if (t.avgDurationMs > overallAvg * 1.5 || failRate > 25) severity = 'medium';
      else continue;

      results.push({
        taskId: t.taskId,
        taskTitle: t.taskTitle,
        avgDurationMs: t.avgDurationMs,
        totalExecutions: t.totalExecutions,
        failRate,
        severity,
      });
    }

    const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    return results;
  }
}

let profilerService: ProfilerService | null = null;

export function getProfilerService(): ProfilerService {
  if (!profilerService) {
    profilerService = new ProfilerService();
  }
  return profilerService;
}
