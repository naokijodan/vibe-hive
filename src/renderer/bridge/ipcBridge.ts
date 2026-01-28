// IPC Bridge - Renderer process API abstraction
// This module provides type-safe access to Electron IPC
import type { Task, TaskCreateInput, TaskStatus } from '../../shared/types/task';
import type {
  ExecutionRecord,
  StartExecutionRequest,
  StartExecutionResponse,
} from '../../shared/types/execution';

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
    unstage: (path: string, files: string[]) => window.electronAPI.gitUnstage(path, files),
    commit: (path: string, message: string) => window.electronAPI.gitCommit(path, message),
    push: (path: string) => window.electronAPI.gitPush(path),
    pull: (path: string) => window.electronAPI.gitPull(path),
    log: (path: string, limit?: number) => window.electronAPI.gitLog(path, limit),
  },

  // Task operations
  task: {
    create: (input: TaskCreateInput) => window.electronAPI.dbTaskCreate(input) as Promise<Task>,
    get: (id: string) => window.electronAPI.dbTaskGet(id) as Promise<Task | null>,
    getBySession: (sessionId: string) => window.electronAPI.dbTaskGetBySession(sessionId) as Promise<Task[]>,
    getByStatus: (status: TaskStatus) => window.electronAPI.dbTaskGetByStatus(status) as Promise<Task[]>,
    getAll: () => window.electronAPI.dbTaskGetAll() as Promise<Task[]>,
    update: (id: string, updates: Partial<Task>) => window.electronAPI.dbTaskUpdate(id, updates) as Promise<Task | null>,
    updateStatus: (id: string, status: TaskStatus) => window.electronAPI.dbTaskUpdateStatus(id, status) as Promise<Task | null>,
    delete: (id: string) => window.electronAPI.dbTaskDelete(id),
    // Subtasks
    getSubtasks: (parentId: string) => window.electronAPI.dbTaskGetSubtasks(parentId) as Promise<Task[]>,
    createSubtasks: (parentId: string, titles: string[]) => window.electronAPI.dbTaskCreateSubtasks(parentId, titles) as Promise<Task[]>,
    // Dependencies
    checkDependencies: (taskId: string) => window.electronAPI.dbTaskCheckDependencies(taskId),
    wouldCreateCircularDependency: (taskId: string, newDependencyId: string) => window.electronAPI.dbTaskWouldCreateCircularDependency(taskId, newDependencyId),
    getDependentTasks: (taskId: string) => window.electronAPI.dbTaskGetDependentTasks(taskId) as Promise<Task[]>,
    getDependencyTree: (taskId: string) => window.electronAPI.dbTaskGetDependencyTree(taskId),
    // Review Feedback
    clearReviewFeedback: (taskId: string) => window.electronAPI.dbTaskClearReviewFeedback(taskId) as Promise<Task | null>,
    // Ready to Execute
    isReadyToExecute: (taskId: string) => window.electronAPI.dbTaskIsReadyToExecute(taskId) as Promise<boolean>,
    getReadyTasks: () => window.electronAPI.dbTaskGetReadyTasks() as Promise<Task[]>,
  },

  // Settings operations
  settings: {
    get: () => window.electronAPI.settingsGet(),
    update: (updates: unknown) => window.electronAPI.settingsUpdate(updates),
    updateGit: (gitSettings: unknown) => window.electronAPI.settingsUpdateGit(gitSettings),
    updateApp: (appSettings: unknown) => window.electronAPI.settingsUpdateApp(appSettings),
    reset: () => window.electronAPI.settingsReset(),
  },

  // Execution operations
  execution: {
    start: (request: StartExecutionRequest) =>
      window.electronAPI.executionStart(request) as Promise<StartExecutionResponse>,
    cancel: (executionId: string) => window.electronAPI.executionCancel(executionId),
    get: (executionId: string) =>
      window.electronAPI.executionGet(executionId) as Promise<ExecutionRecord | null>,
    getByTask: (taskId: string) =>
      window.electronAPI.executionGetByTask(taskId) as Promise<ExecutionRecord[]>,
    getAll: () => window.electronAPI.executionGetAll() as Promise<ExecutionRecord[]>,
    getRunning: () => window.electronAPI.executionGetRunning() as Promise<ExecutionRecord[]>,
    onStarted: (callback: (data: { executionId: string; taskId: string }) => void) =>
      window.electronAPI.onExecutionStarted(callback),
    onCompleted: (callback: (execution: ExecutionRecord) => void) =>
      window.electronAPI.onExecutionCompleted(callback),
    onCancelled: (callback: (execution: ExecutionRecord) => void) =>
      window.electronAPI.onExecutionCancelled(callback),
  },
};

export default ipcBridge;
