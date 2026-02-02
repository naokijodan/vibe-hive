// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExecutionPanel } from './ExecutionPanel';

const mockLoadRunning = vi.fn();
const mockLoadExecs = vi.fn();

vi.mock('../../stores/executionStore', () => ({
  useExecutionStore: () => ({
    runningExecutions: [
      { id: 'e1', taskId: 't1', status: 'running', command: 'echo test', startedAt: new Date().toISOString() },
    ],
    executions: [
      { id: 'e2', taskId: 't2', status: 'completed', command: 'build', startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), duration: 5000 },
      { id: 'e3', taskId: 't3', status: 'failed', command: 'deploy', startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), duration: 1000, error: 'Deploy failed' },
    ],
    loadRunningExecutions: mockLoadRunning,
    loadExecutions: mockLoadExecs,
    cancelExecution: vi.fn(),
    selectedExecutionId: null,
    setSelectedExecution: vi.fn(),
  }),
}));

vi.mock('../../stores/taskStore', () => ({
  useTaskStore: () => ({
    tasks: [
      { id: 't1', title: 'Test Task', status: 'in_progress' },
      { id: 't2', title: 'Build Task', status: 'done' },
      { id: 't3', title: 'Deploy Task', status: 'done' },
    ],
  }),
}));

describe('ExecutionPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads executions on mount', () => {
    render(<ExecutionPanel />);
    expect(mockLoadRunning).toHaveBeenCalled();
    expect(mockLoadExecs).toHaveBeenCalled();
  });

  it('shows task titles from executions', () => {
    render(<ExecutionPanel />);
    expect(screen.getByText('Test Task')).toBeDefined();
    expect(screen.getByText('Build Task')).toBeDefined();
    expect(screen.getByText('Deploy Task')).toBeDefined();
  });

  it('shows running count badge', () => {
    render(<ExecutionPanel />);
    expect(screen.getByText('1 実行中')).toBeDefined();
  });

  it('shows header text', () => {
    render(<ExecutionPanel />);
    expect(screen.getByText('実行管理')).toBeDefined();
  });

  it('shows status for each execution', () => {
    render(<ExecutionPanel />);
    expect(screen.getByText('running')).toBeDefined();
    expect(screen.getByText('completed')).toBeDefined();
    expect(screen.getByText('failed')).toBeDefined();
  });

  it('shows cancel button for running executions', () => {
    render(<ExecutionPanel />);
    expect(screen.getByText('キャンセル')).toBeDefined();
  });

  it('shows refresh button', () => {
    render(<ExecutionPanel />);
    expect(screen.getByText('🔄 更新')).toBeDefined();
  });
});
