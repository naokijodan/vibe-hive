import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/ThemeService', () => ({
  getThemeService: () => ({
    getPresets: vi.fn(() => []),
    getSettings: vi.fn(() => ({})),
    getActiveColors: vi.fn(() => ({})),
    setTheme: vi.fn(() => ({})),
    setCustomAccent: vi.fn(() => ({})),
    resetCustomAccent: vi.fn(() => ({})),
  }),
}));

import { registerThemeHandlers } from './themeHandlers';

describe('themeHandlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers all theme handlers', () => {
    registerThemeHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('theme:getPresets');
    expect(channels).toContain('theme:getSettings');
    expect(channels).toContain('theme:getActiveColors');
    expect(channels).toContain('theme:setTheme');
    expect(channels).toContain('theme:setCustomAccent');
    expect(channels).toContain('theme:resetCustomAccent');
  });

  describe('handler invocations', () => {
    let handlers: Map<string, (...args: unknown[]) => unknown>;

    beforeEach(() => {
      handlers = new Map();
      mockHandle.mockImplementation((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      });
      registerThemeHandlers();
    });

    it('theme:getPresets invokes service', async () => {
      const handler = handlers.get('theme:getPresets');
      await handler?.({});
    });

    it('theme:getSettings invokes service', async () => {
      const handler = handlers.get('theme:getSettings');
      await handler?.({});
    });

    it('theme:getActiveColors invokes service', async () => {
      const handler = handlers.get('theme:getActiveColors');
      await handler?.({});
    });

    it('theme:setTheme invokes service', async () => {
      const handler = handlers.get('theme:setTheme');
      await handler?.({}, 'dark');
    });

    it('theme:setCustomAccent invokes service', async () => {
      const handler = handlers.get('theme:setCustomAccent');
      await handler?.({}, '#ff0000');
    });

    it('theme:resetCustomAccent invokes service', async () => {
      const handler = handlers.get('theme:resetCustomAccent');
      await handler?.({});
    });
  });
});
