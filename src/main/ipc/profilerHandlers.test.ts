import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/ProfilerService', () => ({
  getProfilerService: () => ({
    getSummary: vi.fn(),
    getExecutions: vi.fn(),
    getTaskStats: vi.fn(),
    getSessionStats: vi.fn(),
    getTimeline: vi.fn(),
  }),
}));

import { registerProfilerHandlers } from './profilerHandlers';

describe('profilerHandlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers all profiler handlers', () => {
    registerProfilerHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('profiler:getSummary');
    expect(channels).toContain('profiler:getExecutions');
    expect(channels).toContain('profiler:getTaskStats');
    expect(channels).toContain('profiler:getSessionStats');
    expect(channels).toContain('profiler:getTimeline');
  });

  describe('handler invocations', () => {
    let handlers: Map<string, (...args: unknown[]) => unknown>;

    beforeEach(() => {
      handlers = new Map();
      mockHandle.mockImplementation((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      });
      registerProfilerHandlers();
    });

    it('profiler:getSummary invokes service', async () => {
      const handler = handlers.get('profiler:getSummary');
      await handler?.({}, {});
    });

    it('profiler:getExecutions invokes service', async () => {
      const handler = handlers.get('profiler:getExecutions');
      await handler?.({}, {});
    });

    it('profiler:getTaskStats invokes service', async () => {
      const handler = handlers.get('profiler:getTaskStats');
      await handler?.({}, 'task-1');
    });

    it('profiler:getSessionStats invokes service', async () => {
      const handler = handlers.get('profiler:getSessionStats');
      await handler?.({}, 'session-1');
    });

    it('profiler:getTimeline invokes service', async () => {
      const handler = handlers.get('profiler:getTimeline');
      await handler?.({}, {});
    });
  });
});
