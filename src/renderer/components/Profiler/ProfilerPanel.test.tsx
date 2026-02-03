// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfilerPanel } from './ProfilerPanel';

const { mockFns, mockState } = vi.hoisted(() => ({
  mockFns: {
    refresh: vi.fn(),
    loadSessionStats: vi.fn(),
    loadBottlenecks: vi.fn(),
  },
  mockState: {
    summary: {
      totalExecutions: 10,
      totalDurationMs: 50000,
      avgDurationMs: 5000,
      successRate: 70,
      statusBreakdown: { completed: 7, failed: 1, running: 2 },
      bottlenecks: [] as any[],
    } as any,
    taskStats: [] as any[],
    timeline: [] as any[],
    isLoading: false,
    error: null as string | null,
    sessionStats: [] as any[],
  },
}));

vi.mock('../../stores/profilerStore', () => ({
  useProfilerStore: () => ({
    ...mockState,
    ...mockFns,
    bottlenecks: mockState.summary?.bottlenecks || [],
  }),
}));

describe('ProfilerPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.summary = {
      totalExecutions: 10,
      totalDurationMs: 50000,
      avgDurationMs: 5000,
      successRate: 70,
      statusBreakdown: { completed: 7, failed: 1, running: 2 },
      bottlenecks: [],
    };
    mockState.taskStats = [];
    mockState.timeline = [];
    mockState.isLoading = false;
    mockState.error = null;
    mockState.sessionStats = [];
  });

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

  describe('loading and refresh', () => {
    it('calls refresh on mount', () => {
      render(<ProfilerPanel />);
      expect(mockFns.refresh).toHaveBeenCalled();
    });

    it('calls loadSessionStats on mount', () => {
      render(<ProfilerPanel />);
      expect(mockFns.loadSessionStats).toHaveBeenCalled();
    });

    it('shows loading state on button', () => {
      mockState.isLoading = true;
      render(<ProfilerPanel />);
      expect(screen.getByText('更新中...')).toBeDefined();
    });

    it('shows refresh button when not loading', () => {
      render(<ProfilerPanel />);
      expect(screen.getByText('更新')).toBeDefined();
    });

    it('disables button when loading', () => {
      mockState.isLoading = true;
      render(<ProfilerPanel />);
      const button = screen.getByText('更新中...');
      expect(button).toHaveProperty('disabled', true);
    });

    it('calls refresh when button clicked', () => {
      render(<ProfilerPanel />);
      vi.clearAllMocks();
      fireEvent.click(screen.getByText('更新'));
      expect(mockFns.refresh).toHaveBeenCalled();
      expect(mockFns.loadSessionStats).toHaveBeenCalled();
    });
  });

  describe('error state', () => {
    it('shows error message when error exists', () => {
      mockState.error = 'Failed to load profiler data';
      render(<ProfilerPanel />);
      expect(screen.getByText('Failed to load profiler data')).toBeDefined();
    });

    it('does not show error when no error', () => {
      render(<ProfilerPanel />);
      expect(screen.queryByText(/Failed/)).toBeNull();
    });
  });

  describe('tab switching', () => {
    it('switches to tasks tab', () => {
      render(<ProfilerPanel />);
      fireEvent.click(screen.getByText('タスク分析'));
      expect(screen.getByText('タスク統計データがありません。')).toBeDefined();
    });

    it('switches to timeline tab', () => {
      render(<ProfilerPanel />);
      fireEvent.click(screen.getByText('タイムライン'));
      expect(screen.getByText('タイムラインデータがありません。')).toBeDefined();
    });

    it('switches to bottlenecks tab', () => {
      render(<ProfilerPanel />);
      fireEvent.click(screen.getByText('ボトルネック'));
      expect(screen.getByText('ボトルネックは検出されませんでした。')).toBeDefined();
    });

    it('switches back to overview tab', () => {
      render(<ProfilerPanel />);
      fireEvent.click(screen.getByText('タスク分析'));
      fireEvent.click(screen.getByText('概要'));
      expect(screen.getByText('10')).toBeDefined();
    });
  });

  describe('overview empty state', () => {
    it('shows empty message when no summary', () => {
      mockState.summary = null;
      render(<ProfilerPanel />);
      expect(screen.getByText('データがありません。タスクを実行するとここに分析結果が表示されます。')).toBeDefined();
    });
  });

  describe('tasks tab with data', () => {
    it('shows task stats when available', () => {
      mockState.taskStats = [
        {
          taskId: 't1',
          taskTitle: 'Test Task',
          totalExecutions: 5,
          avgDurationMs: 3000,
          minDurationMs: 1000,
          maxDurationMs: 5000,
          successRate: 80,
          failCount: 1,
        },
      ];
      render(<ProfilerPanel />);
      fireEvent.click(screen.getByText('タスク分析'));
      expect(screen.getByText('Test Task')).toBeDefined();
      expect(screen.getByText('5')).toBeDefined();
    });

    it('shows task header columns', () => {
      mockState.taskStats = [
        {
          taskId: 't1',
          taskTitle: 'Task',
          totalExecutions: 1,
          avgDurationMs: 1000,
          minDurationMs: 1000,
          maxDurationMs: 1000,
          successRate: 100,
          failCount: 0,
        },
      ];
      render(<ProfilerPanel />);
      fireEvent.click(screen.getByText('タスク分析'));
      expect(screen.getByText('実行回数')).toBeDefined();
      expect(screen.getByText('平均')).toBeDefined();
      expect(screen.getByText('最短')).toBeDefined();
      expect(screen.getByText('最長')).toBeDefined();
      expect(screen.getByText('成功率')).toBeDefined();
    });
  });

  describe('timeline tab with data', () => {
    it('shows timeline entries', () => {
      mockState.timeline = [
        {
          executionId: 'e1',
          taskTitle: 'Timeline Task',
          status: 'completed',
          startedAt: '2025-01-01T00:00:00Z',
          durationMs: 2500,
        },
      ];
      render(<ProfilerPanel />);
      fireEvent.click(screen.getByText('タイムライン'));
      expect(screen.getByText('Timeline Task')).toBeDefined();
    });

    it('shows dash for null duration', () => {
      mockState.timeline = [
        {
          executionId: 'e1',
          taskTitle: 'Running Task',
          status: 'running',
          startedAt: '2025-01-01T00:00:00Z',
          durationMs: null,
        },
      ];
      render(<ProfilerPanel />);
      fireEvent.click(screen.getByText('タイムライン'));
      expect(screen.getByText('-')).toBeDefined();
    });
  });

  describe('bottlenecks tab with data', () => {
    it('shows bottleneck entries', () => {
      mockState.summary = {
        ...mockState.summary,
        bottlenecks: [
          {
            taskId: 't1',
            taskTitle: 'Slow Task',
            severity: 'high',
            avgDurationMs: 30000,
            totalExecutions: 5,
            failRate: 40,
          },
        ],
      };
      render(<ProfilerPanel />);
      fireEvent.click(screen.getByText('ボトルネック'));
      expect(screen.getByText('Slow Task')).toBeDefined();
      expect(screen.getByText('high')).toBeDefined();
    });
  });

  describe('session stats', () => {
    it('shows session stats when available', () => {
      mockState.sessionStats = [
        {
          sessionId: 's1',
          sessionName: 'Test Session',
          totalExecutions: 3,
          avgDurationMs: 2000,
          successRate: 90,
        },
      ];
      render(<ProfilerPanel />);
      expect(screen.getByText('Test Session')).toBeDefined();
      expect(screen.getByText('3 回実行')).toBeDefined();
    });
  });

  describe('success rate colors', () => {
    it('shows green for high success rate', () => {
      mockState.summary = { ...mockState.summary, successRate: 85 };
      const { container } = render(<ProfilerPanel />);
      expect(container.innerHTML).toContain('text-green-400');
    });

    it('shows yellow for medium success rate', () => {
      mockState.summary = { ...mockState.summary, successRate: 65 };
      const { container } = render(<ProfilerPanel />);
      expect(container.innerHTML).toContain('text-yellow-400');
    });

    it('shows red for low success rate', () => {
      mockState.summary = { ...mockState.summary, successRate: 30 };
      const { container } = render(<ProfilerPanel />);
      expect(container.innerHTML).toContain('text-red-400');
    });
  });

  describe('status bar visualization', () => {
    it('renders status bar when totalExecutions > 0', () => {
      const { container } = render(<ProfilerPanel />);
      expect(container.innerHTML).toContain('h-3 rounded-full');
    });
  });

  describe('header', () => {
    it('shows header title', () => {
      render(<ProfilerPanel />);
      expect(screen.getByText('Performance Profiler')).toBeDefined();
    });

    it('shows header description', () => {
      render(<ProfilerPanel />);
      expect(screen.getByText('実行時間分析・ボトルネック検出')).toBeDefined();
    });
  });

  describe('styling', () => {
    it('has overflow auto', () => {
      const { container } = render(<ProfilerPanel />);
      expect(container.innerHTML).toContain('overflow-auto');
    });

    it('has max-width container', () => {
      const { container } = render(<ProfilerPanel />);
      expect(container.innerHTML).toContain('max-w-6xl');
    });
  });
});
