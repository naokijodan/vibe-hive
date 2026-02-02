import { create } from 'zustand';
import type { ExecutionRecord, StartExecutionRequest } from '../../shared/types/execution';
import { toErrorMessage } from '../../shared/utils/errorHandler';
import ipcBridge from '../bridge/ipcBridge';

interface ExecutionState {
  executions: ExecutionRecord[];
  runningExecutions: ExecutionRecord[];
  selectedExecutionId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  startExecution: (taskId: string, command: string, workingDirectory?: string) => Promise<void>;
  cancelExecution: (executionId: string) => Promise<void>;
  loadExecutions: () => Promise<void>;
  loadRunningExecutions: () => Promise<void>;
  loadExecutionsByTask: (taskId: string) => Promise<void>;
  setSelectedExecution: (id: string | null) => void;
}

export const useExecutionStore = create<ExecutionState>((set, get) => {
  // Setup IPC event listeners
  const setupListeners = () => {
    // Check if methods exist before calling them
    if (typeof ipcBridge.execution?.onStarted === 'function') {
      ipcBridge.execution.onStarted((data: { executionId: string; taskId: string }) => {
        get().loadRunningExecutions();
      });
    }

    if (typeof ipcBridge.execution?.onCompleted === 'function') {
      ipcBridge.execution.onCompleted((execution: ExecutionRecord) => {
        set((state) => ({
          executions: state.executions.map((e) =>
            e.id === execution.id ? execution : e
          ),
          runningExecutions: state.runningExecutions.filter((e) => e.id !== execution.id),
        }));
      });
    }

    if (typeof ipcBridge.execution?.onCancelled === 'function') {
      ipcBridge.execution.onCancelled((execution: ExecutionRecord) => {
        set((state) => ({
          executions: state.executions.map((e) =>
            e.id === execution.id ? execution : e
          ),
          runningExecutions: state.runningExecutions.filter((e) => e.id !== execution.id),
        }));
      });
    }
  };

  // Initialize listeners safely
  try {
    setupListeners();
  } catch (error) {
    console.error('Failed to setup execution store listeners:', error);
  }

  return {
    executions: [],
    runningExecutions: [],
    selectedExecutionId: null,
    isLoading: false,
    error: null,

    startExecution: async (taskId: string, command: string, workingDirectory?: string) => {
      set({ isLoading: true, error: null });
      try {
        const request: StartExecutionRequest = {
          taskId,
          command,
          workingDirectory,
        };

        const response = await ipcBridge.execution.start(request);
        // Reload running executions
        await get().loadRunningExecutions();

        set({ isLoading: false });
      } catch (error) {
        set({
          error: toErrorMessage(error, 'Failed to start execution'),
          isLoading: false,
        });
        throw error;
      }
    },

    cancelExecution: async (executionId: string) => {
      set({ isLoading: true, error: null });
      try {
        await ipcBridge.execution.cancel(executionId);
        // Reload running executions
        await get().loadRunningExecutions();

        set({ isLoading: false });
      } catch (error) {
        set({
          error: toErrorMessage(error, 'Failed to cancel execution'),
          isLoading: false,
        });
        throw error;
      }
    },

    loadExecutions: async () => {
      set({ isLoading: true, error: null });
      try {
        const executions = await ipcBridge.execution.getAll();
        set({ executions, isLoading: false });
      } catch (error) {
        set({
          error: toErrorMessage(error, 'Failed to load executions'),
          isLoading: false,
        });
      }
    },

    loadRunningExecutions: async () => {
      try {
        const runningExecutions = await ipcBridge.execution.getRunning();
        set({ runningExecutions });
      } catch (error) {
        console.error('Failed to load running executions:', error);
      }
    },

    loadExecutionsByTask: async (taskId: string) => {
      set({ isLoading: true, error: null });
      try {
        const executions = await ipcBridge.execution.getByTask(taskId);
        set({ executions, isLoading: false });
      } catch (error) {
        set({
          error: toErrorMessage(error, 'Failed to load executions'),
          isLoading: false,
        });
      }
    },

    setSelectedExecution: (id: string | null) => {
      set({ selectedExecutionId: id });
    },
  };
});
