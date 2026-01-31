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

export interface ModelProviderConfig {
  enabled: boolean;
  cliPath: string;
  defaultArgs?: string;
}

export interface AgentSettings {
  defaultAgent: string;
  providers: {
    'claude-code': ModelProviderConfig;
    'codex': ModelProviderConfig;
    'gemini': ModelProviderConfig;
    'ollama': ModelProviderConfig;
  };
  ollamaDefaultModel: string;
}

export interface Settings {
  git: GitSettings;
  app: AppSettings;
  agent: AgentSettings;
}

interface SettingsStore {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  updateGitSettings: (gitSettings: Partial<GitSettings>) => Promise<void>;
  updateAppSettings: (appSettings: Partial<AppSettings>) => Promise<void>;
  updateAgentSettings: (agentSettings: Partial<AgentSettings>) => Promise<void>;
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

  updateAgentSettings: async (agentSettings: Partial<AgentSettings>) => {
    set({ isLoading: true, error: null });

    try {
      const settings = await ipcBridge.settings.updateAgent(agentSettings);
      set({ settings: settings as Settings, isLoading: false });
    } catch (error) {
      console.error('Failed to update Agent settings:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update Agent settings',
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
