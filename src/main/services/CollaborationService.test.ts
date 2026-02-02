import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ws', () => ({
  WebSocketServer: class {
    on = vi.fn();
    close = vi.fn();
  },
  WebSocket: { OPEN: 1 },
}));

vi.mock('electron', () => ({
  BrowserWindow: class {},
}));

vi.mock('crypto', () => ({
  randomUUID: () => `uuid-${Math.random()}`,
}));

let getCollaborationService: () => any;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.doMock('ws', () => ({
    WebSocketServer: class {
      on = vi.fn();
      close = vi.fn();
    },
    WebSocket: { OPEN: 1 },
  }));
  vi.doMock('electron', () => ({
    BrowserWindow: class {},
  }));
  vi.doMock('crypto', () => ({
    randomUUID: () => `uuid-${Math.random()}`,
  }));
  const mod = await import('./CollaborationService');
  getCollaborationService = mod.getCollaborationService;
});

describe('CollaborationService', () => {
  it('getStatus returns disconnected initially', () => {
    const svc = getCollaborationService();
    const status = svc.getStatus();
    expect(status.connected).toBe(false);
    expect(status.role).toBe('disconnected');
  });

  it('getUsers returns empty initially', () => {
    const svc = getCollaborationService();
    expect(svc.getUsers()).toEqual([]);
  });

  it('getChatHistory returns empty initially', () => {
    const svc = getCollaborationService();
    expect(svc.getChatHistory()).toEqual([]);
  });

  it('sendChat returns null when not connected', () => {
    const svc = getCollaborationService();
    expect(svc.sendChat('hello')).toBeNull();
  });

  it('disconnect does nothing when already disconnected', async () => {
    const svc = getCollaborationService();
    await svc.disconnect(); // should not throw
  });

  it('broadcastTaskEvent does nothing when not connected', () => {
    const svc = getCollaborationService();
    svc.broadcastTaskEvent('task:created', { id: '1' }); // should not throw
  });
});
