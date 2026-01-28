import { create } from 'zustand';
import type {
  TaskTemplate,
  TaskTemplateCreateInput,
  TaskTemplateUpdateInput,
} from '../../shared/types/taskTemplate';
import ipcBridge from '../bridge/ipcBridge';

interface TemplateState {
  templates: TaskTemplate[];
  selectedTemplateId: string | null;
  selectedCategory: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTemplates: () => Promise<void>;
  loadTemplatesByCategory: (category: string) => Promise<void>;
  loadPopularTemplates: (limit?: number) => Promise<void>;
  createTemplate: (input: TaskTemplateCreateInput) => Promise<TaskTemplate>;
  updateTemplate: (id: string, updates: TaskTemplateUpdateInput) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  searchTemplates: (query: string) => Promise<void>;
  incrementUsageCount: (id: string) => Promise<void>;
  setSelectedTemplate: (id: string | null) => void;
  setSelectedCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => {
  return {
    templates: [],
    selectedTemplateId: null,
    selectedCategory: null,
    searchQuery: '',
    isLoading: false,
    error: null,

    loadTemplates: async () => {
      set({ isLoading: true, error: null });
      try {
        const templates = await ipcBridge.template.getAll();
        set({ templates, isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load templates',
          isLoading: false,
        });
      }
    },

    loadTemplatesByCategory: async (category: string) => {
      set({ isLoading: true, error: null, selectedCategory: category });
      try {
        const templates = await ipcBridge.template.getByCategory(category);
        set({ templates, isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load templates by category',
          isLoading: false,
        });
      }
    },

    loadPopularTemplates: async (limit?: number) => {
      set({ isLoading: true, error: null });
      try {
        const templates = await ipcBridge.template.getPopular(limit);
        set({ templates, isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load popular templates',
          isLoading: false,
        });
      }
    },

    createTemplate: async (input: TaskTemplateCreateInput) => {
      set({ isLoading: true, error: null });
      try {
        const template = await ipcBridge.template.create(input);
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

    updateTemplate: async (id: string, updates: TaskTemplateUpdateInput) => {
      set({ isLoading: true, error: null });
      try {
        const updatedTemplate = await ipcBridge.template.update(id, updates);
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

    deleteTemplate: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await ipcBridge.template.delete(id);
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

    searchTemplates: async (query: string) => {
      set({ isLoading: true, error: null, searchQuery: query });
      try {
        const templates = await ipcBridge.template.search(query);
        set({ templates, isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to search templates',
          isLoading: false,
        });
      }
    },

    incrementUsageCount: async (id: string) => {
      try {
        await ipcBridge.template.incrementUsage(id);
        // Reload templates to get updated usage count
        const state = get();
        if (state.selectedCategory) {
          await get().loadTemplatesByCategory(state.selectedCategory);
        } else if (state.searchQuery) {
          await get().searchTemplates(state.searchQuery);
        } else {
          await get().loadTemplates();
        }
      } catch (error) {
        console.error('Failed to increment usage count:', error);
      }
    },

    setSelectedTemplate: (id: string | null) => {
      set({ selectedTemplateId: id });
    },

    setSelectedCategory: (category: string | null) => {
      set({ selectedCategory: category });
      if (category) {
        get().loadTemplatesByCategory(category);
      } else {
        get().loadTemplates();
      }
    },

    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
      if (query) {
        get().searchTemplates(query);
      } else {
        get().loadTemplates();
      }
    },

    clearFilters: () => {
      set({ selectedCategory: null, searchQuery: '' });
      get().loadTemplates();
    },
  };
});
