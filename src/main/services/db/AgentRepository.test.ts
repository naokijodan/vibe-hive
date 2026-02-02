import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRun, mockGet, mockAll, mockPrepare, mockRandomUUID } = vi.hoisted(() => {
  const mockRun = vi.fn(() => ({ changes: 1 }));
  const mockGet = vi.fn();
  const mockAll = vi.fn(() => []);

  return {
    mockRun,
    mockGet,
    mockAll,
    mockPrepare: vi.fn(() => ({ run: mockRun, get: mockGet, all: mockAll })),
    mockRandomUUID: vi.fn(() => 'test-uuid'),
  };
});

vi.mock('./Database', () => ({
  getDatabase: () => ({ prepare: mockPrepare }),
}));

vi.mock('crypto', () => ({
  randomUUID: mockRandomUUID,
}));

import { AgentRepository } from './AgentRepository';

const makeAgentRow = (overrides = {}) => ({
  id: 'agent-1',
  name: 'Test Agent',
  role: 'coder',
  status: 'idle',
  session_id: null,
  parent_agent_id: null,
  capabilities: null,
  created_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('AgentRepository', () => {
  let repo: AgentRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new AgentRepository();
    // Default: child query returns empty
    mockAll.mockReturnValue([]);
  });

  describe('create', () => {
    it('inserts and returns agent', () => {
      const row = makeAgentRow({ id: 'test-uuid' });
      mockGet.mockReturnValue(row);

      const agent = repo.create({ name: 'Test Agent', role: 'coder' } as any);

      expect(agent.id).toBe('test-uuid');
      expect(agent.name).toBe('Test Agent');
    });
  });

  describe('getById', () => {
    it('returns agent when found', () => {
      mockGet.mockReturnValue(makeAgentRow());

      const agent = repo.getById('agent-1');

      expect(agent?.id).toBe('agent-1');
      expect(agent?.role).toBe('coder');
    });

    it('returns null when not found', () => {
      mockGet.mockReturnValue(undefined);

      expect(repo.getById('bad')).toBeNull();
    });

    it('parses capabilities JSON', () => {
      mockGet.mockReturnValue(makeAgentRow({ capabilities: '["code","test"]' }));

      const agent = repo.getById('agent-1');

      expect(agent?.capabilities).toEqual(['code', 'test']);
    });

    it('includes child agent ids', () => {
      mockGet.mockReturnValue(makeAgentRow());
      mockAll.mockReturnValue([{ id: 'child-1' }]);

      const agent = repo.getById('agent-1');

      expect(agent?.childAgentIds).toEqual(['child-1']);
    });
  });

  describe('getAll', () => {
    it('returns all agents', () => {
      // First call for getAll, subsequent for rowToAgent child queries
      mockAll
        .mockReturnValueOnce([makeAgentRow()])
        .mockReturnValue([]);

      const agents = repo.getAll();

      expect(agents).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates and returns agent', () => {
      mockGet
        .mockReturnValueOnce(makeAgentRow()) // first getById to check exists
        .mockReturnValueOnce(makeAgentRow({ name: 'Updated' })); // second getById after update
      mockAll.mockReturnValue([]);

      const agent = repo.update('agent-1', { name: 'Updated' });

      expect(agent?.name).toBe('Updated');
    });

    it('returns null when agent not found', () => {
      mockGet.mockReturnValue(undefined);

      expect(repo.update('bad', { name: 'x' })).toBeNull();
    });
  });

  describe('delete', () => {
    it('returns true when deleted', () => {
      mockRun.mockReturnValue({ changes: 1 });

      expect(repo.delete('agent-1')).toBe(true);
    });

    it('returns false when not found', () => {
      mockRun.mockReturnValue({ changes: 0 });

      expect(repo.delete('bad')).toBe(false);
    });
  });
});
