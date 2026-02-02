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
});
