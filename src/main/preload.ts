import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Session
  createSession: (config: unknown) => ipcRenderer.invoke('session:create', config),
  getSession: (id: string) => ipcRenderer.invoke('session:get', id),
  listSessions: () => ipcRenderer.invoke('session:list'),
  deleteSession: (id: string) => ipcRenderer.invoke('session:delete', id),
  switchSession: (id: string) => ipcRenderer.invoke('session:switch', id),
  getActiveSession: () => ipcRenderer.invoke('session:get-active'),

  // PTY (node-pty)
  ptyCreate: (sessionId: string, cols?: number, rows?: number) =>
    ipcRenderer.invoke('pty:create', sessionId, cols, rows),
  ptyWrite: (sessionId: string, data: string) =>
    ipcRenderer.invoke('pty:write', sessionId, data),
  ptyResize: (sessionId: string, cols: number, rows: number) =>
    ipcRenderer.invoke('pty:resize', sessionId, cols, rows),
  ptyClose: (sessionId: string) =>
    ipcRenderer.invoke('pty:close', sessionId),
  ptyList: () => ipcRenderer.invoke('pty:list'),
  onPtyData: (callback: (sessionId: string, data: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, sessionId: string, data: string) =>
      callback(sessionId, data);
    ipcRenderer.on('pty:data', listener);
    return () => ipcRenderer.removeListener('pty:data', listener);
  },
  onPtyExit: (callback: (sessionId: string, exitCode: number) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, sessionId: string, exitCode: number) =>
      callback(sessionId, exitCode);
    ipcRenderer.on('pty:exit', listener);
    return () => ipcRenderer.removeListener('pty:exit', listener);
  },

  // Terminal (legacy)
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
  agentStart: (sessionId: string, type: 'claude' | 'codex', cwd: string, initialPrompt?: string) =>
    ipcRenderer.invoke('agent:start', sessionId, type, cwd, initialPrompt),
  agentStop: (sessionId: string) =>
    ipcRenderer.invoke('agent:stop', sessionId),
  agentInput: (sessionId: string, data: string) =>
    ipcRenderer.invoke('agent:input', sessionId, data),
  agentResize: (sessionId: string, cols: number, rows: number) =>
    ipcRenderer.invoke('agent:resize', sessionId, cols, rows),
  agentList: () => ipcRenderer.invoke('agent:list'),
  onAgentOutput: (callback: (sessionId: string, data: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, sessionId: string, data: string) =>
      callback(sessionId, data);
    ipcRenderer.on('agent:output', listener);
    return () => ipcRenderer.removeListener('agent:output', listener);
  },
  onAgentExit: (callback: (sessionId: string, exitCode: number) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, sessionId: string, exitCode: number) =>
      callback(sessionId, exitCode);
    ipcRenderer.on('agent:exit', listener);
    return () => ipcRenderer.removeListener('agent:exit', listener);
  },
  onAgentError: (callback: (sessionId: string, error: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, sessionId: string, error: string) =>
      callback(sessionId, error);
    ipcRenderer.on('agent:error', listener);
    return () => ipcRenderer.removeListener('agent:error', listener);
  },
  onAgentLoading: (callback: (sessionId: string, isLoading: boolean) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, sessionId: string, isLoading: boolean) =>
      callback(sessionId, isLoading);
    ipcRenderer.on('agent:loading', listener);
    return () => ipcRenderer.removeListener('agent:loading', listener);
  },
  onAgentTaskComplete: (callback: (sessionId: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, sessionId: string) =>
      callback(sessionId);
    ipcRenderer.on('agent:taskComplete', listener);
    return () => ipcRenderer.removeListener('agent:taskComplete', listener);
  },
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
  gitAdd: (path: string, files: string[]) => ipcRenderer.invoke('git:add', path, files),
  gitUnstage: (path: string, files: string[]) => ipcRenderer.invoke('git:unstage', path, files),
  gitCommit: (path: string, message: string) => ipcRenderer.invoke('git:commit', path, message),
  gitPush: (path: string) => ipcRenderer.invoke('git:push', path),
  gitPull: (path: string) => ipcRenderer.invoke('git:pull', path),
  gitLog: (path: string, limit?: number) => ipcRenderer.invoke('git:log', path, limit),

  // Settings
  settingsGet: () => ipcRenderer.invoke('settings:get'),
  settingsUpdate: (updates: unknown) => ipcRenderer.invoke('settings:update', updates),
  settingsUpdateGit: (gitSettings: unknown) => ipcRenderer.invoke('settings:update-git', gitSettings),
  settingsUpdateApp: (appSettings: unknown) => ipcRenderer.invoke('settings:update-app', appSettings),
  settingsReset: () => ipcRenderer.invoke('settings:reset'),

  // Database - Sessions
  dbSessionCreate: (config: unknown) => ipcRenderer.invoke('db:session:create', config),
  dbSessionGet: (id: string) => ipcRenderer.invoke('db:session:get', id),
  dbSessionGetAll: () => ipcRenderer.invoke('db:session:getAll'),
  dbSessionUpdate: (id: string, updates: unknown) => ipcRenderer.invoke('db:session:update', id, updates),
  dbSessionDelete: (id: string) => ipcRenderer.invoke('db:session:delete', id),
  dbSessionUpdateStatus: (id: string, status: string) => ipcRenderer.invoke('db:session:updateStatus', id, status),

  // Database - Tasks
  dbTaskCreate: (input: unknown) => ipcRenderer.invoke('db:task:create', input),
  dbTaskGet: (id: string) => ipcRenderer.invoke('db:task:get', id),
  dbTaskGetBySession: (sessionId: string) => ipcRenderer.invoke('db:task:getBySession', sessionId),
  dbTaskGetByStatus: (status: string) => ipcRenderer.invoke('db:task:getByStatus', status),
  dbTaskGetAll: () => ipcRenderer.invoke('db:task:getAll'),
  dbTaskUpdate: (id: string, updates: unknown) => ipcRenderer.invoke('db:task:update', id, updates),
  dbTaskUpdateStatus: (id: string, status: string) => ipcRenderer.invoke('db:task:updateStatus', id, status),
  dbTaskDelete: (id: string) => ipcRenderer.invoke('db:task:delete', id),
  // Task - Subtasks
  dbTaskGetSubtasks: (parentId: string) => ipcRenderer.invoke('db:task:getSubtasks', parentId),
  dbTaskCreateSubtasks: (parentId: string, titles: string[]) => ipcRenderer.invoke('db:task:createSubtasks', parentId, titles),
  // Task - Dependencies
  dbTaskCheckDependencies: (taskId: string) => ipcRenderer.invoke('db:task:checkDependencies', taskId),
  // Task - Review Feedback
  dbTaskClearReviewFeedback: (taskId: string) => ipcRenderer.invoke('db:task:clearReviewFeedback', taskId),
  // Task - Dependency Management
  dbTaskWouldCreateCircularDependency: (taskId: string, newDependencyId: string) => ipcRenderer.invoke('db:task:wouldCreateCircularDependency', taskId, newDependencyId),
  dbTaskGetDependentTasks: (taskId: string) => ipcRenderer.invoke('db:task:getDependentTasks', taskId),
  dbTaskGetDependencyTree: (taskId: string) => ipcRenderer.invoke('db:task:getDependencyTree', taskId),
  // Task - Ready to Execute
  dbTaskIsReadyToExecute: (taskId: string) => ipcRenderer.invoke('db:task:isReadyToExecute', taskId),
  dbTaskGetReadyTasks: () => ipcRenderer.invoke('db:task:getReadyTasks'),

  // Database - Terminal Logs
  dbTerminalLogAppend: (sessionId: string, data: string) => ipcRenderer.invoke('db:terminalLog:append', sessionId, data),
  dbTerminalLogGetBySession: (sessionId: string, limit?: number) => ipcRenderer.invoke('db:terminalLog:getBySession', sessionId, limit),
  dbTerminalLogDeleteBySession: (sessionId: string) => ipcRenderer.invoke('db:terminalLog:deleteBySession', sessionId),
  dbTerminalLogCleanup: (daysOld: number) => ipcRenderer.invoke('db:terminalLog:cleanup', daysOld),

  // Database - Agents
  dbAgentCreate: (config: unknown) => ipcRenderer.invoke('db:agent:create', config),
  dbAgentGet: (id: string) => ipcRenderer.invoke('db:agent:get', id),
  dbAgentGetAll: () => ipcRenderer.invoke('db:agent:getAll'),
  dbAgentGetBySession: (sessionId: string) => ipcRenderer.invoke('db:agent:getBySession', sessionId),
  dbAgentUpdate: (id: string, updates: unknown) => ipcRenderer.invoke('db:agent:update', id, updates),
  dbAgentUpdateStatus: (id: string, status: string) => ipcRenderer.invoke('db:agent:updateStatus', id, status),
  dbAgentDelete: (id: string) => ipcRenderer.invoke('db:agent:delete', id),
});

