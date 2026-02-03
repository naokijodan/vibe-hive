import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/AgentCoordinationService', () => ({
  getAgentCoordinationService: () => ({
    sendMessage: vi.fn(),
    delegateTask: vi.fn(),
    respondToDelegation: vi.fn(),
    getMessages: vi.fn(),
    getMessagesByAgent: vi.fn(),
    getDelegations: vi.fn(),
    clearMessages: vi.fn(),
  }),
}));

import { registerCoordinationHandlers } from './coordinationHandlers';

describe('coordinationHandlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers all coordination handlers', () => {
    registerCoordinationHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('coordination:sendMessage');
    expect(channels).toContain('coordination:delegateTask');
    expect(channels).toContain('coordination:respondDelegation');
    expect(channels).toContain('coordination:getMessages');
    expect(channels).toContain('coordination:getMessagesByAgent');
    expect(channels).toContain('coordination:getDelegations');
    expect(channels).toContain('coordination:clearMessages');
  });

  describe('handler invocations', () => {
    let handlers: Map<string, (...args: unknown[]) => unknown>;

    beforeEach(() => {
      handlers = new Map();
      mockHandle.mockImplementation((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      });
      registerCoordinationHandlers();
    });

    it('coordination:sendMessage invokes service', async () => {
      const handler = handlers.get('coordination:sendMessage');
      await handler?.({}, 'agent-1', 'agent-2', 'message', 'Hello');
    });

    it('coordination:delegateTask invokes service', async () => {
      const handler = handlers.get('coordination:delegateTask');
      await handler?.({}, 'task-1', 'agent-1', 'agent-2', 'reason');
    });

    it('coordination:respondDelegation invokes service', async () => {
      const handler = handlers.get('coordination:respondDelegation');
      await handler?.({}, 'delegation-1', true);
    });

    it('coordination:getMessages invokes service', async () => {
      const handler = handlers.get('coordination:getMessages');
      await handler?.({}, 50);
    });

    it('coordination:getMessagesByAgent invokes service', async () => {
      const handler = handlers.get('coordination:getMessagesByAgent');
      await handler?.({}, 'agent-1');
    });

    it('coordination:getDelegations invokes service', async () => {
      const handler = handlers.get('coordination:getDelegations');
      await handler?.({});
    });

    it('coordination:clearMessages invokes service', async () => {
      const handler = handlers.get('coordination:clearMessages');
      await handler?.({});
    });
  });
});
