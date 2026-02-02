import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAll, mockPrepare } = vi.hoisted(() => {
  const mockAll = vi.fn(() => []);
  return {
    mockAll,
    mockPrepare: vi.fn(() => ({ all: mockAll })),
  };
});

vi.mock('./db', () => ({
  getDatabase: () => ({ prepare: mockPrepare }),
}));

let getProfilerService: () => any;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.doMock('./db', () => ({
    getDatabase: () => ({ prepare: mockPrepare }),
  }));
  const mod = await import('./ProfilerService');
  getProfilerService = mod.getProfilerService;
});

describe('ProfilerService', () => {
  it('getExecutions returns empty array', () => {
    mockAll.mockReturnValue([]);
    const svc = getProfilerService();
    expect(svc.getExecutions()).toEqual([]);
  });

  it('getExecutions applies sessionId filter', () => {
    mockAll.mockReturnValue([]);
    const svc = getProfilerService();
    svc.getExecutions({ sessionId: 'sess-1' });
    expect(mockPrepare).toHaveBeenCalled();
  });

  it('getExecutions applies all filters', () => {
    mockAll.mockReturnValue([]);
    const svc = getProfilerService();
    svc.getExecutions({ sessionId: 's1', fromDate: '2026-01-01', toDate: '2026-12-31', status: 'completed', limit: 10 });
    expect(mockPrepare).toHaveBeenCalled();
  });

  it('getSummary returns stats with empty data', () => {
    mockAll.mockReturnValue([]);
    const svc = getProfilerService();
    const summary = svc.getSummary();
    expect(summary.totalExecutions).toBe(0);
    expect(summary.avgDurationMs).toBe(0);
    expect(summary.successRate).toBe(0);
    expect(summary.bottlenecks).toEqual([]);
  });

  it('getSummary calculates stats from executions', () => {
    const executions = [
      { status: 'completed', durationMs: 1000 },
      { status: 'completed', durationMs: 2000 },
      { status: 'failed', durationMs: 500 },
    ];
    // getExecutions call
    mockAll.mockReturnValueOnce(executions);
    // getTaskStats call
    mockAll.mockReturnValueOnce([]);
    // getTimeline call
    mockAll.mockReturnValueOnce([]);

    const svc = getProfilerService();
    const summary = svc.getSummary();
    expect(summary.totalExecutions).toBe(3);
    expect(summary.successRate).toBe(67); // 2/3
  });

  it('getTaskStats returns mapped stats', () => {
    mockAll.mockReturnValue([
      { taskId: 1, taskTitle: 'T1', totalExecutions: 10, avgDurationMs: 1500.7, successCount: 8, failCount: 2, cancelCount: 0 },
    ]);
    const svc = getProfilerService();
    const stats = svc.getTaskStats();
    expect(stats[0].avgDurationMs).toBe(1501); // rounded
    expect(stats[0].successRate).toBe(80);
  });

  it('getSessionStats returns per-session data', () => {
    // First call: main query
    mockAll.mockReturnValueOnce([
      { sessionId: 's1', sessionName: 'Session 1', totalExecutions: 5, totalDurationMs: 10000, avgDurationMs: 2000, successCount: 4 },
    ]);
    // Second call: breakdown query
    mockAll.mockReturnValueOnce([
      { status: 'completed', count: 4 },
      { status: 'failed', count: 1 },
    ]);

    const svc = getProfilerService();
    const stats = svc.getSessionStats();
    expect(stats).toHaveLength(1);
    expect(stats[0].successRate).toBe(80);
    expect(stats[0].statusBreakdown.completed).toBe(4);
  });

  it('getTimeline returns entries', () => {
    mockAll.mockReturnValue([{ executionId: 1, taskTitle: 'T1', status: 'completed' }]);
    const svc = getProfilerService();
    const timeline = svc.getTimeline();
    expect(timeline).toHaveLength(1);
  });

  it('getTimeline applies filters', () => {
    mockAll.mockReturnValue([]);
    const svc = getProfilerService();
    svc.getTimeline({ sessionId: 's1', fromDate: '2026-01-01', toDate: '2026-12-31', limit: 10 });
    expect(mockPrepare).toHaveBeenCalled();
  });
});
