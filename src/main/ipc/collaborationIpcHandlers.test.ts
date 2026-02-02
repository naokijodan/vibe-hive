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
});
