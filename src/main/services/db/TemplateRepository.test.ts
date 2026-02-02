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

import { TemplateRepository } from './TemplateRepository';

const makeRow = (overrides = {}) => ({
  id: 'tmpl-1',
  name: 'Test Template',
  description: 'desc',
  category: 'general',
  task_data: '{"command":"echo hi"}',
  subtasks: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  usage_count: 0,
  ...overrides,
});

describe('TemplateRepository', () => {
  let repo: TemplateRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new TemplateRepository();
  });

  describe('create', () => {
    it('inserts and returns template', () => {
      mockGet.mockReturnValue(makeRow({ id: 'test-uuid' }));
      const result = repo.create({ name: 'Test', taskData: { command: 'echo' } } as any);
      expect(result.id).toBe('test-uuid');
    });
  });

  describe('getById', () => {
    it('returns template when found', () => {
      mockGet.mockReturnValue(makeRow());
      const tmpl = repo.getById('tmpl-1');
      expect(tmpl?.name).toBe('Test Template');
      expect(tmpl?.taskData).toEqual({ command: 'echo hi' });
    });

    it('returns null when not found', () => {
      mockGet.mockReturnValue(undefined);
      expect(repo.getById('bad')).toBeNull();
    });

    it('parses subtasks JSON', () => {
      mockGet.mockReturnValue(makeRow({ subtasks: '[{"name":"sub1"}]' }));
      expect(repo.getById('tmpl-1')?.subtasks).toEqual([{ name: 'sub1' }]);
    });
  });

  describe('getAll', () => {
    it('returns all templates', () => {
      mockAll.mockReturnValue([makeRow()]);
      expect(repo.getAll()).toHaveLength(1);
    });
  });

  describe('getByCategory', () => {
    it('returns templates by category', () => {
      mockAll.mockReturnValue([makeRow()]);
      expect(repo.getByCategory('general')).toHaveLength(1);
    });
  });

  describe('getPopular', () => {
    it('returns popular templates with limit', () => {
      mockAll.mockReturnValue([makeRow()]);
      expect(repo.getPopular(5)).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates and returns template', () => {
      mockGet
        .mockReturnValueOnce(makeRow()) // existing check
        .mockReturnValueOnce(makeRow({ name: 'Updated' })); // after update
      const result = repo.update('tmpl-1', { name: 'Updated' });
      expect(result?.name).toBe('Updated');
    });

    it('returns null when not found', () => {
      mockGet.mockReturnValue(undefined);
      expect(repo.update('bad', { name: 'x' })).toBeNull();
    });

    it('returns existing when no updates', () => {
      mockGet.mockReturnValue(makeRow());
      const result = repo.update('tmpl-1', {});
      expect(result?.id).toBe('tmpl-1');
      // run should not be called for UPDATE
    });
  });

  describe('incrementUsageCount', () => {
    it('increments usage', () => {
      repo.incrementUsageCount('tmpl-1');
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes template', () => {
      repo.delete('tmpl-1');
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('searches templates', () => {
      mockAll.mockReturnValue([makeRow()]);
      expect(repo.search('test')).toHaveLength(1);
    });
  });
});
