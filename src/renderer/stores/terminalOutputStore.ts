import { create } from 'zustand';

interface TerminalOutput {
  sessionId: string;
  data: string[];
  maxLines: number;
}

interface TerminalOutputStore {
  outputs: Map<string, TerminalOutput>;
  appendOutput: (sessionId: string, data: string) => void;
  getOutput: (sessionId: string) => string[];
  clearOutput: (sessionId: string) => void;
  clearAll: () => void;
}

const MAX_LINES = 5000;

export const useTerminalOutputStore = create<TerminalOutputStore>((set, get) => ({
  outputs: new Map(),

  appendOutput: (sessionId: string, data: string) => {
    set((state) => {
      const newOutputs = new Map(state.outputs);
      const existing = newOutputs.get(sessionId) || {
        sessionId,
        data: [],
        maxLines: MAX_LINES,
      };

      // Append new data
      existing.data.push(data);

      // Trim if exceeds max lines (keep last MAX_LINES entries)
      if (existing.data.length > MAX_LINES) {
        existing.data = existing.data.slice(-MAX_LINES);
      }

      newOutputs.set(sessionId, existing);
      return { outputs: newOutputs };
    });
  },

  getOutput: (sessionId: string) => {
    const output = get().outputs.get(sessionId);
    return output ? output.data : [];
  },

  clearOutput: (sessionId: string) => {
    set((state) => {
      const newOutputs = new Map(state.outputs);
      newOutputs.delete(sessionId);
      return { outputs: newOutputs };
    });
  },

  clearAll: () => {
    set({ outputs: new Map() });
  },
}));
