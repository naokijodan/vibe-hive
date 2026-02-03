// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProfilerPanel } from './ProfilerPanel';

vi.mock('../../stores/profilerStore', () => ({
  useProfilerStore: () => ({
    summary: { totalExecutions: 10, totalDurationMs: 50000, avgDurationMs: 5000, successRate: 70, statusBreakdown: { completed: 7, failed: 1, running: 2 } },
    taskStats: [],
    timeline: [],
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    sessionStats: [],
    loadSessionStats: vi.fn(),
    bottlenecks: [
      { type: 'slow_task', severity: 'high', description: 'Slow task detected', metric: 30000, threshold: 10000 },
    ],
    loadBottlenecks: vi.fn(),
  }),
}));

describe('ProfilerPanel', () => {
  it('renders overview tab by default', () => {
    render(<ProfilerPanel />);
    expect(screen.getByText('Performance Profiler')).toBeDefined();
    expect(screen.getByText('概要')).toBeDefined();
  });

  it('shows summary stats', () => {
    render(<ProfilerPanel />);
    expect(screen.getByText('10')).toBeDefined(); // totalExecutions
    expect(screen.getByText('70%')).toBeDefined(); // successRate
  });

  it('renders all tab options', () => {
    render(<ProfilerPanel />);
    expect(screen.getByText('タスク分析')).toBeDefined();
    expect(screen.getByText('タイムライン')).toBeDefined();
    expect(screen.getByText('ボトルネック')).toBeDefined();
  });

  it('shows status breakdown', () => {
    render(<ProfilerPanel />);
    expect(screen.getAllByText(/完了|7/).length).toBeGreaterThan(0);
  });
});
