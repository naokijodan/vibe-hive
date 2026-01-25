import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Session
  createSession: (config: unknown) => ipcRenderer.invoke('session:create', config),
  getSession: (id: string) => ipcRenderer.invoke('session:get', id),
  listSessions: () => ipcRenderer.invoke('session:list'),
  deleteSession: (id: string) => ipcRenderer.invoke('session:delete', id),

  // Terminal
  terminalWrite: (sessionId: string, data: string) =>
    ipcRenderer.invoke('terminal:write', sessionId, data),
  terminalResize: (sessionId: string, cols: number, rows: number) =>
    ipcRenderer.invoke('terminal:resize', sessionId, cols, rows),
  onTerminalData: (callback: (sessionId: string, data: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, sessionId: string, data: string) =>
      callback(sessionId, data);
    ipcRenderer.on('terminal:data', listener);
    return () => ipcRenderer.removeListener('terminal:data', listener);
  },

  // Agent
  agentSendMessage: (sessionId: string, message: string) =>
    ipcRenderer.invoke('agent:send', sessionId, message),
  onAgentStatus: (callback: (sessionId: string, status: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, sessionId: string, status: string) =>
      callback(sessionId, status);
    ipcRenderer.on('agent:status', listener);
    return () => ipcRenderer.removeListener('agent:status', listener);
  },

  // Organization
  getOrganization: () => ipcRenderer.invoke('org:get'),
  updateOrganization: (org: unknown) => ipcRenderer.invoke('org:update', org),

  // Git
  gitStatus: (path: string) => ipcRenderer.invoke('git:status', path),
  gitCommit: (path: string, message: string) => ipcRenderer.invoke('git:commit', path, message),
});

// Type declarations for the exposed API
export interface ElectronAPI {
  createSession: (config: unknown) => Promise<unknown>;
  getSession: (id: string) => Promise<unknown>;
  listSessions: () => Promise<unknown[]>;
  deleteSession: (id: string) => Promise<void>;
  terminalWrite: (sessionId: string, data: string) => Promise<void>;
  terminalResize: (sessionId: string, cols: number, rows: number) => Promise<void>;
  onTerminalData: (callback: (sessionId: string, data: string) => void) => () => void;
  agentSendMessage: (sessionId: string, message: string) => Promise<void>;
  onAgentStatus: (callback: (sessionId: string, status: string) => void) => () => void;
  getOrganization: () => Promise<unknown>;
  updateOrganization: (org: unknown) => Promise<void>;
  gitStatus: (path: string) => Promise<unknown>;
  gitCommit: (path: string, message: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
