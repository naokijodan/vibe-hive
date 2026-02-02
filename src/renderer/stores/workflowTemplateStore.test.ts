import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockWorkflowTemplate } = vi.hoisted(() => ({
  mockWorkflowTemplate: {
    getAll: vi.fn(),
    getByCategory: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    apply: vi.fn(),
  },
}));

vi.mock('../bridge/ipcBridge', () => ({
  default: { workflowTemplate: mockWorkflowTemplate },
}));

import { useWorkflowTemplateStore } from './workflowTemplateStore';

const makeMockTemplate = (overrides = {}) => ({
  id: 1,
  name: 'Test WF Template',
  description: 'desc',
  category: 'automation',
  ...overrides,
});

describe('workflowTemplateStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkflowTemplateStore.setState({
      templates: [],
      selectedTemplateId: null,
      selectedCategory: null,
      isLoading: false,
      error: null,
    });
  });

  describe('loadTemplates', () => {
    it('loads all templates', async () => {
      const templates = [makeMockTemplate()];
      mockWorkflowTemplate.getAll.mockResolvedValue(templates);

      await useWorkflowTemplateStore.getState().loadTemplates();

      expect(useWorkflowTemplateStore.getState().templates).toEqual(templates);
      expect(useWorkflowTemplateStore.getState().isLoading).toBe(false);
    });

    it('handles error', async () => {
      mockWorkflowTemplate.getAll.mockRejectedValue(new Error('DB err'));

      await useWorkflowTemplateStore.getState().loadTemplates();

      expect(useWorkflowTemplateStore.getState().error).toBeTruthy();
    });
  });

  describe('loadTemplatesByCategory', () => {
    it('loads by category', async () => {
      mockWorkflowTemplate.getByCategory.mockResolvedValue([makeMockTemplate()]);

      await useWorkflowTemplateStore.getState().loadTemplatesByCategory('automation' as any);

      expect(useWorkflowTemplateStore.getState().selectedCategory).toBe('automation');
      expect(mockWorkflowTemplate.getByCategory).toHaveBeenCalledWith('automation');
    });
  });

  describe('createTemplate', () => {
    it('creates and adds template', async () => {
      const newTmpl = makeMockTemplate({ id: 2 });
      mockWorkflowTemplate.create.mockResolvedValue(newTmpl);

      const result = await useWorkflowTemplateStore.getState().createTemplate({
        name: 'New',
      } as any);

      expect(result).toEqual(newTmpl);
      expect(useWorkflowTemplateStore.getState().templates).toHaveLength(1);
    });

    it('throws on error', async () => {
      mockWorkflowTemplate.create.mockRejectedValue(new Error('fail'));

      await expect(
        useWorkflowTemplateStore.getState().createTemplate({ name: 'x' } as any)
      ).rejects.toThrow();
    });
  });

  describe('updateTemplate', () => {
    it('updates template in state', async () => {
      useWorkflowTemplateStore.setState({ templates: [makeMockTemplate()] as any });
      const updated = makeMockTemplate({ name: 'Updated' });
      mockWorkflowTemplate.update.mockResolvedValue(updated);

      await useWorkflowTemplateStore.getState().updateTemplate(1, { name: 'Updated' } as any);

      expect(useWorkflowTemplateStore.getState().templates[0].name).toBe('Updated');
    });

    it('handles null return', async () => {
      useWorkflowTemplateStore.setState({ templates: [makeMockTemplate()] as any });
      mockWorkflowTemplate.update.mockResolvedValue(null);

      await useWorkflowTemplateStore.getState().updateTemplate(1, { name: 'x' } as any);

      expect(useWorkflowTemplateStore.getState().isLoading).toBe(false);
    });
  });

  describe('deleteTemplate', () => {
    it('removes template from state', async () => {
      useWorkflowTemplateStore.setState({ templates: [makeMockTemplate()] as any });
      mockWorkflowTemplate.delete.mockResolvedValue(undefined);

      await useWorkflowTemplateStore.getState().deleteTemplate(1);

      expect(useWorkflowTemplateStore.getState().templates).toHaveLength(0);
    });

    it('clears selectedTemplateId if deleted', async () => {
      useWorkflowTemplateStore.setState({
        templates: [makeMockTemplate()] as any,
        selectedTemplateId: 1,
      });
      mockWorkflowTemplate.delete.mockResolvedValue(undefined);

      await useWorkflowTemplateStore.getState().deleteTemplate(1);

      expect(useWorkflowTemplateStore.getState().selectedTemplateId).toBeNull();
    });
  });

  describe('applyTemplate', () => {
    it('applies template to session', async () => {
      mockWorkflowTemplate.apply.mockResolvedValue(undefined);

      await useWorkflowTemplateStore.getState().applyTemplate(1, 10);

      expect(mockWorkflowTemplate.apply).toHaveBeenCalledWith(1, 10);
      expect(useWorkflowTemplateStore.getState().isLoading).toBe(false);
    });

    it('throws on error', async () => {
      mockWorkflowTemplate.apply.mockRejectedValue(new Error('fail'));

      await expect(
        useWorkflowTemplateStore.getState().applyTemplate(1, 10)
      ).rejects.toThrow();
    });
  });

  describe('setSelectedTemplate', () => {
    it('sets selected template', () => {
      useWorkflowTemplateStore.getState().setSelectedTemplate(1);
      expect(useWorkflowTemplateStore.getState().selectedTemplateId).toBe(1);
    });
  });

  describe('clearFilters', () => {
    it('resets category and reloads', async () => {
      mockWorkflowTemplate.getAll.mockResolvedValue([]);
      useWorkflowTemplateStore.setState({ selectedCategory: 'cat' as any });

      useWorkflowTemplateStore.getState().clearFilters();

      expect(useWorkflowTemplateStore.getState().selectedCategory).toBeNull();
    });
  });
});
