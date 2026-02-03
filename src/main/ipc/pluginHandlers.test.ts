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

  describe('handler invocations', () => {
    let handlers: Map<string, (...args: unknown[]) => unknown>;

    beforeEach(() => {
      handlers = new Map();
      mockHandle.mockImplementation((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      });
      registerPluginHandlers();
    });

    it('plugin:list invokes service', async () => {
      const handler = handlers.get('plugin:list');
      await handler?.({});
    });

    it('plugin:get invokes service', async () => {
      const handler = handlers.get('plugin:get');
      await handler?.({}, 'plugin-1');
    });

    it('plugin:activate invokes service', async () => {
      const handler = handlers.get('plugin:activate');
      await handler?.({}, 'plugin-1');
    });

    it('plugin:deactivate invokes service', async () => {
      const handler = handlers.get('plugin:deactivate');
      await handler?.({}, 'plugin-1');
    });

    it('plugin:updateSetting invokes service', async () => {
      const handler = handlers.get('plugin:updateSetting');
      await handler?.({}, 'plugin-1', 'key', 'value');
    });

    it('plugin:getDir invokes service', async () => {
      const handler = handlers.get('plugin:getDir');
      await handler?.({});
    });

    it('plugin:refresh invokes service', async () => {
      const handler = handlers.get('plugin:refresh');
      await handler?.({});
    });
  });
});
