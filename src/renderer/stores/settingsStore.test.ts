import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSettings } = vi.hoisted(() => ({
  mockSettings: {
    get: vi.fn(),
    update: vi.fn(),
    updateGit: vi.fn(),
    updateApp: vi.fn(),
    updateAgent: vi.fn(),
    reset: vi.fn(),
  },
}));

vi.mock('../bridge/ipcBridge', () => ({
  default: { settings: mockSettings },
}));

import { useSettingsStore } from './settingsStore';

const makeMockSettings = () => ({
  git: { userName: 'test', userEmail: 'test@test.com', defaultRepo: '/tmp' },
  app: { theme: 'dark', autoSaveInterval: 30, terminalFontSize: 14, maxLogEntries: 5000 },
  agent: {
    defaultAgent: 'claude-code',
    providers: {
      'claude-code': { enabled: true, cliPath: 'claude' },
      'codex': { enabled: true, cliPath: 'codex' },
      'gemini': { enabled: false, cliPath: 'gemini' },
      'ollama': { enabled: false, cliPath: 'ollama' },
    },
    ollamaDefaultModel: 'llama3',
  },
});

describe('settingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({ settings: null, isLoading: false, error: null });
  });

  describe('loadSettings', () => {
    it('loads settings', async () => {
      const settings = makeMockSettings();
      mockSettings.get.mockResolvedValue(settings);

      await useSettingsStore.getState().loadSettings();

      const state = useSettingsStore.getState();
      expect(state.settings).toEqual(settings);
      expect(state.isLoading).toBe(false);
    });

    it('handles error', async () => {
      mockSettings.get.mockRejectedValue(new Error('Load failed'));

      await useSettingsStore.getState().loadSettings();

      expect(useSettingsStore.getState().error).toBe('Load failed');
    });
  });

  describe('updateGitSettings', () => {
    it('updates git settings', async () => {
      const updated = makeMockSettings();
      updated.git.userName = 'new-user';
      mockSettings.updateGit.mockResolvedValue(updated);

      await useSettingsStore.getState().updateGitSettings({ userName: 'new-user' });

      expect(useSettingsStore.getState().settings?.git.userName).toBe('new-user');
    });

    it('handles error', async () => {
      mockSettings.updateGit.mockRejectedValue(new Error('Git fail'));

      await useSettingsStore.getState().updateGitSettings({ userName: 'x' });

      expect(useSettingsStore.getState().error).toBe('Git fail');
    });
  });

  describe('updateAppSettings', () => {
    it('updates app settings', async () => {
      const updated = makeMockSettings();
      updated.app.terminalFontSize = 20;
      mockSettings.updateApp.mockResolvedValue(updated);

      await useSettingsStore.getState().updateAppSettings({ terminalFontSize: 20 });

      expect(useSettingsStore.getState().settings?.app.terminalFontSize).toBe(20);
    });
  });

  describe('updateAgentSettings', () => {
    it('updates agent settings', async () => {
      const updated = makeMockSettings();
      updated.agent.defaultAgent = 'codex';
      mockSettings.updateAgent.mockResolvedValue(updated);

      await useSettingsStore.getState().updateAgentSettings({ defaultAgent: 'codex' });

      expect(useSettingsStore.getState().settings?.agent.defaultAgent).toBe('codex');
    });
  });

  describe('resetSettings', () => {
    it('resets to defaults', async () => {
      const defaults = makeMockSettings();
      mockSettings.reset.mockResolvedValue(defaults);

      await useSettingsStore.getState().resetSettings();

      expect(useSettingsStore.getState().settings).toEqual(defaults);
    });

    it('handles error', async () => {
      mockSettings.reset.mockRejectedValue(new Error('Reset fail'));

      await useSettingsStore.getState().resetSettings();

      expect(useSettingsStore.getState().error).toBe('Reset fail');
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      useSettingsStore.setState({ error: 'some error' });

      useSettingsStore.getState().clearError();

      expect(useSettingsStore.getState().error).toBeNull();
    });
  });
});
