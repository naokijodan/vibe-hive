import { create } from 'zustand';
import type { Agent, AgentConfig, AgentStatus } from '../../shared/types/agent';

interface AgentStore {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAgents: () => Promise<void>;
  createAgent: (config: AgentConfig) => Promise<Agent | null>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<Agent | null>;
  deleteAgent: (id: string) => Promise<boolean>;
  assignTaskToAgent: (taskId: string, agentId: string | null) => Promise<void>;
  updateAgentStatus: (sessionId: string, status: AgentStatus) => void;
  initStatusListener: () => () => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  isLoading: false,
  error: null,

  loadAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const agents = await window.electronAPI.dbAgentGetAll() as Agent[];
      set({ agents, isLoading: false });
    } catch (error) {
      console.error('Failed to load agents:', error);
      set({ error: 'Failed to load agents', isLoading: false });
    }
  },

  createAgent: async (config: AgentConfig) => {
    set({ error: null });
    try {
      const agent = await window.electronAPI.dbAgentCreate(config) as Agent;
      set((state) => ({ agents: [...state.agents, agent] }));
      return agent;
    } catch (error) {
      console.error('Failed to create agent:', error);
      set({ error: 'Failed to create agent' });
      return null;
    }
  },

  updateAgent: async (id: string, updates: Partial<Agent>) => {
    set({ error: null });
    try {
      const agent = await window.electronAPI.dbAgentUpdate(id, updates) as Agent;
      if (agent) {
        set((state) => ({
          agents: state.agents.map((a) => (a.id === id ? agent : a)),
        }));
      }
      return agent;
    } catch (error) {
      console.error('Failed to update agent:', error);
      set({ error: 'Failed to update agent' });
      return null;
    }
  },

  deleteAgent: async (id: string) => {
    set({ error: null });
    try {
      const success = await window.electronAPI.dbAgentDelete(id);
      if (success) {
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
        }));
      }
      return success;
    } catch (error) {
      console.error('Failed to delete agent:', error);
      set({ error: 'Failed to delete agent' });
      return false;
    }
  },

  assignTaskToAgent: async (taskId: string, agentId: string | null) => {
    set({ error: null });
    try {
      await window.electronAPI.dbTaskUpdate(taskId, { assignedAgentId: agentId });
    } catch (error) {
      console.error('Failed to assign task to agent:', error);
      set({ error: 'Failed to assign task to agent' });
      throw error;
    }
  },

  updateAgentStatus: (sessionId: string, status: AgentStatus) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.sessionId === sessionId
          ? { ...agent, status }
          : agent
      ),
    }));
  },

  initStatusListener: () => {
    const cleanup = window.electronAPI.onAgentStatus((sessionId: string, status: string) => {
      get().updateAgentStatus(sessionId, status as AgentStatus);
    });
    return cleanup;
  },
}));
