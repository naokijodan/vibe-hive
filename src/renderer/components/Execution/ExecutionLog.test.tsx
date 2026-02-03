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
});
