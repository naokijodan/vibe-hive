import { create } from 'zustand';
import ipcBridge from '../bridge/ipcBridge';

interface GitStatus {
  branch: string;
  staged: string[];
  modified: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}

interface GitStore {
  status: GitStatus | null;
  isLoading: boolean;
  repoPath: string;
  autoRefresh: boolean;
  error: string | null;

  setRepoPath: (path: string) => void;
  fetchStatus: () => Promise<void>;
  stageFiles: (files: string[]) => Promise<void>;
  unstageFiles: (files: string[]) => Promise<void>;
  commit: (message: string) => Promise<boolean>;
  push: () => Promise<boolean>;
  pull: () => Promise<boolean>;
  setAutoRefresh: (enabled: boolean) => void;
  clearError: () => void;
}

export const useGitStore = create<GitStore>((set, get) => ({
  status: null,
  isLoading: false,
  repoPath: '', // Will be set from session working directory
  autoRefresh: false,
  error: null,

  setRepoPath: (path: string) => {
    set({ repoPath: path });
    get().fetchStatus();
  },

  fetchStatus: async () => {
    const { repoPath } = get();
    set({ isLoading: true, error: null });
    
    try {
      const status = await ipcBridge.git.status(repoPath);
      set({ status, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch git status:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch git status',
        isLoading: false 
      });
    }
  },

  stageFiles: async (files: string[]) => {
    const { repoPath } = get();
    set({ isLoading: true, error: null });
    
    try {
      const success = await ipcBridge.git.add(repoPath, files);
      if (success) {
        await get().fetchStatus();
      } else {
        set({ error: 'Failed to stage files', isLoading: false });
      }
    } catch (error) {
      console.error('Failed to stage files:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to stage files',
        isLoading: false 
      });
    }
  },

  unstageFiles: async (files: string[]) => {
    const { repoPath } = get();
    set({ isLoading: true, error: null });

    try {
      const success = await ipcBridge.git.unstage(repoPath, files);
      if (success) {
        await get().fetchStatus();
      } else {
        set({ error: 'Failed to unstage files', isLoading: false });
      }
    } catch (error) {
      console.error('Failed to unstage files:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to unstage files',
        isLoading: false
      });
    }
  },

  commit: async (message: string) => {
    const { repoPath } = get();
    set({ isLoading: true, error: null });
    
    try {
      const success = await ipcBridge.git.commit(repoPath, message);
      if (success) {
        await get().fetchStatus();
      } else {
        set({ error: 'Failed to commit', isLoading: false });
      }
      return success;
    } catch (error) {
      console.error('Failed to commit:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to commit',
        isLoading: false 
      });
      return false;
    }
  },

  push: async () => {
    const { repoPath } = get();
    set({ isLoading: true, error: null });
    
    try {
      const success = await ipcBridge.git.push(repoPath);
      if (success) {
        await get().fetchStatus();
      } else {
        set({ error: 'Failed to push', isLoading: false });
      }
      return success;
    } catch (error) {
      console.error('Failed to push:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to push',
        isLoading: false 
      });
      return false;
    }
  },

  pull: async () => {
    const { repoPath } = get();
    set({ isLoading: true, error: null });
    
    try {
      const success = await ipcBridge.git.pull(repoPath);
      if (success) {
        await get().fetchStatus();
      } else {
        set({ error: 'Failed to pull', isLoading: false });
      }
      return success;
    } catch (error) {
      console.error('Failed to pull:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to pull',
        isLoading: false 
      });
      return false;
    }
  },

  setAutoRefresh: (enabled: boolean) => {
    set({ autoRefresh: enabled });
  },

  clearError: () => {
    set({ error: null });
  },
}));
