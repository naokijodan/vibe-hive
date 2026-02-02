import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/PluginService', () => ({
  getPluginService: () => ({
    getPlugins: vi.fn(),
    getPlugin: vi.fn(),
    activatePlugin: vi.fn(),
    deactivatePlugin: vi.fn(),
    updatePluginSetting: vi.fn(),
    getPluginsDir: vi.fn(),
    deactivateAll: vi.fn(),
    discoverPlugins: vi.fn(),
    activateAll: vi.fn(),
  }),
}));

import { registerPluginHandlers } from './pluginHandlers';

describe('pluginHandlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers all plugin handlers', () => {
    registerPluginHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('plugin:list');
    expect(channels).toContain('plugin:get');
    expect(channels).toContain('plugin:activate');
    expect(channels).toContain('plugin:deactivate');
    expect(channels).toContain('plugin:updateSetting');
    expect(channels).toContain('plugin:getDir');
    expect(channels).toContain('plugin:refresh');
    expect(mockHandle).toHaveBeenCalledTimes(7);
  });
});
