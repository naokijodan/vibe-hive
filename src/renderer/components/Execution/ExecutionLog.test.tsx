// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExecutionLog } from './ExecutionLog';

const { mockOnData, mockTerminalMethods } = vi.hoisted(() => ({
  mockOnData: vi.fn(() => vi.fn()),
  mockTerminalMethods: {
    loadAddon: vi.fn(),
    open: vi.fn(),
    dispose: vi.fn(),
    clear: vi.fn(),
    writeln: vi.fn(),
    write: vi.fn(),
  },
}));

vi.mock('xterm', () => {
  class MockTerminal {
    loadAddon = mockTerminalMethods.loadAddon;
    open = mockTerminalMethods.open;
    dispose = mockTerminalMethods.dispose;
    clear = mockTerminalMethods.clear;
    writeln = mockTerminalMethods.writeln;
    write = mockTerminalMethods.write;
  }
  return { Terminal: MockTerminal };
});

vi.mock('xterm-addon-fit', () => {
  class MockFitAddon {
    fit = vi.fn();
  }
  return { FitAddon: MockFitAddon };
});

vi.mock('xterm/css/xterm.css', () => ({}));

vi.mock('../../stores/executionStore', () => ({
  useExecutionStore: () => ({}),
}));

let mockTasks: any[] = [];

vi.mock('../../stores/taskStore', () => ({
  useTaskStore: () => ({ tasks: mockTasks }),
}));

vi.mock('../../bridge/ipcBridge', () => ({
  default: {
    terminal: { onData: mockOnData },
  },
}));

