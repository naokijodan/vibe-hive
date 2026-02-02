// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExecutionLog } from './ExecutionLog';

vi.mock('xterm', () => {
  class MockTerminal {
    loadAddon = vi.fn();
    open = vi.fn();
    dispose = vi.fn();
    clear = vi.fn();
    writeln = vi.fn();
    write = vi.fn();
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

vi.mock('../../stores/taskStore', () => ({
  useTaskStore: () => ({ tasks: [] }),
}));

vi.mock('../../bridge/ipcBridge', () => ({
  default: {
    terminal: { onData: vi.fn(() => vi.fn()) },
  },
}));

describe('ExecutionLog', () => {
  it('renders placeholder when no execution', () => {
    render(<ExecutionLog execution={null} />);
    expect(screen.getByText('実行ログを表示するには、')).toBeDefined();
  });

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
});
