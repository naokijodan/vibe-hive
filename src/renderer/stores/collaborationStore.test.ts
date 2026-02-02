import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockElectronAPI = {
  collabStartHost: vi.fn(),
  collabJoin: vi.fn(),
  collabDisconnect: vi.fn(),
  collabSendChat: vi.fn(),
  collabGetStatus: vi.fn(),
  collabGetUsers: vi.fn(),
  collabGetChatHistory: vi.fn(),
};

vi.stubGlobal('window', { electronAPI: mockElectronAPI });

import { useCollaborationStore } from './collaborationStore';

describe('collaborationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCollaborationStore.setState({
      status: { connected: false, role: 'disconnected', userCount: 0 },
      users: [],
      chatMessages: [],
      settings: { nickname: 'Test', color: '#f59e0b' },
      isLoading: false,
      error: null,
    });
  });

  describe('setSettings', () => {
    it('merges partial settings', () => {
      useCollaborationStore.getState().setSettings({ nickname: 'NewName' });
      expect(useCollaborationStore.getState().settings.nickname).toBe('NewName');
      expect(useCollaborationStore.getState().settings.color).toBe('#f59e0b');
    });
  });

  describe('startHost', () => {
    it('starts host and refreshes on success', async () => {
      mockElectronAPI.collabStartHost.mockResolvedValue({ success: true, port: 3000 });
      mockElectronAPI.collabGetStatus.mockResolvedValue({ connected: true, role: 'host', userCount: 1 });
      mockElectronAPI.collabGetUsers.mockResolvedValue([]);

      const result = await useCollaborationStore.getState().startHost('s1', 3000);

      expect(result.success).toBe(true);
      expect(mockElectronAPI.collabGetStatus).toHaveBeenCalled();
    });

    it('sets error on failure result', async () => {
      mockElectronAPI.collabStartHost.mockResolvedValue({ success: false, error: 'port in use' });

      await useCollaborationStore.getState().startHost('s1');

      expect(useCollaborationStore.getState().error).toBe('port in use');
    });

    it('handles exception', async () => {
      mockElectronAPI.collabStartHost.mockRejectedValue(new Error('boom'));

      const result = await useCollaborationStore.getState().startHost('s1');

      expect(result).toEqual({ success: false, error: 'boom' });
    });
  });

  describe('join', () => {
    it('joins and refreshes on success', async () => {
      mockElectronAPI.collabJoin.mockResolvedValue({ success: true });
      mockElectronAPI.collabGetStatus.mockResolvedValue({ connected: true, role: 'client', userCount: 2 });

      const result = await useCollaborationStore.getState().join('localhost', 3000);

      expect(result.success).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('disconnects and resets state', async () => {
      mockElectronAPI.collabDisconnect.mockResolvedValue(undefined);
      useCollaborationStore.setState({
        status: { connected: true, role: 'host', userCount: 1 },
        users: [{ id: 'u1' }] as any,
        chatMessages: [{ id: 'm1' }] as any,
      });

      await useCollaborationStore.getState().disconnect();

      expect(useCollaborationStore.getState().status.connected).toBe(false);
      expect(useCollaborationStore.getState().users).toHaveLength(0);
    });
  });

  describe('addChatMessage', () => {
    it('adds message', () => {
      useCollaborationStore.getState().addChatMessage({ id: 'm1', content: 'hi' } as any);
      expect(useCollaborationStore.getState().chatMessages).toHaveLength(1);
    });
  });

  describe('addUser / removeUser', () => {
    it('adds user', () => {
      useCollaborationStore.getState().addUser({ id: 'u1', name: 'User1' } as any);
      expect(useCollaborationStore.getState().users).toHaveLength(1);
    });

    it('does not add duplicate', () => {
      useCollaborationStore.setState({ users: [{ id: 'u1' }] as any });
      useCollaborationStore.getState().addUser({ id: 'u1' } as any);
      expect(useCollaborationStore.getState().users).toHaveLength(1);
    });

    it('removes user', () => {
      useCollaborationStore.setState({ users: [{ id: 'u1' }, { id: 'u2' }] as any });
      useCollaborationStore.getState().removeUser({ id: 'u1' } as any);
      expect(useCollaborationStore.getState().users).toHaveLength(1);
    });
  });

  describe('updateStatus', () => {
    it('updates status', () => {
      useCollaborationStore.getState().updateStatus({ connected: true, role: 'host', userCount: 3 });
      expect(useCollaborationStore.getState().status.userCount).toBe(3);
    });
  });
});
