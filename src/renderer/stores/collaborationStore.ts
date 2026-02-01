import { create } from 'zustand';
import type {
  CollabConnectionStatus,
  CollabUser,
  CollabChatMessage,
  CollabSettings,
} from '../../shared/types/collaboration';

interface CollaborationState {
  status: CollabConnectionStatus;
  users: CollabUser[];
  chatMessages: CollabChatMessage[];
  settings: CollabSettings;
  isLoading: boolean;
  error: string | null;

  setSettings: (settings: Partial<CollabSettings>) => void;
  startHost: (sessionId: string, port?: number) => Promise<{ success: boolean; error?: string }>;
  join: (host: string, port: number) => Promise<{ success: boolean; error?: string }>;
  disconnect: () => Promise<void>;
  sendChat: (message: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  loadChatHistory: () => Promise<void>;
  addChatMessage: (msg: CollabChatMessage) => void;
  addUser: (user: CollabUser) => void;
  removeUser: (user: CollabUser) => void;
  updateStatus: (status: CollabConnectionStatus) => void;
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#f97316'];

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  status: { connected: false, role: 'disconnected', userCount: 0 },
  users: [],
  chatMessages: [],
  settings: {
    nickname: `User-${Math.floor(Math.random() * 1000)}`,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  },
  isLoading: false,
  error: null,

  setSettings: (partial) => {
    set((state) => ({ settings: { ...state.settings, ...partial } }));
  },

  startHost: async (sessionId, port) => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.electronAPI.collabStartHost(sessionId, get().settings, port) as { success: boolean; port: number; error?: string };
      if (result.success) {
        await get().refreshStatus();
        await get().refreshUsers();
      } else {
        set({ error: result.error });
      }
      set({ isLoading: false });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      set({ error, isLoading: false });
      return { success: false, error };
    }
  },

  join: async (host, port) => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.electronAPI.collabJoin(host, port, get().settings) as { success: boolean; error?: string };
      if (result.success) {
        await get().refreshStatus();
      } else {
        set({ error: result.error });
      }
      set({ isLoading: false });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      set({ error, isLoading: false });
      return { success: false, error };
    }
  },

  disconnect: async () => {
    await window.electronAPI.collabDisconnect();
    set({
      status: { connected: false, role: 'disconnected', userCount: 0 },
      users: [],
      chatMessages: [],
    });
  },

  sendChat: async (message) => {
    await window.electronAPI.collabSendChat(message);
  },

  refreshStatus: async () => {
    const status = await window.electronAPI.collabGetStatus() as CollabConnectionStatus;
    set({ status });
  },

  refreshUsers: async () => {
    const users = await window.electronAPI.collabGetUsers() as CollabUser[];
    set({ users });
  },

  loadChatHistory: async () => {
    const chatMessages = await window.electronAPI.collabGetChatHistory() as CollabChatMessage[];
    set({ chatMessages });
  },

  addChatMessage: (msg) => {
    set((state) => ({ chatMessages: [...state.chatMessages, msg] }));
  },

  addUser: (user) => {
    set((state) => {
      if (state.users.find(u => u.id === user.id)) return state;
      return { users: [...state.users, user] };
    });
  },

  removeUser: (user) => {
    set((state) => ({
      users: state.users.filter(u => u.id !== user.id),
    }));
  },

  updateStatus: (status) => {
    set({ status });
  },
}));
