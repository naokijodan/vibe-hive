import { create } from 'zustand';

interface TerminalOutput {
  sessionId: string;
  data: string[];
  maxLines: number;
}

interface TerminalOutputStore {
  // Use a plain object instead of Map for better Zustand compatibility
  outputs: Record<string, TerminalOutput>;
  appendOutput: (sessionId: string, data: string) => void;
  getOutput: (sessionId: string) => string[];
  clearOutput: (sessionId: string) => void;
  clearAll: () => void;
  debugState: () => void;
}

const MAX_LINES = 5000;

export const useTerminalOutputStore = create<TerminalOutputStore>((set, get) => ({
  outputs: {},

  appendOutput: (sessionId: string, data: string) => {
    set((state) => {
      const existing = state.outputs[sessionId] || {
        sessionId,
        data: [],
        maxLines: MAX_LINES,
      };

      // Create a new array with the new data
      const newData = [...existing.data, data];

      // Trim if exceeds max lines (keep last MAX_LINES entries)
      const trimmedData = newData.length > MAX_LINES ? newData.slice(-MAX_LINES) : newData;

      const newOutputs = {
        ...state.outputs,
        [sessionId]: {
          ...existing,
          data: trimmedData,
        },
      };

      console.log(`[TerminalOutputStore] Appended data for ${sessionId}, total entries: ${trimmedData.length}`);
      return { outputs: newOutputs };
    });
  },

  getOutput: (sessionId: string) => {
    const state = get();
    const output = state.outputs[sessionId];
    const data = output ? output.data : [];
    console.log(`[TerminalOutputStore] getOutput for ${sessionId}, entries: ${data.length}, keys in store: ${Object.keys(state.outputs).join(', ')}`);
    return data;
  },

  clearOutput: (sessionId: string) => {
    set((state) => {
      const { [sessionId]: _, ...rest } = state.outputs;
      return { outputs: rest };
    });
  },

  clearAll: () => {
    set({ outputs: {} });
  },

  debugState: () => {
    const state = get();
    console.log('[TerminalOutputStore] Current state:', {
      sessionIds: Object.keys(state.outputs),
      entryCounts: Object.entries(state.outputs).map(([id, o]) => `${id}: ${o.data.length}`),
    });
  },
}));
