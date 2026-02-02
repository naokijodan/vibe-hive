import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRun, mockGet, mockAll, mockPrepare } = vi.hoisted(() => {
  const mockRun = vi.fn(() => ({ changes: 5 }));
  const mockGet = vi.fn();
  const mockAll = vi.fn(() => []);
  return {
    mockRun, mockGet, mockAll,
    mockPrepare: vi.fn(() => ({ run: mockRun, get: mockGet, all: mockAll })),
  };
});

vi.mock('./Database', () => ({
  getDatabase: () => ({ prepare: mockPrepare }),
}));

import { TerminalLogRepository } from './TerminalLogRepository';

const makeRow = (overrides = {}) => ({
  id: 1,
  session_id: 'sess-1',
  data: 'output line',
  timestamp: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('TerminalLogRepository', () => {
  let repo: TerminalLogRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new TerminalLogRepository();
  });

  describe('append', () => {
    it('inserts log entry', () => {
      repo.append('sess-1', 'hello');
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('getBySessionId', () => {
    it('returns logs reversed', () => {
      mockAll.mockReturnValue([makeRow({ id: 2 }), makeRow({ id: 1 })]);
      const logs = repo.getBySessionId('sess-1');
      expect(logs).toHaveLength(2);
      expect(logs[0].id).toBe(1); // reversed
    });
  });

  describe('getRecentBySessionId', () => {
    it('returns recent logs', () => {
      mockAll.mockReturnValue([makeRow()]);
      const logs = repo.getRecentBySessionId('sess-1', new Date('2025-12-31'));
      expect(logs).toHaveLength(1);
    });
  });

  describe('deleteBySessionId', () => {
    it('returns number of deleted rows', () => {
      mockRun.mockReturnValue({ changes: 3 });
      expect(repo.deleteBySessionId('sess-1')).toBe(3);
    });
  });

  describe('cleanup', () => {
    it('returns number of cleaned rows', () => {
      mockRun.mockReturnValue({ changes: 10 });
      expect(repo.cleanup(new Date('2025-01-01'))).toBe(10);
    });
  });

  describe('getSessionLogSize', () => {
    it('returns size', () => {
      mockGet.mockReturnValue({ size: 1024 });
      expect(repo.getSessionLogSize('sess-1')).toBe(1024);
    });

    it('returns 0 when null', () => {
      mockGet.mockReturnValue({ size: null });
      expect(repo.getSessionLogSize('sess-1')).toBe(0);
    });
  });
});
