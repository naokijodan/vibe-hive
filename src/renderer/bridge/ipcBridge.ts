// IPC Bridge - Renderer process API abstraction
// This module provides type-safe access to Electron IPC

export const ipcBridge = {
  // Session operations
  session: {
    create: (config: unknown) => window.electronAPI.createSession(config),
    get: (id: string) => window.electronAPI.getSession(id),
    list: () => window.electronAPI.listSessions(),
    delete: (id: string) => window.electronAPI.deleteSession(id),
    switch: (id: string) => window.electronAPI.switchSession(id),
    getActive: () => window.electronAPI.getActiveSession(),
  },

  // Terminal operations
  terminal: {
    write: (sessionId: string, data: string) =>
      window.electronAPI.terminalWrite(sessionId, data),
    resize: (sessionId: string, cols: number, rows: number) =>
      window.electronAPI.terminalResize(sessionId, cols, rows),
    onData: (callback: (sessionId: string, data: string) => void) =>
      window.electronAPI.onTerminalData(callback),
  },

  // Agent operations
  agent: {
    send: (sessionId: string, message: string) =>
      window.electronAPI.agentSendMessage(sessionId, message),
    onStatus: (callback: (sessionId: string, status: string) => void) =>
      window.electronAPI.onAgentStatus(callback),
  },

  // Organization operations
  organization: {
    get: () => window.electronAPI.getOrganization(),
    update: (org: unknown) => window.electronAPI.updateOrganization(org),
  },

  // Git operations
  git: {
    status: (path: string) => window.electronAPI.gitStatus(path),
    add: (path: string, files: string[]) => window.electronAPI.gitAdd(path, files),
    commit: (path: string, message: string) => window.electronAPI.gitCommit(path, message),
    push: (path: string) => window.electronAPI.gitPush(path),
    pull: (path: string) => window.electronAPI.gitPull(path),
    log: (path: string, limit?: number) => window.electronAPI.gitLog(path, limit),
  },
};

export default ipcBridge;
