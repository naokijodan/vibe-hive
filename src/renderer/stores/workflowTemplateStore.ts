import { create } from 'zustand';
import type {
  WorkflowTemplate,
  TemplateCreateInput,
  TemplateUpdateInput,
  TemplateCategory,
} from '../../shared/types/template';
import ipcBridge from '../bridge/ipcBridge';

interface WorkflowTemplateState {
  templates: WorkflowTemplate[];
  selectedTemplateId: number | null;
  selectedCategory: TemplateCategory | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTemplates: () => Promise<void>;
  loadTemplatesByCategory: (category: TemplateCategory) => Promise<void>;
  createTemplate: (input: TemplateCreateInput) => Promise<WorkflowTemplate>;
  updateTemplate: (id: number, updates: TemplateUpdateInput) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;
  applyTemplate: (templateId: number, sessionId: number) => Promise<void>;
  setSelectedTemplate: (id: number | null) => void;
  setSelectedCategory: (category: TemplateCategory | null) => void;
  clearFilters: () => void;
}

export const useWorkflowTemplateStore = create<WorkflowTemplateState>((set, get) => {
  return {
    templates: [],
    selectedTemplateId: null,
    selectedCategory: null,
    isLoading: false,
    error: null,

    loadTemplates: async () => {
      set({ isLoading: true, error: null });
      try {
        const templates = await ipcBridge.workflowTemplate.getAll();
        set({ templates, isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load templates',
          isLoading: false,
        });
      }
    },

    loadTemplatesByCategory: async (category: TemplateCategory) => {
      set({ isLoading: true, error: null, selectedCategory: category });
      try {
        const templates = await ipcBridge.workflowTemplate.getByCategory(category);
        set({ templates, isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load templates by category',
          isLoading: false,
        });
      }
    },

    createTemplate: async (input: TemplateCreateInput) => {
      set({ isLoading: true, error: null });
      try {
        const template = await ipcBridge.workflowTemplate.create(input);
        set((state) => ({
          templates: [...state.templates, template],
          isLoading: false,
        }));
        return template;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create template',
          isLoading: false,
        });
        throw error;
      }
    },

    updateTemplate: async (id: number, updates: TemplateUpdateInput) => {
      set({ isLoading: true, error: null });
      try {
        const updatedTemplate = await ipcBridge.workflowTemplate.update(id, updates);
        if (updatedTemplate) {
          set((state) => ({
            templates: state.templates.map((t) => (t.id === id ? updatedTemplate : t)),
            isLoading: false,
          }));
        } else {
          set({ isLoading: false });
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update template',
          isLoading: false,
        });
        throw error;
      }
    },

    deleteTemplate: async (id: number) => {
      set({ isLoading: true, error: null });
      try {
        await ipcBridge.workflowTemplate.delete(id);
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          selectedTemplateId: state.selectedTemplateId === id ? null : state.selectedTemplateId,
          isLoading: false,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete template',
          isLoading: false,
        });
        throw error;
      }
    },

    applyTemplate: async (templateId: number, sessionId: number) => {
      set({ isLoading: true, error: null });
      try {
        await ipcBridge.workflowTemplate.apply(templateId, sessionId);
        set({ isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to apply template',
          isLoading: false,
        });
        throw error;
      }
    },

    setSelectedTemplate: (id: number | null) => {
      set({ selectedTemplateId: id });
    },

    setSelectedCategory: (category: TemplateCategory | null) => {
      set({ selectedCategory: category });
      if (category) {
        get().loadTemplatesByCategory(category);
      } else {
        get().loadTemplates();
      }
    },

    clearFilters: () => {
      set({ selectedCategory: null });
      get().loadTemplates();
    },
  };
});
