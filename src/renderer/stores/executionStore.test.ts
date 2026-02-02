import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockExecution } = vi.hoisted(() => ({
  mockExecution: {
    start: vi.fn(),
    cancel: vi.fn(),
    getAll: vi.fn(),
    getRunning: vi.fn(),
    getByTask: vi.fn(),
    onStarted: vi.fn(),
    onCompleted: vi.fn(),
    onCancelled: vi.fn(),
  },
}));

vi.mock('../bridge/ipcBridge', () => ({
  default: {
    execution: mockExecution,
  },
}));

vi.mock('../../shared/utils/errorHandler', () => ({
  toErrorMessage: (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback,
}));

import { useExecutionStore } from './executionStore';

const makeMockExecution = (overrides = {}) => ({
  id: 'exec-1',
  taskId: 'task-1',
  sessionId: 'sess-1',
  status: 'running',
  startedAt: new Date(),
  ...overrides,
});

describe('executionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExecutionStore.setState({
      executions: [],
      runningExecutions: [],
      selectedExecutionId: null,
      isLoading: false,
      error: null,
    });
  });

  describe('loadExecutions', () => {
    it('loads all executions', async () => {
      const execs = [makeMockExecution()];
      mockExecution.getAll.mockResolvedValue(execs);

      await useExecutionStore.getState().loadExecutions();

      const state = useExecutionStore.getState();
      expect(state.executions).toEqual(execs);
      expect(state.isLoading).toBe(false);
    });

    it('handles error', async () => {
      mockExecution.getAll.mockRejectedValue(new Error('DB error'));

      await useExecutionStore.getState().loadExecutions();

      expect(useExecutionStore.getState().error).toBe('DB error');
    });
  });

  describe('loadRunningExecutions', () => {
    it('loads running executions', async () => {
      const running = [makeMockExecution()];
      mockExecution.getRunning.mockResolvedValue(running);

      await useExecutionStore.getState().loadRunningExecutions();

      expect(useExecutionStore.getState().runningExecutions).toEqual(running);
    });
  });

  describe('loadRunningExecutions - error', () => {
    it('handles error gracefully', async () => {
      mockExecution.getRunning.mockRejectedValue(new Error('fail'));

      await useExecutionStore.getState().loadRunningExecutions();
      // Should not throw, running stays empty
      expect(useExecutionStore.getState().runningExecutions).toEqual([]);
    });
  });

  describe('loadExecutionsByTask - error', () => {
    it('sets error on failure', async () => {
      mockExecution.getByTask.mockRejectedValue(new Error('fail'));

      await useExecutionStore.getState().loadExecutionsByTask('task-1');
      expect(useExecutionStore.getState().error).toBe('fail');
    });
  });

  describe('startExecution', () => {
    it('starts execution and reloads running', async () => {
      mockExecution.start.mockResolvedValue({ executionId: 'exec-new', sessionId: 'sess-new' });
      mockExecution.getRunning.mockResolvedValue([makeMockExecution({ id: 'exec-new' })]);

      await useExecutionStore.getState().startExecution('task-1', 'echo hello', '/tmp');

      expect(mockExecution.start).toHaveBeenCalledWith({
        taskId: 'task-1',
        command: 'echo hello',
        workingDirectory: '/tmp',
      });
      expect(useExecutionStore.getState().isLoading).toBe(false);
    });

    it('sets error and throws on failure', async () => {
      mockExecution.start.mockRejectedValue(new Error('Start failed'));

      await expect(
        useExecutionStore.getState().startExecution('task-1', 'cmd')
      ).rejects.toThrow('Start failed');

      expect(useExecutionStore.getState().error).toBe('Start failed');
    });
  });

  describe('cancelExecution', () => {
    it('cancels and reloads running', async () => {
      mockExecution.cancel.mockResolvedValue(undefined);
      mockExecution.getRunning.mockResolvedValue([]);

      await useExecutionStore.getState().cancelExecution('exec-1');

      expect(mockExecution.cancel).toHaveBeenCalledWith('exec-1');
      expect(useExecutionStore.getState().runningExecutions).toEqual([]);
    });

    it('sets error and throws on failure', async () => {
      mockExecution.cancel.mockRejectedValue(new Error('Cancel failed'));

      await expect(
        useExecutionStore.getState().cancelExecution('exec-1')
      ).rejects.toThrow('Cancel failed');
    });
  });

  describe('loadExecutionsByTask', () => {
    it('loads executions for specific task', async () => {
      const execs = [makeMockExecution()];
      mockExecution.getByTask.mockResolvedValue(execs);

      await useExecutionStore.getState().loadExecutionsByTask('task-1');

      expect(mockExecution.getByTask).toHaveBeenCalledWith('task-1');
      expect(useExecutionStore.getState().executions).toEqual(execs);
    });
  });

  describe('setSelectedExecution', () => {
    it('sets selected execution ID', () => {
      useExecutionStore.getState().setSelectedExecution('exec-1');
      expect(useExecutionStore.getState().selectedExecutionId).toBe('exec-1');
    });

    it('clears selected execution', () => {
      useExecutionStore.getState().setSelectedExecution('exec-1');
      useExecutionStore.getState().setSelectedExecution(null);
      expect(useExecutionStore.getState().selectedExecutionId).toBeNull();
    });
  });
});
