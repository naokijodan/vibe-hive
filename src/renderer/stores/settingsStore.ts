import { create } from 'zustand';
import ipcBridge from '../bridge/ipcBridge';

export interface GitSettings {
  userName: string;
  userEmail: string;
  defaultRepo: string;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  autoSaveInterval: number;
  terminalFontSize: number;
  maxLogEntries: number;
}

export interface Settings {
  git: GitSettings;
  app: AppSettings;
}

interface SettingsStore {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  updateGitSettings: (gitSettings: Partial<GitSettings>) => Promise<void>;
  updateAppSettings: (appSettings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const settings = await ipcBridge.settings.get();
      set({ settings: settings as Settings, isLoading: false });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load settings',
        isLoading: false,
      });
    }
  },

  updateGitSettings: async (gitSettings: Partial<GitSettings>) => {
    set({ isLoading: true, error: null });
    
    try {
      const settings = await ipcBridge.settings.updateGit(gitSettings);
      set({ settings: settings as Settings, isLoading: false });
    } catch (error) {
      console.error('Failed to update Git settings:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update Git settings',
        isLoading: false,
      });
    }
  },

  updateAppSettings: async (appSettings: Partial<AppSettings>) => {
    set({ isLoading: true, error: null });
    
    try {
      const settings = await ipcBridge.settings.updateApp(appSettings);
      set({ settings: settings as Settings, isLoading: false });
    } catch (error) {
      console.error('Failed to update App settings:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update App settings',
        isLoading: false,
      });
    }
  },

  resetSettings: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const settings = await ipcBridge.settings.reset();
      set({ settings: settings as Settings, isLoading: false });
    } catch (error) {
      console.error('Failed to reset settings:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to reset settings',
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
