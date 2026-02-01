import { create } from 'zustand';
import type { PluginInfo } from '../../shared/types/plugin';

interface PluginState {
  plugins: PluginInfo[];
  pluginsDir: string;
  isLoading: boolean;
  error: string | null;

  loadPlugins: () => Promise<void>;
  activatePlugin: (pluginId: string) => Promise<{ success: boolean; error?: string }>;
  deactivatePlugin: (pluginId: string) => Promise<{ success: boolean; error?: string }>;
  updateSetting: (pluginId: string, key: string, value: unknown) => Promise<void>;
  refreshPlugins: () => Promise<void>;
  loadPluginsDir: () => Promise<void>;
}

export const usePluginStore = create<PluginState>((set) => ({
  plugins: [],
  pluginsDir: '',
  isLoading: false,
  error: null,

  loadPlugins: async () => {
    set({ isLoading: true, error: null });
    try {
      const plugins = await window.electronAPI.pluginList() as PluginInfo[];
      set({ plugins, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
    }
  },

  activatePlugin: async (pluginId: string) => {
    try {
      const result = await window.electronAPI.pluginActivate(pluginId) as { success: boolean; error?: string };
      if (result.success) {
        const plugins = await window.electronAPI.pluginList() as PluginInfo[];
        set({ plugins });
      }
      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },

  deactivatePlugin: async (pluginId: string) => {
    try {
      const result = await window.electronAPI.pluginDeactivate(pluginId) as { success: boolean; error?: string };
      if (result.success) {
        const plugins = await window.electronAPI.pluginList() as PluginInfo[];
        set({ plugins });
      }
      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },

  updateSetting: async (pluginId: string, key: string, value: unknown) => {
    try {
      await window.electronAPI.pluginUpdateSetting(pluginId, key, value);
      const plugins = await window.electronAPI.pluginList() as PluginInfo[];
      set({ plugins });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  refreshPlugins: async () => {
    set({ isLoading: true, error: null });
    try {
      const plugins = await window.electronAPI.pluginRefresh() as PluginInfo[];
      set({ plugins, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
    }
  },

  loadPluginsDir: async () => {
    try {
      const dir = await window.electronAPI.pluginGetDir();
      set({ pluginsDir: dir });
    } catch {
      // ignore
    }
  },
}));
