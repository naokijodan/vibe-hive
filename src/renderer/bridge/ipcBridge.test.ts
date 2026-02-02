import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockElectronAPI = {
  createSession: vi.fn().mockResolvedValue({ id: 's1' }),
  getSession: vi.fn().mockResolvedValue({ id: 's1' }),
  listSessions: vi.fn().mockResolvedValue([]),
  deleteSession: vi.fn().mockResolvedValue(true),
  switchSession: vi.fn().mockResolvedValue(true),
  getActiveSession: vi.fn().mockResolvedValue(null),
  terminalWrite: vi.fn().mockResolvedValue(undefined),
  terminalResize: vi.fn().mockResolvedValue(undefined),
  onTerminalData: vi.fn(() => vi.fn()),
  agentSendMessage: vi.fn().mockResolvedValue(undefined),
  onAgentStatus: vi.fn(() => vi.fn()),
  getOrganization: vi.fn().mockResolvedValue({}),
  updateOrganization: vi.fn().mockResolvedValue(true),
  gitStatus: vi.fn().mockResolvedValue(null),
  gitAdd: vi.fn().mockResolvedValue(true),
  gitUnstage: vi.fn().mockResolvedValue(true),
  gitCommit: vi.fn().mockResolvedValue(true),
  gitPush: vi.fn().mockResolvedValue(true),
  gitPull: vi.fn().mockResolvedValue(true),
  gitLog: vi.fn().mockResolvedValue([]),
};

Object.defineProperty(globalThis, 'window', {
  value: { electronAPI: mockElectronAPI },
  writable: true,
});

// Dynamic import after setting up window
const { ipcBridge } = await import('./ipcBridge');

describe('ipcBridge', () => {
  describe('session', () => {
    it('create calls electronAPI.createSession', async () => {
      await ipcBridge.session.create({ name: 'test' });
      expect(mockElectronAPI.createSession).toHaveBeenCalledWith({ name: 'test' });
    });

    it('list calls electronAPI.listSessions', async () => {
      await ipcBridge.session.list();
      expect(mockElectronAPI.listSessions).toHaveBeenCalled();
    });

    it('get calls electronAPI.getSession', async () => {
      await ipcBridge.session.get('s1');
      expect(mockElectronAPI.getSession).toHaveBeenCalledWith('s1');
    });

    it('delete calls electronAPI.deleteSession', async () => {
      await ipcBridge.session.delete('s1');
      expect(mockElectronAPI.deleteSession).toHaveBeenCalledWith('s1');
    });
  });

  describe('terminal', () => {
    it('write calls electronAPI.terminalWrite', async () => {
      await ipcBridge.terminal.write('s1', 'data');
      expect(mockElectronAPI.terminalWrite).toHaveBeenCalledWith('s1', 'data');
    });

    it('onData calls electronAPI.onTerminalData', () => {
      const cb = vi.fn();
      ipcBridge.terminal.onData(cb);
      expect(mockElectronAPI.onTerminalData).toHaveBeenCalledWith(cb);
    });
  });

  describe('git', () => {
    it('status calls electronAPI.gitStatus', async () => {
      await ipcBridge.git.status('/path');
      expect(mockElectronAPI.gitStatus).toHaveBeenCalledWith('/path');
    });

    it('commit calls electronAPI.gitCommit', async () => {
      await ipcBridge.git.commit('/path', 'msg');
      expect(mockElectronAPI.gitCommit).toHaveBeenCalledWith('/path', 'msg');
    });
  });
});
