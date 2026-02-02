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
vi.mock('crypto', () => ({
  randomUUID: () => 'test-uuid',
}));

import { WorkflowRepository } from './WorkflowRepository';

const makeWfRow = (overrides = {}) => ({
  id: '1',
  session_id: '1',
  name: 'Test WF',
  description: null,
  nodes: '[]',
  edges: '[]',
  status: 'draft',
  auto_create_task: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const makeExecRow = (overrides = {}) => ({
  id: '1',
  workflow_id: '1',
  status: 'running',
  started_at: '2026-01-01T00:00:00.000Z',
  completed_at: null,
  error: null,
  execution_data: null,
  ...overrides,
});

describe('WorkflowRepository', () => {
  let repo: WorkflowRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new WorkflowRepository();
  });

  describe('create', () => {
    it('inserts and returns workflow', () => {
      mockGet.mockReturnValue(makeWfRow());
      const result = repo.create({ name: 'Test', sessionId: 1 } as any);
      expect(result.name).toBe('Test WF');
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('returns workflow when found', () => {
      mockGet.mockReturnValue(makeWfRow());
      const wf = repo.findById(1);
      expect(wf?.name).toBe('Test WF');
    });

    it('returns null when not found', () => {
      mockGet.mockReturnValue(undefined);
      expect(repo.findById(999)).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all workflows', () => {
      mockAll.mockReturnValue([makeWfRow()]);
      expect(repo.findAll()).toHaveLength(1);
    });
  });

  describe('findBySessionId', () => {
    it('returns workflows for session', () => {
      mockAll.mockReturnValue([makeWfRow()]);
      expect(repo.findBySessionId(1)).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates and returns workflow', () => {
      mockGet.mockReturnValue(makeWfRow({ name: 'Updated' }));
      const result = repo.update({ id: 1, name: 'Updated' } as any);
      expect(result.name).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('deletes workflow', () => {
      repo.delete(1);
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('createExecution', () => {
    it('creates execution', () => {
      mockGet.mockReturnValue(makeExecRow());
      const exec = repo.createExecution(1);
      expect(exec.workflowId).toBe(1);
      expect(exec.status).toBe('running');
    });
  });

  describe('updateExecution', () => {
    it('updates execution with completion', () => {
      mockGet.mockReturnValue(makeExecRow({ status: 'success', completed_at: '2026-01-01T01:00:00.000Z' }));
      const exec = repo.updateExecution(1, { status: 'success' });
      expect(exec.status).toBe('success');
    });
  });

  describe('findExecutionsByWorkflowId', () => {
    it('returns executions', () => {
      mockAll.mockReturnValue([makeExecRow()]);
      expect(repo.findExecutionsByWorkflowId(1)).toHaveLength(1);
    });
  });

  describe('findExecutionById', () => {
    it('returns execution when found', () => {
      mockGet.mockReturnValue(makeExecRow());
      expect(repo.findExecutionById(1)?.status).toBe('running');
    });

    it('returns null when not found', () => {
      mockGet.mockReturnValue(undefined);
      expect(repo.findExecutionById(999)).toBeNull();
    });
  });
});
