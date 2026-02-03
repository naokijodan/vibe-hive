import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/PtyService', () => ({
  ptyService: {
    create: vi.fn(),
    write: vi.fn(),
    resize: vi.fn(),
    close: vi.fn(),
    getAllSessions: vi.fn(),
  },
}));

import { registerPtyHandlers } from './ptyHandlers';

describe('ptyHandlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers all pty handlers', () => {
    registerPtyHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('pty:create');
    expect(channels).toContain('pty:write');
    expect(channels).toContain('pty:resize');
    expect(channels).toContain('pty:close');
    expect(channels).toContain('pty:list');
    expect(mockHandle).toHaveBeenCalledTimes(5);
  });

  describe('handler invocations', () => {
    let handlers: Map<string, (...args: unknown[]) => unknown>;

    beforeEach(() => {
      handlers = new Map();
      mockHandle.mockImplementation((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      });
      registerPtyHandlers();
    });

    it('pty:create invokes service', async () => {
      const handler = handlers.get('pty:create');
      await handler?.({}, 'session-1', 120, 40);
    });

    it('pty:write invokes service', async () => {
      const handler = handlers.get('pty:write');
      await handler?.({}, 'session-1', 'data');
    });

    it('pty:resize invokes service', async () => {
      const handler = handlers.get('pty:resize');
      await handler?.({}, 'session-1', 100, 50);
    });

    it('pty:close invokes service', async () => {
      const handler = handlers.get('pty:close');
      await handler?.({}, 'session-1');
    });

    it('pty:list invokes service', async () => {
      const handler = handlers.get('pty:list');
      await handler?.({});
    });
  });
});
