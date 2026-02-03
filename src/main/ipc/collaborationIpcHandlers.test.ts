import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/CollaborationService', () => ({
  getCollaborationService: () => ({
    startHost: vi.fn(),
    joinRoom: vi.fn(),
    disconnect: vi.fn(),
    sendChat: vi.fn(),
    broadcastTaskEvent: vi.fn(),
    getStatus: vi.fn(),
    getUsers: vi.fn(),
    getChatHistory: vi.fn(),
  }),
}));

import { registerCollaborationIpcHandlers } from './collaborationIpcHandlers';

describe('collaborationIpcHandlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers all collaboration handlers', () => {
    registerCollaborationIpcHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('collab:startHost');
    expect(channels).toContain('collab:join');
    expect(channels).toContain('collab:disconnect');
    expect(channels).toContain('collab:sendChat');
    expect(channels).toContain('collab:broadcastTask');
    expect(channels).toContain('collab:getStatus');
    expect(channels).toContain('collab:getUsers');
    expect(channels).toContain('collab:getChatHistory');
    expect(mockHandle).toHaveBeenCalledTimes(8);
  });

  describe('handler invocations', () => {
    let handlers: Map<string, (...args: unknown[]) => unknown>;

    beforeEach(() => {
      handlers = new Map();
      mockHandle.mockImplementation((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      });
      registerCollaborationIpcHandlers();
    });

    it('collab:startHost invokes service', async () => {
      const handler = handlers.get('collab:startHost');
      await handler?.({}, 'session-1', { nickname: 'Host' });
    });

    it('collab:join invokes service', async () => {
      const handler = handlers.get('collab:join');
      await handler?.({}, 'localhost', 3101, { nickname: 'Guest' });
    });

    it('collab:disconnect invokes service', async () => {
      const handler = handlers.get('collab:disconnect');
      await handler?.({});
    });

    it('collab:sendChat invokes service', async () => {
      const handler = handlers.get('collab:sendChat');
      await handler?.({}, 'Hello');
    });

    it('collab:broadcastTask invokes service', async () => {
      const handler = handlers.get('collab:broadcastTask');
      await handler?.({}, 'task:created', { id: '1' });
    });

    it('collab:getStatus invokes service', async () => {
      const handler = handlers.get('collab:getStatus');
      await handler?.({});
    });

    it('collab:getUsers invokes service', async () => {
      const handler = handlers.get('collab:getUsers');
      await handler?.({});
    });

    it('collab:getChatHistory invokes service', async () => {
      const handler = handlers.get('collab:getChatHistory');
      await handler?.({});
    });
  });
});
