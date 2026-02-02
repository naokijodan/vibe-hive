import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockElectronAPI = {
  dbAgentGetAll: vi.fn(),
  dbAgentCreate: vi.fn(),
  dbAgentUpdate: vi.fn(),
  dbAgentDelete: vi.fn(),
  dbTaskUpdate: vi.fn(),
  onAgentStatus: vi.fn(),
};

vi.stubGlobal('window', { electronAPI: mockElectronAPI });

import { useAgentStore } from './agentStore';

describe('agentStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAgentStore.setState({
      agents: [],
      isLoading: false,
      error: null,
    });
  });

  describe('loadAgents', () => {
    it('loads agents', async () => {
      mockElectronAPI.dbAgentGetAll.mockResolvedValue([{ id: 'a1', name: 'Agent1' }]);

      await useAgentStore.getState().loadAgents();

      expect(useAgentStore.getState().agents).toHaveLength(1);
      expect(useAgentStore.getState().isLoading).toBe(false);
    });

    it('handles error', async () => {
      mockElectronAPI.dbAgentGetAll.mockRejectedValue(new Error('fail'));

      await useAgentStore.getState().loadAgents();

      expect(useAgentStore.getState().error).toBe('Failed to load agents');
    });
  });

  describe('createAgent', () => {
    it('creates and adds agent', async () => {
      const agent = { id: 'a1', name: 'New' };
      mockElectronAPI.dbAgentCreate.mockResolvedValue(agent);

      const result = await useAgentStore.getState().createAgent({ name: 'New' } as any);

      expect(result).toEqual(agent);
      expect(useAgentStore.getState().agents).toHaveLength(1);
    });

    it('returns null on error', async () => {
      mockElectronAPI.dbAgentCreate.mockRejectedValue(new Error('fail'));

      const result = await useAgentStore.getState().createAgent({ name: 'x' } as any);

      expect(result).toBeNull();
    });
  });

  describe('updateAgent', () => {
    it('updates agent in state', async () => {
      useAgentStore.setState({ agents: [{ id: 'a1', name: 'Old' }] as any });
      mockElectronAPI.dbAgentUpdate.mockResolvedValue({ id: 'a1', name: 'New' });

      const result = await useAgentStore.getState().updateAgent('a1', { name: 'New' });

      expect(result?.name).toBe('New');
      expect(useAgentStore.getState().agents[0].name).toBe('New');
    });
  });

  describe('deleteAgent', () => {
    it('removes agent on success', async () => {
      useAgentStore.setState({ agents: [{ id: 'a1' }] as any });
      mockElectronAPI.dbAgentDelete.mockResolvedValue(true);

      const result = await useAgentStore.getState().deleteAgent('a1');

      expect(result).toBe(true);
      expect(useAgentStore.getState().agents).toHaveLength(0);
    });

    it('returns false on failure', async () => {
      mockElectronAPI.dbAgentDelete.mockRejectedValue(new Error('fail'));

      const result = await useAgentStore.getState().deleteAgent('a1');

      expect(result).toBe(false);
    });
  });

  describe('assignTaskToAgent', () => {
    it('calls dbTaskUpdate', async () => {
      mockElectronAPI.dbTaskUpdate.mockResolvedValue(undefined);

      await useAgentStore.getState().assignTaskToAgent('t1', 'a1');

      expect(mockElectronAPI.dbTaskUpdate).toHaveBeenCalledWith('t1', { assignedAgentId: 'a1' });
    });

    it('throws on error', async () => {
      mockElectronAPI.dbTaskUpdate.mockRejectedValue(new Error('fail'));

      await expect(useAgentStore.getState().assignTaskToAgent('t1', 'a1')).rejects.toThrow();
    });
  });

  describe('updateAgentStatus', () => {
    it('updates agent status by sessionId', () => {
      useAgentStore.setState({ agents: [{ id: 'a1', sessionId: 's1', status: 'idle' }] as any });

      useAgentStore.getState().updateAgentStatus('s1', 'running' as any);

      expect(useAgentStore.getState().agents[0].status).toBe('running');
    });
  });

  describe('initStatusListener', () => {
    it('registers listener and returns cleanup', () => {
      const cleanup = vi.fn();
      mockElectronAPI.onAgentStatus.mockReturnValue(cleanup);

      const result = useAgentStore.getState().initStatusListener();

      expect(mockElectronAPI.onAgentStatus).toHaveBeenCalled();
      expect(result).toBe(cleanup);
    });
  });
});