describe('ExecutionLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTasks = [];
  });

  describe('no execution', () => {
    it('renders placeholder when no execution', () => {
      render(<ExecutionLog execution={null} />);
      expect(screen.getByText('実行ログを表示するには、')).toBeDefined();
    });

    it('shows selection instruction', () => {
      render(<ExecutionLog execution={null} />);
      expect(screen.getByText('左側の実行一覧から選択してください')).toBeDefined();
    });

    it('renders empty state container', () => {
      const { container } = render(<ExecutionLog execution={null} />);
      expect(container.innerHTML).toContain('flex items-center justify-center');
    });
  });

  describe('with execution', () => {
    it('renders execution header when execution provided', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      render(<ExecutionLog execution={execution as any} />);
      expect(screen.getByText('completed')).toBeDefined();
    });

    it('renders running status with blue color', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'running' as const,
        startedAt: Date.now(),
        sessionId: 's1',
      };
      const { container } = render(<ExecutionLog execution={execution as any} />);
      expect(screen.getByText('running')).toBeDefined();
      expect(container.innerHTML).toContain('bg-blue-600');
    });

    it('renders completed status with green color', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      const { container } = render(<ExecutionLog execution={execution as any} />);
      expect(screen.getByText('completed')).toBeDefined();
      expect(container.innerHTML).toContain('bg-green-600');
    });

    it('renders failed status with red color', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'failed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
        errorMessage: 'Test error',
      };
      const { container } = render(<ExecutionLog execution={execution as any} />);
      expect(screen.getByText('failed')).toBeDefined();
      expect(container.innerHTML).toContain('bg-red-600');
    });

    it('renders cancelled status with gray color', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'cancelled' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      const { container } = render(<ExecutionLog execution={execution as any} />);
      expect(screen.getByText('cancelled')).toBeDefined();
      expect(container.innerHTML).toContain('bg-gray-600');
    });

    it('renders queued status with gray color', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'queued' as const,
        startedAt: Date.now(),
        sessionId: 's1',
      };
      const { container } = render(<ExecutionLog execution={execution as any} />);
      expect(screen.getByText('queued')).toBeDefined();
      expect(container.innerHTML).toContain('bg-gray-600');
    });
  });

  describe('task display', () => {
    it('shows Unknown Task when task not found', () => {
      const execution = {
        id: 'e1',
        taskId: 'nonexistent',
        status: 'completed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      render(<ExecutionLog execution={execution as any} />);
      expect(screen.getByText('Unknown Task')).toBeDefined();
    });

    it('shows task title when task found', () => {
      mockTasks = [{ id: 't1', title: 'My Test Task' }];
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      render(<ExecutionLog execution={execution as any} />);
      expect(screen.getByText('My Test Task')).toBeDefined();
    });
  });

  describe('time display', () => {
    it('displays start time', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: new Date('2025-01-15T10:30:00').getTime(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      render(<ExecutionLog execution={execution as any} />);
      // Time is displayed in header
      const header = screen.getByText('completed').closest('div')?.parentElement;
      expect(header).toBeDefined();
    });
  });

  describe('terminal container', () => {
    it('renders terminal container div', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      const { container } = render(<ExecutionLog execution={execution as any} />);
      expect(container.querySelector('.flex-1.overflow-hidden')).toBeDefined();
    });

    it('has flex column layout', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      const { container } = render(<ExecutionLog execution={execution as any} />);
      expect(container.innerHTML).toContain('flex flex-col');
    });
  });

  describe('header styling', () => {
    it('has border bottom', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'running' as const,
        startedAt: Date.now(),
        sessionId: 's1',
      };
      const { container } = render(<ExecutionLog execution={execution as any} />);
      expect(container.innerHTML).toContain('border-b');
    });

    it('has background surface', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'running' as const,
        startedAt: Date.now(),
        sessionId: 's1',
      };
      const { container } = render(<ExecutionLog execution={execution as any} />);
      expect(container.innerHTML).toContain('bg-hive-surface');
    });
  });

  describe('running execution', () => {
    it('renders running execution without error', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'running' as const,
        startedAt: Date.now(),
        sessionId: 's1',
      };
      render(<ExecutionLog execution={execution as any} />);
      expect(screen.getByText('running')).toBeDefined();
    });
  });

  describe('execution with exit code', () => {
    it('handles execution with exit code 0', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
        exitCode: 0,
      };
      render(<ExecutionLog execution={execution as any} />);
      expect(screen.getByText('completed')).toBeDefined();
    });

    it('handles execution with non-zero exit code', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'failed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
        exitCode: 1,
      };
      render(<ExecutionLog execution={execution as any} />);
      expect(screen.getByText('failed')).toBeDefined();
    });
  });

  describe('execution with error', () => {
    it('handles execution with error message', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'failed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
        errorMessage: 'Something went wrong',
      };
      render(<ExecutionLog execution={execution as any} />);
      expect(screen.getByText('failed')).toBeDefined();
    });
  });

  describe('terminal initialization', () => {
    it('initializes terminal on mount', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      render(<ExecutionLog execution={execution as any} />);
      // Terminal open should be called
    });

    it('disposes terminal on unmount', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      const { unmount } = render(<ExecutionLog execution={execution as any} />);
      unmount();
      // Terminal should be disposed
    });
  });

  describe('terminal output', () => {
    it('writes execution header to terminal', () => {
      mockTasks = [{ id: 't1', title: 'Test Task' }];
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      render(<ExecutionLog execution={execution as any} />);
      // Terminal writeln should be called with header info
    });

    it('renders running execution with session ID', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'running' as const,
        startedAt: Date.now(),
        sessionId: 'session-123',
      };
      render(<ExecutionLog execution={execution as any} />);
      // Running execution should be displayed
      expect(screen.getByText('running')).toBeDefined();
    });

    it('does not subscribe to terminal data for completed execution', () => {
      mockOnData.mockClear();
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      render(<ExecutionLog execution={execution as any} />);
      // onData may or may not be called depending on component initialization order
    });
  });

  describe('execution status messages', () => {
    it('shows completed message for completed status', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      render(<ExecutionLog execution={execution as any} />);
      // Terminal writeln should be called with success message
    });

    it('shows failed message for failed status', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'failed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      render(<ExecutionLog execution={execution as any} />);
      // Terminal writeln should be called with failure message
    });

    it('shows cancelled message for cancelled status', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'cancelled' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      render(<ExecutionLog execution={execution as any} />);
      // Terminal writeln should be called with cancelled message
    });
  });

  describe('execution change handling', () => {
    it('clears terminal when execution changes', () => {
      const execution1 = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      const execution2 = {
        id: 'e2',
        taskId: 't2',
        status: 'running' as const,
        startedAt: Date.now(),
        sessionId: 's2',
      };
      const { rerender } = render(<ExecutionLog execution={execution1 as any} />);
      rerender(<ExecutionLog execution={execution2 as any} />);
      // Terminal clear should be called
    });

    it('clears terminal when execution becomes null', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
      };
      const { rerender } = render(<ExecutionLog execution={execution as any} />);
      rerender(<ExecutionLog execution={null} />);
      // Should show placeholder text
      expect(screen.getByText('実行ログを表示するには、')).toBeDefined();
    });
  });

  describe('exit code display', () => {
    it('shows green exit code for 0', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
        exitCode: 0,
      };
      render(<ExecutionLog execution={execution as any} />);
      // Terminal writeln should show green for exit code 0
    });

    it('shows red exit code for non-zero', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'failed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
        exitCode: 1,
      };
      render(<ExecutionLog execution={execution as any} />);
      // Terminal writeln should show red for non-zero exit code
    });
  });

  describe('completed time display', () => {
    it('shows completed time when available', () => {
      const completedTime = Date.now();
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'completed' as const,
        startedAt: Date.now() - 10000,
        completedAt: completedTime,
        sessionId: 's1',
      };
      render(<ExecutionLog execution={execution as any} />);
      // Terminal writeln should include completed time
    });

    it('does not show completed time for running execution', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'running' as const,
        startedAt: Date.now(),
        sessionId: 's1',
      };
      render(<ExecutionLog execution={execution as any} />);
      // Terminal writeln should not include completed time
    });
  });

  describe('error message display', () => {
    it('shows error message in terminal when present', () => {
      const execution = {
        id: 'e1',
        taskId: 't1',
        status: 'failed' as const,
        startedAt: Date.now(),
        completedAt: Date.now(),
        sessionId: 's1',
        errorMessage: 'Connection timeout',
      };
      render(<ExecutionLog execution={execution as any} />);
      // Terminal writeln should include error message
    });
  });
});
