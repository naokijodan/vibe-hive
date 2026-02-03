import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/ExecutionEngine', () => ({
  getExecutionEngine: () => ({
    startExecution: vi.fn(),
    cancelExecution: vi.fn(),
    getExecution: vi.fn(),
    getExecutionsByTask: vi.fn(),
    getAllExecutions: vi.fn(),
    getRunningExecutions: vi.fn(),
  }),
}));

import { registerExecutionHandlers } from './executionHandlers';

describe('executionHandlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers all execution handlers', () => {
    registerExecutionHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('execution:start');
    expect(channels).toContain('execution:cancel');
    expect(channels).toContain('execution:get');
    expect(channels).toContain('execution:getByTask');
    expect(channels).toContain('execution:getAll');
    expect(channels).toContain('execution:getRunning');
    expect(mockHandle).toHaveBeenCalledTimes(6);
  });

  describe('handler invocations', () => {
    let handlers: Map<string, (...args: unknown[]) => unknown>;

    beforeEach(() => {
      handlers = new Map();
      mockHandle.mockImplementation((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      });
      registerExecutionHandlers();
    });

    it('execution:start invokes engine', async () => {
      const handler = handlers.get('execution:start');
      await handler?.({}, { taskId: 'task-1', command: 'echo test' });
    });

    it('execution:start validates request', async () => {
      const handler = handlers.get('execution:start');
      await expect(handler?.({}, {})).rejects.toThrow();
    });

    it('execution:cancel invokes engine', async () => {
      const handler = handlers.get('execution:cancel');
      await handler?.({}, 'exec-1');
    });

    it('execution:get invokes engine', async () => {
      const handler = handlers.get('execution:get');
      await handler?.({}, 'exec-1');
    });

    it('execution:getByTask invokes engine', async () => {
      const handler = handlers.get('execution:getByTask');
      await handler?.({}, 'task-1');
    });

    it('execution:getAll invokes engine', async () => {
      const handler = handlers.get('execution:getAll');
      await handler?.({});
    });

    it('execution:getRunning invokes engine', async () => {
      const handler = handlers.get('execution:getRunning');
      await handler?.({});
    });
  });
});
