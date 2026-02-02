import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSession } = vi.hoisted(() => ({
  mockSession: {
    list: vi.fn(),
    getActive: vi.fn(),
    switch: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../bridge/ipcBridge', () => ({
  default: { session: mockSession },
}));

import { useSessionStore } from './sessionStore';

const makeMockSession = (overrides = {}) => ({
  id: 'sess-1',
  name: 'Test Session',
  status: 'active',
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
  ...overrides,
});

describe('sessionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({
      sessions: [],
      activeSessionId: null,
      isLoading: false,
      error: null,
    });
  });

  describe('loadSessions', () => {
    it('loads and parses sessions', async () => {
      mockSession.list.mockResolvedValue([makeMockSession()]);

      await useSessionStore.getState().loadSessions();

      const state = useSessionStore.getState();
      expect(state.sessions).toHaveLength(1);
      expect(state.sessions[0].createdAt).toBeInstanceOf(Date);
      expect(state.isLoading).toBe(false);
    });

    it('handles error', async () => {
      mockSession.list.mockRejectedValue(new Error('fail'));

      await useSessionStore.getState().loadSessions();

      expect(useSessionStore.getState().error).toBe('Failed to load sessions');
    });
  });

  describe('loadActiveSession', () => {
    it('sets activeSessionId', async () => {
      mockSession.getActive.mockResolvedValue({ id: 'sess-active' });

      await useSessionStore.getState().loadActiveSession();

      expect(useSessionStore.getState().activeSessionId).toBe('sess-active');
    });

    it('does nothing when no active session', async () => {
      mockSession.getActive.mockResolvedValue(null);

      await useSessionStore.getState().loadActiveSession();

      expect(useSessionStore.getState().activeSessionId).toBeNull();
    });
  });

  describe('switchSession', () => {
    it('switches active session', async () => {
      mockSession.switch.mockResolvedValue({ id: 'sess-2' });

      await useSessionStore.getState().switchSession('sess-2');

      expect(useSessionStore.getState().activeSessionId).toBe('sess-2');
    });

    it('handles error', async () => {
      mockSession.switch.mockRejectedValue(new Error('fail'));

      await useSessionStore.getState().switchSession('bad');

      expect(useSessionStore.getState().error).toBe('Failed to switch session');
    });
  });

  describe('createSession', () => {
    it('creates and adds session to state', async () => {
      mockSession.create.mockResolvedValue(makeMockSession({ id: 'new-sess' }));

      const result = await useSessionStore.getState().createSession({ name: 'New' } as any);

      expect(result).toBeDefined();
      expect(result!.id).toBe('new-sess');
      expect(useSessionStore.getState().sessions).toHaveLength(1);
    });

    it('returns null on error', async () => {
      mockSession.create.mockRejectedValue(new Error('fail'));

      const result = await useSessionStore.getState().createSession({ name: 'New' } as any);

      expect(result).toBeNull();
      expect(useSessionStore.getState().error).toBe('Failed to create session');
    });
  });

  describe('deleteSession', () => {
    it('removes session from state', async () => {
      useSessionStore.setState({
        sessions: [{ ...makeMockSession(), createdAt: new Date(), updatedAt: new Date() }] as any,
      });
      mockSession.delete.mockResolvedValue(undefined);

      await useSessionStore.getState().deleteSession('sess-1');

      expect(useSessionStore.getState().sessions).toHaveLength(0);
    });

    it('clears activeSessionId if deleted session was active', async () => {
      useSessionStore.setState({
        sessions: [{ ...makeMockSession(), createdAt: new Date(), updatedAt: new Date() }] as any,
        activeSessionId: 'sess-1',
      });
      mockSession.delete.mockResolvedValue(undefined);

      await useSessionStore.getState().deleteSession('sess-1');

      expect(useSessionStore.getState().activeSessionId).toBeNull();
    });

    it('preserves activeSessionId if different session deleted', async () => {
      useSessionStore.setState({
        sessions: [
          { ...makeMockSession(), createdAt: new Date(), updatedAt: new Date() },
          { ...makeMockSession({ id: 'sess-2' }), createdAt: new Date(), updatedAt: new Date() },
        ] as any,
        activeSessionId: 'sess-1',
      });
      mockSession.delete.mockResolvedValue(undefined);

      await useSessionStore.getState().deleteSession('sess-2');

      expect(useSessionStore.getState().activeSessionId).toBe('sess-1');
    });
  });
});
