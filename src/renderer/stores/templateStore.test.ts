import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockTaskTemplate } = vi.hoisted(() => ({
  mockTaskTemplate: {
    getAll: vi.fn(),
    getByCategory: vi.fn(),
    getPopular: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: vi.fn(),
    incrementUsage: vi.fn(),
  },
}));

vi.mock('../bridge/ipcBridge', () => ({
  default: { taskTemplate: mockTaskTemplate },
}));

import { useTemplateStore } from './templateStore';

const makeMockTemplate = (overrides = {}) => ({
  id: 'tmpl-1',
  name: 'Test Template',
  description: 'A test template',
  category: 'general',
  usageCount: 0,
  ...overrides,
});

describe('templateStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTemplateStore.setState({
      templates: [],
      selectedTemplateId: null,
      selectedCategory: null,
      searchQuery: '',
      isLoading: false,
      error: null,
    });
  });

  describe('loadTemplates', () => {
    it('loads all templates', async () => {
      const templates = [makeMockTemplate()];
      mockTaskTemplate.getAll.mockResolvedValue(templates);

      await useTemplateStore.getState().loadTemplates();

      expect(useTemplateStore.getState().templates).toEqual(templates);
      expect(useTemplateStore.getState().isLoading).toBe(false);
    });

    it('handles error', async () => {
      mockTaskTemplate.getAll.mockRejectedValue(new Error('DB error'));

      await useTemplateStore.getState().loadTemplates();

      expect(useTemplateStore.getState().error).toBe('DB error');
    });
  });

  describe('loadTemplatesByCategory', () => {
    it('loads by category and sets selectedCategory', async () => {
      mockTaskTemplate.getByCategory.mockResolvedValue([makeMockTemplate()]);

      await useTemplateStore.getState().loadTemplatesByCategory('automation');

      expect(useTemplateStore.getState().selectedCategory).toBe('automation');
      expect(mockTaskTemplate.getByCategory).toHaveBeenCalledWith('automation');
    });
  });

  describe('loadPopularTemplates', () => {
    it('loads popular templates with limit', async () => {
      mockTaskTemplate.getPopular.mockResolvedValue([]);

      await useTemplateStore.getState().loadPopularTemplates(5);

      expect(mockTaskTemplate.getPopular).toHaveBeenCalledWith(5);
    });
  });

  describe('createTemplate', () => {
    it('creates and adds template', async () => {
      const newTmpl = makeMockTemplate({ id: 'tmpl-new' });
      mockTaskTemplate.create.mockResolvedValue(newTmpl);

      const result = await useTemplateStore.getState().createTemplate({
        name: 'New',
        description: 'desc',
      } as any);

      expect(result).toEqual(newTmpl);
      expect(useTemplateStore.getState().templates).toHaveLength(1);
    });

    it('throws on error', async () => {
      mockTaskTemplate.create.mockRejectedValue(new Error('fail'));

      await expect(
        useTemplateStore.getState().createTemplate({ name: 'x' } as any)
      ).rejects.toThrow();
    });
  });

  describe('updateTemplate', () => {
    it('updates template in state', async () => {
      useTemplateStore.setState({ templates: [makeMockTemplate()] as any });
      const updated = makeMockTemplate({ name: 'Updated' });
      mockTaskTemplate.update.mockResolvedValue(updated);

      await useTemplateStore.getState().updateTemplate('tmpl-1', { name: 'Updated' } as any);

      expect(useTemplateStore.getState().templates[0].name).toBe('Updated');
    });
  });

  describe('deleteTemplate', () => {
    it('removes template from state', async () => {
      useTemplateStore.setState({ templates: [makeMockTemplate()] as any });
      mockTaskTemplate.delete.mockResolvedValue(undefined);

      await useTemplateStore.getState().deleteTemplate('tmpl-1');

      expect(useTemplateStore.getState().templates).toHaveLength(0);
    });

    it('clears selectedTemplateId if deleted', async () => {
      useTemplateStore.setState({
        templates: [makeMockTemplate()] as any,
        selectedTemplateId: 'tmpl-1',
      });
      mockTaskTemplate.delete.mockResolvedValue(undefined);

      await useTemplateStore.getState().deleteTemplate('tmpl-1');

      expect(useTemplateStore.getState().selectedTemplateId).toBeNull();
    });
  });

  describe('searchTemplates', () => {
    it('searches and updates state', async () => {
      mockTaskTemplate.search.mockResolvedValue([makeMockTemplate()]);

      await useTemplateStore.getState().searchTemplates('test');

      expect(useTemplateStore.getState().searchQuery).toBe('test');
      expect(mockTaskTemplate.search).toHaveBeenCalledWith('test');
    });
  });

  describe('setSelectedTemplate', () => {
    it('sets selected template', () => {
      useTemplateStore.getState().setSelectedTemplate('tmpl-1');
      expect(useTemplateStore.getState().selectedTemplateId).toBe('tmpl-1');
    });
  });

  describe('incrementUsageCount', () => {
    it('increments and reloads (no filters)', async () => {
      mockTaskTemplate.incrementUsage.mockResolvedValue(undefined);
      mockTaskTemplate.getAll.mockResolvedValue([makeMockTemplate({ usageCount: 1 })]);

      await useTemplateStore.getState().incrementUsageCount('tmpl-1');

      expect(mockTaskTemplate.incrementUsage).toHaveBeenCalledWith('tmpl-1');
      expect(mockTaskTemplate.getAll).toHaveBeenCalled();
    });

    it('reloads by category when selectedCategory set', async () => {
      useTemplateStore.setState({ selectedCategory: 'automation' });
      mockTaskTemplate.incrementUsage.mockResolvedValue(undefined);
      mockTaskTemplate.getByCategory.mockResolvedValue([]);

      await useTemplateStore.getState().incrementUsageCount('tmpl-1');

      expect(mockTaskTemplate.getByCategory).toHaveBeenCalledWith('automation');
    });

    it('reloads by search when searchQuery set', async () => {
      useTemplateStore.setState({ searchQuery: 'test' });
      mockTaskTemplate.incrementUsage.mockResolvedValue(undefined);
      mockTaskTemplate.search.mockResolvedValue([]);

      await useTemplateStore.getState().incrementUsageCount('tmpl-1');

      expect(mockTaskTemplate.search).toHaveBeenCalledWith('test');
    });

    it('handles error silently', async () => {
      mockTaskTemplate.incrementUsage.mockRejectedValue(new Error('fail'));

      await useTemplateStore.getState().incrementUsageCount('tmpl-1');
      // Should not throw
    });
  });

  describe('setSelectedCategory', () => {
    it('sets category and loads by category', async () => {
      mockTaskTemplate.getByCategory.mockResolvedValue([]);

      useTemplateStore.getState().setSelectedCategory('automation');

      expect(useTemplateStore.getState().selectedCategory).toBe('automation');
    });

    it('clears category and loads all', async () => {
      mockTaskTemplate.getAll.mockResolvedValue([]);

      useTemplateStore.getState().setSelectedCategory(null);

      expect(useTemplateStore.getState().selectedCategory).toBeNull();
    });
  });

  describe('setSearchQuery', () => {
    it('sets query and searches', async () => {
      mockTaskTemplate.search.mockResolvedValue([]);

      useTemplateStore.getState().setSearchQuery('hello');

      expect(useTemplateStore.getState().searchQuery).toBe('hello');
    });

    it('clears query and loads all', async () => {
      mockTaskTemplate.getAll.mockResolvedValue([]);

      useTemplateStore.getState().setSearchQuery('');

      expect(useTemplateStore.getState().searchQuery).toBe('');
    });
  });

  describe('clearFilters', () => {
    it('resets category and search', async () => {
      mockTaskTemplate.getAll.mockResolvedValue([]);
      useTemplateStore.setState({ selectedCategory: 'cat', searchQuery: 'q' });

      useTemplateStore.getState().clearFilters();

      expect(useTemplateStore.getState().selectedCategory).toBeNull();
      expect(useTemplateStore.getState().searchQuery).toBe('');
    });
  });
});
