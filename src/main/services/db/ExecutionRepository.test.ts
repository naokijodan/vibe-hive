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

import { ExecutionRepository } from './ExecutionRepository';

const makeRow = (overrides = {}) => ({
  id: 'exec-1',
  task_id: 'task-1',
  session_id: 'sess-1',
  status: 'running',
  started_at: '2026-01-01T00:00:00.000Z',
  completed_at: null,
  exit_code: null,
  error_message: null,
  ...overrides,
});

describe('ExecutionRepository', () => {
  let repo: ExecutionRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new ExecutionRepository();
  });

  describe('create', () => {
    it('inserts and returns execution', () => {
      mockGet.mockReturnValue(makeRow());
      const exec = {
        id: 'exec-1', taskId: 'task-1', sessionId: 'sess-1',
        status: 'running' as const, startedAt: new Date(),
      };
      const result = repo.create(exec);
      expect(result.id).toBe('exec-1');
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('returns execution when found', () => {
      mockGet.mockReturnValue(makeRow());
      expect(repo.getById('exec-1')?.taskId).toBe('task-1');
    });

    it('returns null when not found', () => {
      mockGet.mockReturnValue(undefined);
      expect(repo.getById('bad')).toBeNull();
    });

    it('maps completedAt when present', () => {
      mockGet.mockReturnValue(makeRow({ completed_at: '2026-01-01T01:00:00.000Z', exit_code: 0 }));
      const exec = repo.getById('exec-1');
      expect(exec?.completedAt).toBeInstanceOf(Date);
      expect(exec?.exitCode).toBe(0);
    });
  });

  describe('getAll', () => {
    it('returns all executions', () => {
      mockAll.mockReturnValue([makeRow()]);
      expect(repo.getAll()).toHaveLength(1);
    });
  });

  describe('getByTaskId', () => {
    it('returns executions for task', () => {
      mockAll.mockReturnValue([makeRow()]);
      expect(repo.getByTaskId('task-1')).toHaveLength(1);
    });
  });

  describe('getRunning', () => {
    it('returns running executions', () => {
      mockAll.mockReturnValue([makeRow()]);
      expect(repo.getRunning()).toHaveLength(1);
    });
  });

  describe('updateStatus', () => {
    it('updates status', () => {
      repo.updateStatus('exec-1', 'completed' as any);
      expect(mockRun).toHaveBeenCalledWith('completed', 'exec-1');
    });
  });

  describe('updateCompletion', () => {
    it('updates completion data', () => {
      repo.updateCompletion('exec-1', new Date(), 0);
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('updateError', () => {
    it('updates error message', () => {
      repo.updateError('exec-1', 'something failed');
      expect(mockRun).toHaveBeenCalledWith('something failed', 'exec-1');
    });
  });

  describe('delete', () => {
    it('deletes execution', () => {
      repo.delete('exec-1');
      expect(mockRun).toHaveBeenCalled();
    });
  });
});
