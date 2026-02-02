import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WorkflowTemplateRepository } from './WorkflowTemplateRepository';

const makeRow = (overrides = {}) => ({
  id: 1,
  name: 'Test Template',
  description: 'desc',
  category: 'automation',
  nodes: '[]',
  edges: '[]',
  thumbnail: null,
  is_built_in: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const mockRun = vi.fn(() => ({ lastInsertRowid: 1, changes: 1 }));
const mockGet = vi.fn();
const mockAll = vi.fn(() => []);
const mockPrepare = vi.fn(() => ({ run: mockRun, get: mockGet, all: mockAll }));
const mockDb = { prepare: mockPrepare } as any;

describe('WorkflowTemplateRepository', () => {
  let repo: WorkflowTemplateRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new WorkflowTemplateRepository(mockDb);
  });

  describe('create', () => {
    it('inserts and returns template', () => {
      mockGet.mockReturnValue(makeRow());
      const result = repo.create({
        name: 'Test', description: 'desc', category: 'automation' as any,
        nodes: [], edges: [],
      });
      expect(result.name).toBe('Test Template');
    });
  });

  describe('findById', () => {
    it('returns template when found', () => {
      mockGet.mockReturnValue(makeRow());
      expect(repo.findById(1)?.name).toBe('Test Template');
    });

    it('returns null when not found', () => {
      mockGet.mockReturnValue(undefined);
      expect(repo.findById(999)).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all templates', () => {
      mockAll.mockReturnValue([makeRow()]);
      expect(repo.findAll()).toHaveLength(1);
    });
  });

  describe('findByCategory', () => {
    it('returns templates by category', () => {
      mockAll.mockReturnValue([makeRow()]);
      expect(repo.findByCategory('automation')).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates and returns template', () => {
      mockGet.mockReturnValue(makeRow({ name: 'Updated' }));
      const result = repo.update(1, { name: 'Updated' });
      expect(result?.name).toBe('Updated');
    });

    it('returns existing when no updates', () => {
      mockGet.mockReturnValue(makeRow());
      const result = repo.update(1, {});
      expect(result?.id).toBe(1);
    });
  });

  describe('delete', () => {
    it('deletes non-built-in template', () => {
      mockGet.mockReturnValue(makeRow());
      repo.delete(1);
      expect(mockRun).toHaveBeenCalled();
    });

    it('throws when deleting built-in', () => {
      mockGet.mockReturnValue(makeRow({ is_built_in: 1 }));
      expect(() => repo.delete(1)).toThrow('Cannot delete built-in');
    });
  });
});
