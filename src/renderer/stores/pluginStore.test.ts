import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockElectronAPI = {
  pluginList: vi.fn(),
  pluginActivate: vi.fn(),
  pluginDeactivate: vi.fn(),
  pluginUpdateSetting: vi.fn(),
  pluginRefresh: vi.fn(),
  pluginGetDir: vi.fn(),
};

vi.stubGlobal('window', { electronAPI: mockElectronAPI });

import { usePluginStore } from './pluginStore';

describe('pluginStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePluginStore.setState({
      plugins: [],
      pluginsDir: '',
      isLoading: false,
      error: null,
    });
  });

  describe('loadPlugins', () => {
    it('loads plugins', async () => {
      mockElectronAPI.pluginList.mockResolvedValue([{ id: 'p1' }]);

      await usePluginStore.getState().loadPlugins();

      expect(usePluginStore.getState().plugins).toHaveLength(1);
      expect(usePluginStore.getState().isLoading).toBe(false);
    });

    it('handles error', async () => {
      mockElectronAPI.pluginList.mockRejectedValue(new Error('fail'));

      await usePluginStore.getState().loadPlugins();

      expect(usePluginStore.getState().error).toBe('fail');
    });
  });

  describe('activatePlugin', () => {
    it('activates and reloads on success', async () => {
      mockElectronAPI.pluginActivate.mockResolvedValue({ success: true });
      mockElectronAPI.pluginList.mockResolvedValue([{ id: 'p1', active: true }]);

      const result = await usePluginStore.getState().activatePlugin('p1');

      expect(result.success).toBe(true);
      expect(mockElectronAPI.pluginList).toHaveBeenCalled();
    });

    it('does not reload on failure', async () => {
      mockElectronAPI.pluginActivate.mockResolvedValue({ success: false, error: 'nope' });

      const result = await usePluginStore.getState().activatePlugin('p1');

      expect(result.success).toBe(false);
      expect(mockElectronAPI.pluginList).not.toHaveBeenCalled();
    });

    it('returns error on exception', async () => {
      mockElectronAPI.pluginActivate.mockRejectedValue(new Error('boom'));

      const result = await usePluginStore.getState().activatePlugin('p1');

      expect(result).toEqual({ success: false, error: 'boom' });
    });
  });

  describe('deactivatePlugin', () => {
    it('deactivates and reloads on success', async () => {
      mockElectronAPI.pluginDeactivate.mockResolvedValue({ success: true });
      mockElectronAPI.pluginList.mockResolvedValue([]);

      const result = await usePluginStore.getState().deactivatePlugin('p1');

      expect(result.success).toBe(true);
    });
  });

  describe('updateSetting', () => {
    it('updates and reloads', async () => {
      mockElectronAPI.pluginUpdateSetting.mockResolvedValue(undefined);
      mockElectronAPI.pluginList.mockResolvedValue([]);

      await usePluginStore.getState().updateSetting('p1', 'key', 'val');

      expect(mockElectronAPI.pluginUpdateSetting).toHaveBeenCalledWith('p1', 'key', 'val');
      expect(mockElectronAPI.pluginList).toHaveBeenCalled();
    });
  });

  describe('refreshPlugins', () => {
    it('refreshes plugins', async () => {
      mockElectronAPI.pluginRefresh.mockResolvedValue([{ id: 'p1' }]);

      await usePluginStore.getState().refreshPlugins();

      expect(usePluginStore.getState().plugins).toHaveLength(1);
    });
  });

  describe('loadPluginsDir', () => {
    it('loads dir', async () => {
      mockElectronAPI.pluginGetDir.mockResolvedValue('/path/to/plugins');

      await usePluginStore.getState().loadPluginsDir();

      expect(usePluginStore.getState().pluginsDir).toBe('/path/to/plugins');
    });
  });
});
