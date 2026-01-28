import { create } from 'zustand';
import type { ExecutionRecord, StartExecutionRequest } from '../../shared/types/execution';
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
    // Execution started event
    ipcBridge.execution.onStarted((data: { executionId: string; taskId: string }) => {
      console.log('Execution started:', data);
      get().loadRunningExecutions();
    });

    // Execution completed event
    ipcBridge.execution.onCompleted((execution: ExecutionRecord) => {
      console.log('Execution completed:', execution);
      set((state) => ({
        executions: state.executions.map((e) =>
          e.id === execution.id ? execution : e
        ),
        runningExecutions: state.runningExecutions.filter((e) => e.id !== execution.id),
      }));
    });

    // Execution cancelled event
    ipcBridge.execution.onCancelled((execution: ExecutionRecord) => {
      console.log('Execution cancelled:', execution);
      set((state) => ({
        executions: state.executions.map((e) =>
          e.id === execution.id ? execution : e
        ),
        runningExecutions: state.runningExecutions.filter((e) => e.id !== execution.id),
      }));
    });
  };

  // Initialize listeners
  setupListeners();

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
        console.log('Execution started:', response);

        // Reload running executions
        await get().loadRunningExecutions();

        set({ isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to start execution',
          isLoading: false,
        });
        throw error;
      }
    },

    cancelExecution: async (executionId: string) => {
      set({ isLoading: true, error: null });
      try {
        await ipcBridge.execution.cancel(executionId);
        console.log('Execution cancelled:', executionId);

        // Reload running executions
        await get().loadRunningExecutions();

        set({ isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to cancel execution',
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
          error: error instanceof Error ? error.message : 'Failed to load executions',
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
          error: error instanceof Error ? error.message : 'Failed to load executions',
          isLoading: false,
        });
      }
    },

    setSelectedExecution: (id: string | null) => {
      set({ selectedExecutionId: id });
    },
  };
});
