import { create } from 'zustand';
import type {
  ProfilerSummary,
  ProfilerFilter,
  TaskStats,
  SessionStats,
  TimelineEntry,
} from '../../shared/types/profiler';

interface ProfilerState {
  summary: ProfilerSummary | null;
  taskStats: TaskStats[];
  sessionStats: SessionStats[];
  timeline: TimelineEntry[];
  filter: ProfilerFilter;
  isLoading: boolean;
  error: string | null;

  setFilter: (filter: Partial<ProfilerFilter>) => void;
  loadSummary: () => Promise<void>;
  loadTaskStats: () => Promise<void>;
  loadSessionStats: () => Promise<void>;
  loadTimeline: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useProfilerStore = create<ProfilerState>((set, get) => ({
  summary: null,
  taskStats: [],
  sessionStats: [],
  timeline: [],
  filter: {},
  isLoading: false,
  error: null,

  setFilter: (partial) => {
    set((state) => ({ filter: { ...state.filter, ...partial } }));
  },

  loadSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const summary = await window.electronAPI.profilerGetSummary(get().filter) as ProfilerSummary;
      set({ summary, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
    }
  },

  loadTaskStats: async () => {
    try {
      const taskStats = await window.electronAPI.profilerGetTaskStats(get().filter) as TaskStats[];
      set({ taskStats });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  loadSessionStats: async () => {
    try {
      const sessionStats = await window.electronAPI.profilerGetSessionStats() as SessionStats[];
      set({ sessionStats });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  loadTimeline: async () => {
    try {
      const timeline = await window.electronAPI.profilerGetTimeline(get().filter) as TimelineEntry[];
      set({ timeline });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  refresh: async () => {
    const state = get();
    await Promise.all([
      state.loadSummary(),
      state.loadTaskStats(),
      state.loadSessionStats(),
      state.loadTimeline(),
    ]);
  },
}));
