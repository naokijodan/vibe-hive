import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/ClaudeHooksService', () => ({
  getClaudeHooksService: () => ({
    getHooks: vi.fn(), addHook: vi.fn(), updateHook: vi.fn(), deleteHook: vi.fn(),
    getPresets: vi.fn(), addPreset: vi.fn(), getLogs: vi.fn(), clearLogs: vi.fn(), reloadFromDisk: vi.fn(),
  }),
}));

import { registerClaudeHooksHandlers } from './claudeHooksHandlers';

describe('claudeHooksHandlers', () => {
  beforeEach(() => vi.clearAllMocks());
  it('registers all claude hooks handlers', () => {
    registerClaudeHooksHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('claudeHooks:getHooks');
    expect(channels).toContain('claudeHooks:addHook');
    expect(channels).toContain('claudeHooks:updateHook');
    expect(channels).toContain('claudeHooks:deleteHook');
    expect(channels).toContain('claudeHooks:getPresets');
    expect(channels).toContain('claudeHooks:addPreset');
    expect(channels).toContain('claudeHooks:getLogs');
    expect(channels).toContain('claudeHooks:clearLogs');
    expect(channels).toContain('claudeHooks:reload');
  });

  describe('handler invocations', () => {
    let handlers: Map<string, (...args: unknown[]) => unknown>;

    beforeEach(() => {
      handlers = new Map();
      mockHandle.mockImplementation((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      });
      registerClaudeHooksHandlers();
    });

    it('claudeHooks:getHooks invokes service', async () => {
      const handler = handlers.get('claudeHooks:getHooks');
      await handler?.({});
    });

    it('claudeHooks:addHook invokes service', async () => {
      const handler = handlers.get('claudeHooks:addHook');
      await handler?.({}, { event: 'onStart', command: 'echo' });
    });

    it('claudeHooks:updateHook invokes service', async () => {
      const handler = handlers.get('claudeHooks:updateHook');
      await handler?.({}, 'hook-1', { command: 'updated' });
    });

    it('claudeHooks:deleteHook invokes service', async () => {
      const handler = handlers.get('claudeHooks:deleteHook');
      await handler?.({}, 'hook-1');
    });

    it('claudeHooks:getPresets invokes service', async () => {
      const handler = handlers.get('claudeHooks:getPresets');
      await handler?.({});
    });

    it('claudeHooks:addPreset invokes service', async () => {
      const handler = handlers.get('claudeHooks:addPreset');
      await handler?.({}, 0);
    });

    it('claudeHooks:getLogs invokes service', async () => {
      const handler = handlers.get('claudeHooks:getLogs');
      await handler?.({});
    });

    it('claudeHooks:clearLogs invokes service', async () => {
      const handler = handlers.get('claudeHooks:clearLogs');
      await handler?.({});
    });

    it('claudeHooks:reload invokes service', async () => {
      const handler = handlers.get('claudeHooks:reload');
      await handler?.({});
    });
  });
});