// Type declarations for the exposed API
export interface ElectronAPI {
  createSession: (config: unknown) => Promise<unknown>;
  getSession: (id: string) => Promise<unknown>;
  listSessions: () => Promise<unknown[]>;
  deleteSession: (id: string) => Promise<void>;
  // PTY
  ptyCreate: (sessionId: string, cols?: number, rows?: number) => Promise<string>;
  ptyWrite: (sessionId: string, data: string) => Promise<void>;
  ptyResize: (sessionId: string, cols: number, rows: number) => Promise<void>;
  ptyClose: (sessionId: string) => Promise<void>;
  ptyList: () => Promise<string[]>;
  onPtyData: (callback: (sessionId: string, data: string) => void) => () => void;
  onPtyExit: (callback: (sessionId: string, exitCode: number) => void) => () => void;
  // Terminal (legacy)
  terminalWrite: (sessionId: string, data: string) => Promise<void>;
  terminalResize: (sessionId: string, cols: number, rows: number) => Promise<void>;
  onTerminalData: (callback: (sessionId: string, data: string) => void) => () => void;
  // Agent
  agentStart: (sessionId: string, type: 'claude' | 'codex', cwd: string, initialPrompt?: string) => Promise<string>;
  agentStop: (sessionId: string) => Promise<void>;
  agentInput: (sessionId: string, data: string) => Promise<void>;
  agentResize: (sessionId: string, cols: number, rows: number) => Promise<void>;
  agentList: () => Promise<Array<{ id: string; type: 'claude' | 'codex'; cwd: string }>>;
  onAgentOutput: (callback: (sessionId: string, data: string) => void) => () => void;
  onAgentExit: (callback: (sessionId: string, exitCode: number) => void) => () => void;
  onAgentError: (callback: (sessionId: string, error: string) => void) => () => void;
  onAgentLoading: (callback: (sessionId: string, isLoading: boolean) => void) => () => void;
  onAgentTaskComplete: (callback: (sessionId: string) => void) => () => void;
  agentSendMessage: (sessionId: string, message: string) => Promise<void>;
  onAgentStatus: (callback: (sessionId: string, status: string) => void) => () => void;
  getOrganization: () => Promise<unknown>;
  updateOrganization: (org: unknown) => Promise<void>;
  gitStatus: (path: string) => Promise<unknown>;
  gitAdd: (path: string, files: string[]) => Promise<boolean>;
  gitUnstage: (path: string, files: string[]) => Promise<boolean>;
  gitCommit: (path: string, message: string) => Promise<boolean>;
  gitPush: (path: string) => Promise<boolean>;
  gitPull: (path: string) => Promise<boolean>;
  gitLog: (path: string, limit?: number) => Promise<unknown[]>;
  // Settings
  settingsGet: () => Promise<unknown>;
  settingsUpdate: (updates: unknown) => Promise<unknown>;
  settingsUpdateGit: (gitSettings: unknown) => Promise<unknown>;
  settingsUpdateApp: (appSettings: unknown) => Promise<unknown>;
  settingsReset: () => Promise<unknown>;
  // Database - Sessions
  dbSessionCreate: (config: unknown) => Promise<unknown>;
  dbSessionGet: (id: string) => Promise<unknown>;
  dbSessionGetAll: () => Promise<unknown[]>;
  dbSessionUpdate: (id: string, updates: unknown) => Promise<unknown>;
  dbSessionDelete: (id: string) => Promise<boolean>;
  dbSessionUpdateStatus: (id: string, status: string) => Promise<unknown>;
  // Database - Tasks
  dbTaskCreate: (input: unknown) => Promise<unknown>;
  dbTaskGet: (id: string) => Promise<unknown>;
  dbTaskGetBySession: (sessionId: string) => Promise<unknown[]>;
  dbTaskGetByStatus: (status: string) => Promise<unknown[]>;
  dbTaskGetAll: () => Promise<unknown[]>;
  dbTaskUpdate: (id: string, updates: unknown) => Promise<unknown>;
  dbTaskUpdateStatus: (id: string, status: string) => Promise<unknown>;
  dbTaskDelete: (id: string) => Promise<boolean>;
  // Task - Subtasks
  dbTaskGetSubtasks: (parentId: string) => Promise<unknown[]>;
  dbTaskCreateSubtasks: (parentId: string, titles: string[]) => Promise<unknown[]>;
  // Task - Dependencies
  dbTaskCheckDependencies: (taskId: string) => Promise<{ met: boolean; completed: number; total: number; blocking: unknown[] }>;
  // Task - Review Feedback
  dbTaskClearReviewFeedback: (taskId: string) => Promise<unknown>;
  // Task - Dependency Management
  dbTaskWouldCreateCircularDependency: (taskId: string, newDependencyId: string) => Promise<boolean>;
  dbTaskGetDependentTasks: (taskId: string) => Promise<unknown[]>;
  dbTaskGetDependencyTree: (taskId: string) => Promise<unknown>;
  // Task - Ready to Execute
  dbTaskIsReadyToExecute: (taskId: string) => Promise<boolean>;
  dbTaskGetReadyTasks: () => Promise<unknown[]>;
  // Database - Terminal Logs
  dbTerminalLogAppend: (sessionId: string, data: string) => Promise<void>;
  dbTerminalLogGetBySession: (sessionId: string, limit?: number) => Promise<unknown[]>;
  dbTerminalLogDeleteBySession: (sessionId: string) => Promise<number>;
  dbTerminalLogCleanup: (daysOld: number) => Promise<number>;
  // Database - Agents
  dbAgentCreate: (config: unknown) => Promise<unknown>;
  dbAgentGet: (id: string) => Promise<unknown>;
  dbAgentGetAll: () => Promise<unknown[]>;
  dbAgentGetBySession: (sessionId: string) => Promise<unknown[]>;
  dbAgentUpdate: (id: string, updates: unknown) => Promise<unknown>;
  dbAgentUpdateStatus: (id: string, status: string) => Promise<unknown>;
  dbAgentDelete: (id: string) => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
