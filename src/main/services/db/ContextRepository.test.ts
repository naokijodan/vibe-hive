import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRun, mockGet, mockAll, mockPrepare } = vi.hoisted(() => {
  const mockRun = vi.fn(() => ({ changes: 1 }));
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

import { save, getById, getByNode, getBySession, getChain, deleteById } from './ContextRepository';

const makeRow = (overrides = {}) => ({
  id: 'ctx-1',
  org_node_id: 'node-1',
  session_id: 'sess-1',
  context_type: 'output',
  data_format: 'text',
  content: 'hello',
  parent_context_id: '',
  created_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('ContextRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('save', () => {
    it('inserts and returns context', () => {
      const result = save({
        orgNodeId: 'node-1',
        sessionId: 'sess-1',
        contextType: 'output' as any,
        dataFormat: 'text' as any,
        content: 'hello',
      });

      expect(result.orgNodeId).toBe('node-1');
      expect(result.id).toBeTruthy();
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('returns context when found', () => {
      mockGet.mockReturnValue(makeRow());
      const ctx = getById('ctx-1');
      expect(ctx?.id).toBe('ctx-1');
      expect(ctx?.content).toBe('hello');
    });

    it('returns null when not found', () => {
      mockGet.mockReturnValue(undefined);
      expect(getById('bad')).toBeNull();
    });
  });

  describe('getByNode', () => {
    it('returns contexts for node', () => {
      mockAll.mockReturnValue([makeRow()]);
      expect(getByNode('node-1')).toHaveLength(1);
    });
  });

  describe('getBySession', () => {
    it('returns contexts for session', () => {
      mockAll.mockReturnValue([makeRow()]);
      expect(getBySession('sess-1')).toHaveLength(1);
    });
  });

  describe('getChain', () => {
    it('returns chain of contexts', () => {
      mockGet
        .mockReturnValueOnce(makeRow({ id: 'ctx-2', parent_context_id: 'ctx-1' }))
        .mockReturnValueOnce(makeRow({ id: 'ctx-1', parent_context_id: '' }));

      const chain = getChain('ctx-2');
      expect(chain).toHaveLength(2);
      expect(chain[0].id).toBe('ctx-1');
    });

    it('returns empty when not found', () => {
      mockGet.mockReturnValue(undefined);
      expect(getChain('bad')).toHaveLength(0);
    });
  });

  describe('deleteById', () => {
    it('returns true when deleted', () => {
      mockRun.mockReturnValue({ changes: 1 });
      expect(deleteById('ctx-1')).toBe(true);
    });

    it('returns false when not found', () => {
      mockRun.mockReturnValue({ changes: 0 });
      expect(deleteById('bad')).toBe(false);
    });
  });
});
