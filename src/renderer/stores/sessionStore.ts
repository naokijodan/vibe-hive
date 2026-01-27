import { create } from 'zustand';
import { Session, SessionConfig } from '../../shared/types/session';
import ipcBridge from '../bridge/ipcBridge';

interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSessions: () => Promise<void>;
  loadActiveSession: () => Promise<void>;
  switchSession: (id: string) => Promise<void>;
  createSession: (config: SessionConfig) => Promise<Session | null>;
  deleteSession: (id: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  isLoading: false,
  error: null,

  loadSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await ipcBridge.session.list() as Session[];
      // Parse date strings to Date objects
      const parsedSessions = sessions.map(session => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      }));
      set({ sessions: parsedSessions, isLoading: false });
    } catch (error) {
      console.error('Failed to load sessions:', error);
      set({ error: 'Failed to load sessions', isLoading: false });
    }
  },

  loadActiveSession: async () => {
    try {
      const activeSession = await ipcBridge.session.getActive() as Session | null;
      if (activeSession) {
        set({ activeSessionId: activeSession.id });
      }
    } catch (error) {
      console.error('Failed to load active session:', error);
    }
  },

  switchSession: async (id: string) => {
    set({ error: null });
    try {
      const session = await ipcBridge.session.switch(id) as Session;
      set({ activeSessionId: session.id });
      console.log('Switched to session:', session.name);
    } catch (error) {
      console.error('Failed to switch session:', error);
      set({ error: 'Failed to switch session' });
    }
  },

  createSession: async (config: SessionConfig) => {
    set({ error: null });
    try {
      const session = await ipcBridge.session.create(config) as Session;
      const parsedSession = {
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      };
      set(state => ({ sessions: [parsedSession, ...state.sessions] }));
      return parsedSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      set({ error: 'Failed to create session' });
      return null;
    }
  },

  deleteSession: async (id: string) => {
    set({ error: null });
    try {
      await ipcBridge.session.delete(id);
      set(state => ({
        sessions: state.sessions.filter(s => s.id !== id),
        activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
      }));
      console.log('Deleted session:', id);
    } catch (error) {
      console.error('Failed to delete session:', error);
      set({ error: 'Failed to delete session' });
    }
  },
}));
