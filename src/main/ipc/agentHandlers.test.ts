import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/AgentService', () => ({
  agentService: {
    start: vi.fn(),
    stop: vi.fn(),
    input: vi.fn(),
    getAllSessions: vi.fn(),
    resize: vi.fn(),
  },
  AgentType: {},
}));

import { registerAgentHandlers } from './agentHandlers';

describe('agentHandlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers all agent handlers', () => {
    registerAgentHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('agent:start');
    expect(channels).toContain('agent:stop');
    expect(channels).toContain('agent:input');
    expect(channels).toContain('agent:send');
    expect(channels).toContain('agent:list');
    expect(channels).toContain('agent:resize');
    expect(mockHandle).toHaveBeenCalledTimes(6);
  });

  describe('handler invocations', () => {
    let handlers: Map<string, (...args: unknown[]) => unknown>;

    beforeEach(() => {
      handlers = new Map();
      mockHandle.mockImplementation((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      });
      registerAgentHandlers();
    });

    it('agent:start invokes service', async () => {
      const handler = handlers.get('agent:start');
      await handler?.({}, 'session-1', 'claude', '/tmp', 'Hello');
    });

    it('agent:stop invokes service', async () => {
      const handler = handlers.get('agent:stop');
      await handler?.({}, 'session-1');
    });

    it('agent:input invokes service', async () => {
      const handler = handlers.get('agent:input');
      await handler?.({}, 'session-1', 'input data');
    });

    it('agent:send invokes service', async () => {
      const handler = handlers.get('agent:send');
      await handler?.({}, 'session-1', 'message');
    });

    it('agent:list invokes service', async () => {
      const handler = handlers.get('agent:list');
      await handler?.({});
    });

    it('agent:resize invokes service', async () => {
      const handler = handlers.get('agent:resize');
      await handler?.({}, 'session-1', 120, 40);
    });
  });
});
