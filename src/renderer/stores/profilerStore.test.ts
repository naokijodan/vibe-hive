import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockElectronAPI = {
  profilerGetSummary: vi.fn(),
  profilerGetTaskStats: vi.fn(),
  profilerGetSessionStats: vi.fn(),
  profilerGetTimeline: vi.fn(),
};

vi.stubGlobal('window', { electronAPI: mockElectronAPI });

import { useProfilerStore } from './profilerStore';

describe('profilerStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProfilerStore.setState({
      summary: null,
      taskStats: [],
      sessionStats: [],
      timeline: [],
      filter: {},
      isLoading: false,
      error: null,
    });
  });

  describe('setFilter', () => {
    it('merges partial filter into existing', () => {
      useProfilerStore.setState({ filter: { status: 'running' } as any });
      useProfilerStore.getState().setFilter({ limit: 10 } as any);
      expect(useProfilerStore.getState().filter).toEqual({ status: 'running', limit: 10 });
    });
  });

  describe('loadSummary', () => {
    it('loads summary', async () => {
      const summary = { totalTasks: 5 };
      mockElectronAPI.profilerGetSummary.mockResolvedValue(summary);

      await useProfilerStore.getState().loadSummary();

      expect(useProfilerStore.getState().summary).toEqual(summary);
      expect(useProfilerStore.getState().isLoading).toBe(false);
    });

    it('handles error', async () => {
      mockElectronAPI.profilerGetSummary.mockRejectedValue(new Error('fail'));

      await useProfilerStore.getState().loadSummary();

      expect(useProfilerStore.getState().error).toBe('fail');
      expect(useProfilerStore.getState().isLoading).toBe(false);
    });
  });

  describe('loadTaskStats', () => {
    it('loads task stats', async () => {
      const stats = [{ id: 1 }];
      mockElectronAPI.profilerGetTaskStats.mockResolvedValue(stats);

      await useProfilerStore.getState().loadTaskStats();

      expect(useProfilerStore.getState().taskStats).toEqual(stats);
    });

    it('handles error', async () => {
      mockElectronAPI.profilerGetTaskStats.mockRejectedValue(new Error('bad'));

      await useProfilerStore.getState().loadTaskStats();

      expect(useProfilerStore.getState().error).toBe('bad');
    });
  });

  describe('loadSessionStats', () => {
    it('loads session stats', async () => {
      mockElectronAPI.profilerGetSessionStats.mockResolvedValue([{ s: 1 }]);

      await useProfilerStore.getState().loadSessionStats();

      expect(useProfilerStore.getState().sessionStats).toEqual([{ s: 1 }]);
    });
  });

  describe('loadTimeline', () => {
    it('loads timeline', async () => {
      mockElectronAPI.profilerGetTimeline.mockResolvedValue([{ t: 1 }]);

      await useProfilerStore.getState().loadTimeline();

      expect(useProfilerStore.getState().timeline).toEqual([{ t: 1 }]);
    });
  });

  describe('refresh', () => {
    it('calls all load methods', async () => {
      mockElectronAPI.profilerGetSummary.mockResolvedValue({});
      mockElectronAPI.profilerGetTaskStats.mockResolvedValue([]);
      mockElectronAPI.profilerGetSessionStats.mockResolvedValue([]);
      mockElectronAPI.profilerGetTimeline.mockResolvedValue([]);

      await useProfilerStore.getState().refresh();

      expect(mockElectronAPI.profilerGetSummary).toHaveBeenCalled();
      expect(mockElectronAPI.profilerGetTaskStats).toHaveBeenCalled();
      expect(mockElectronAPI.profilerGetSessionStats).toHaveBeenCalled();
      expect(mockElectronAPI.profilerGetTimeline).toHaveBeenCalled();
    });
  });
});
