import { describe, it, expect, beforeEach } from 'vitest';
import { useTerminalOutputStore } from './terminalOutputStore';

describe('terminalOutputStore', () => {
  beforeEach(() => {
    useTerminalOutputStore.setState({ outputs: {} });
  });

  describe('appendOutput', () => {
    it('appends data to session', () => {
      useTerminalOutputStore.getState().appendOutput('s1', 'line1');
      useTerminalOutputStore.getState().appendOutput('s1', 'line2');

      expect(useTerminalOutputStore.getState().getOutput('s1')).toEqual(['line1', 'line2']);
    });

    it('trims to MAX_LINES', () => {
      const store = useTerminalOutputStore.getState();
      for (let i = 0; i < 5002; i++) {
        store.appendOutput('s1', `line-${i}`);
      }

      const output = useTerminalOutputStore.getState().getOutput('s1');
      expect(output.length).toBe(5000);
      expect(output[0]).toBe('line-2');
    });
  });

  describe('getOutput', () => {
    it('returns empty array for unknown session', () => {
      expect(useTerminalOutputStore.getState().getOutput('unknown')).toEqual([]);
    });
  });

  describe('clearOutput', () => {
    it('clears specific session', () => {
      useTerminalOutputStore.getState().appendOutput('s1', 'data');
      useTerminalOutputStore.getState().appendOutput('s2', 'data');

      useTerminalOutputStore.getState().clearOutput('s1');

      expect(useTerminalOutputStore.getState().getOutput('s1')).toEqual([]);
      expect(useTerminalOutputStore.getState().getOutput('s2')).toEqual(['data']);
    });
  });

  describe('clearAll', () => {
    it('clears all sessions', () => {
      useTerminalOutputStore.getState().appendOutput('s1', 'data');
      useTerminalOutputStore.getState().appendOutput('s2', 'data');

      useTerminalOutputStore.getState().clearAll();

      expect(useTerminalOutputStore.getState().outputs).toEqual({});
    });
  });
});
