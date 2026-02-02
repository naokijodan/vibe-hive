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

import { SessionRepository } from './SessionRepository';

const makeSessionRow = (overrides = {}) => ({
  id: 'sess-1',
  name: 'Test Session',
  working_directory: '/tmp',
  agent_id: null,
  status: 'idle',
  is_active: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('SessionRepository', () => {
  let repo: SessionRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new SessionRepository();
  });

  describe('create', () => {
    it('inserts and returns session', () => {
      const row = makeSessionRow({ id: 'test-uuid' });
      mockGet.mockReturnValue(row);

      const session = repo.create({ name: 'Test Session', workingDirectory: '/tmp' });

      expect(mockPrepare).toHaveBeenCalled();
      expect(session.id).toBe('test-uuid');
      expect(session.name).toBe('Test Session');
    });
  });

  describe('getById', () => {
    it('returns session when found', () => {
      mockGet.mockReturnValue(makeSessionRow());

      const session = repo.getById('sess-1');

      expect(session?.id).toBe('sess-1');
      expect(session?.workingDirectory).toBe('/tmp');
    });

    it('returns null when not found', () => {
      mockGet.mockReturnValue(undefined);

      expect(repo.getById('bad')).toBeNull();
    });
  });

  describe('getAll', () => {
    it('returns all sessions', () => {
      mockAll.mockReturnValue([makeSessionRow()]);

      const sessions = repo.getAll();

      expect(sessions).toHaveLength(1);
    });
  });

  describe('getActive', () => {
    it('returns active session', () => {
      mockGet.mockReturnValue(makeSessionRow({ is_active: 1 }));

      const session = repo.getActive();

      expect(session).toBeTruthy();
    });

    it('returns null when no active', () => {
      mockGet.mockReturnValue(undefined);

      expect(repo.getActive()).toBeNull();
    });
  });

  describe('update', () => {
    it('updates fields and returns session', () => {
      mockGet.mockReturnValue(makeSessionRow({ name: 'Updated' }));

      const session = repo.update('sess-1', { name: 'Updated' });

      expect(mockRun).toHaveBeenCalled();
      expect(session.name).toBe('Updated');
    });
  });

  describe('updateStatus', () => {
    it('updates status', () => {
      mockGet.mockReturnValue(makeSessionRow({ status: 'running' }));

      const session = repo.updateStatus('sess-1', 'running' as any);

      expect(session.status).toBe('running');
    });
  });

  describe('setActive', () => {
    it('deactivates all then activates one', () => {
      repo.setActive('sess-1');

      // Two prepare calls: deactivate all, activate one
      expect(mockRun).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete', () => {
    it('deletes session', () => {
      repo.delete('sess-1');

      expect(mockRun).toHaveBeenCalled();
    });
  });
});
