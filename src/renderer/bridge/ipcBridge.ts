// IPC Bridge - Renderer process API abstraction
// This module provides type-safe access to Electron IPC
import type { Task, TaskCreateInput, TaskStatus } from '../../shared/types/task';
import type {
  ExecutionRecord,
  StartExecutionRequest,
  StartExecutionResponse,
} from '../../shared/types/execution';
import type {
  TaskTemplate,
  TaskTemplateCreateInput,
  TaskTemplateUpdateInput,
} from '../../shared/types/taskTemplate';
import type {
  Workflow,
  WorkflowExecution,
  CreateWorkflowParams,
  UpdateWorkflowParams,
  ExecuteWorkflowParams,
  WorkflowExecutionResult,
} from '../../shared/types/workflow';
import type {
  WorkflowTemplate,
  TemplateCreateInput,
  TemplateUpdateInput,
} from '../../shared/types/template';

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
    updateAgent: (agentSettings: unknown) => window.electronAPI.settingsUpdateAgent(agentSettings),
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

  // Task Template operations
  taskTemplate: {
    create: (input: TaskTemplateCreateInput) =>
      window.electronAPI.templateCreate(input) as Promise<TaskTemplate>,
    get: (id: string) =>
      window.electronAPI.templateGet(id) as Promise<TaskTemplate | null>,
    getAll: () =>
      window.electronAPI.templateGetAll() as Promise<TaskTemplate[]>,
    getByCategory: (category: string) =>
      window.electronAPI.templateGetByCategory(category) as Promise<TaskTemplate[]>,
    getPopular: (limit?: number) =>
      window.electronAPI.templateGetPopular(limit) as Promise<TaskTemplate[]>,
    update: (id: string, updates: TaskTemplateUpdateInput) =>
      window.electronAPI.templateUpdate(id, updates) as Promise<TaskTemplate | null>,
    incrementUsage: (id: string) =>
      window.electronAPI.templateIncrementUsage(id),
    delete: (id: string) =>
      window.electronAPI.templateDelete(id),
    search: (query: string) =>
      window.electronAPI.templateSearch(query) as Promise<TaskTemplate[]>,
  },

  // Workflow operations
  workflow: {
    create: (params: CreateWorkflowParams) =>
      window.electronAPI.workflowCreate(params) as Promise<Workflow>,
    update: (params: UpdateWorkflowParams) =>
      window.electronAPI.workflowUpdate(params) as Promise<Workflow>,
    delete: (id: number) => window.electronAPI.workflowDelete(id),
    getById: (id: number) =>
      window.electronAPI.workflowGetById(id) as Promise<Workflow | null>,
    getAll: () => window.electronAPI.workflowGetAll() as Promise<Workflow[]>,
    getBySession: (sessionId: number) =>
      window.electronAPI.workflowGetBySession(sessionId) as Promise<Workflow[]>,
    execute: (params: ExecuteWorkflowParams) =>
      window.electronAPI.workflowExecute(params) as Promise<WorkflowExecutionResult>,
    cancel: (executionId: number) => window.electronAPI.workflowCancel(executionId),
    getExecution: (executionId: number) =>
      window.electronAPI.workflowGetExecution(executionId) as Promise<WorkflowExecution | null>,
    getExecutions: (workflowId: number) =>
      window.electronAPI.workflowGetExecutions(workflowId) as Promise<WorkflowExecution[]>,
    export: (workflowId: number) =>
      window.electronAPI.workflowExport(workflowId) as Promise<{ success: boolean; filePath?: string; canceled?: boolean }>,
    import: (sessionId: number) =>
      window.electronAPI.workflowImport(sessionId) as Promise<{ success: boolean; workflow?: Workflow; canceled?: boolean; errors?: string[]; warnings?: string[] }>,
    exportAsTemplate: (workflowId: number, templateData: { category?: 'automation' | 'notification' | 'data-processing' | 'custom'; thumbnail?: string }) =>
      window.electronAPI.invoke('workflow:exportAsTemplate', workflowId, templateData) as Promise<{ success: boolean; template?: any }>,
    onExecutionStarted: (callback: (data: { executionId: number; workflowId: number }) => void) =>
      window.electronAPI.onWorkflowExecutionStarted?.(callback),
    onExecutionCompleted: (callback: (data: { executionId: number; status: string; error?: string }) => void) =>
      window.electronAPI.onWorkflowExecutionCompleted?.(callback),
    onExecutionCancelled: (callback: (data: { executionId: number }) => void) =>
      window.electronAPI.onWorkflowExecutionCancelled?.(callback),
  },

  // Notification operations
  notification: {
    test: (type: 'discord' | 'slack' | 'email') =>
      window.electronAPI.notificationTest({ type }),
    setWebhookUrl: (type: 'discord' | 'slack', url: string) =>
      window.electronAPI.notificationSetWebhookUrl({ type, url }),
  },

  // Webhook operations
  webhook: {
    start: (port?: number) =>
      window.electronAPI.webhookStart(port ? { port } : undefined),
    stop: () => window.electronAPI.webhookStop(),
    status: () =>
      window.electronAPI.webhookStatus() as Promise<{
        running: boolean;
        port?: number;
        url?: string;
      }>,
  },

  // Coordination operations
  coordination: {
    sendMessage: (fromAgentId: string, toAgentId: string | null, type: string, content: string, metadata?: Record<string, unknown>) =>
      window.electronAPI.coordinationSendMessage(fromAgentId, toAgentId, type, content, metadata),
    delegateTask: (taskId: string, fromAgentId: string, toAgentId: string, reason?: string) =>
      window.electronAPI.coordinationDelegateTask(taskId, fromAgentId, toAgentId, reason),
    respondDelegation: (delegationId: string, accepted: boolean) =>
      window.electronAPI.coordinationRespondDelegation(delegationId, accepted),
    getMessages: (limit?: number) =>
      window.electronAPI.coordinationGetMessages(limit) as Promise<unknown[]>,
    getMessagesByAgent: (agentId: string) =>
      window.electronAPI.coordinationGetMessagesByAgent(agentId) as Promise<unknown[]>,
    getDelegations: () =>
      window.electronAPI.coordinationGetDelegations() as Promise<unknown[]>,
    clearMessages: () =>
      window.electronAPI.coordinationClearMessages(),
    onMessage: (callback: (data: unknown) => void) =>
      window.electronAPI.onCoordinationMessage(callback),
    onDelegation: (callback: (data: unknown) => void) =>
      window.electronAPI.onCoordinationDelegation(callback),
  },

  // Desktop Notification operations
  desktopNotification: {
    getSettings: () =>
      window.electronAPI.desktopNotificationGetSettings() as Promise<{
        enabled: boolean;
        onTaskComplete: boolean;
        onExecutionComplete: boolean;
        onExecutionFailed: boolean;
        onAgentStopped: boolean;
      }>,
    updateSettings: (updates: Record<string, boolean>) =>
      window.electronAPI.desktopNotificationUpdateSettings(updates) as Promise<{
        enabled: boolean;
        onTaskComplete: boolean;
        onExecutionComplete: boolean;
        onExecutionFailed: boolean;
        onAgentStopped: boolean;
      }>,
    test: () =>
      window.electronAPI.desktopNotificationTest() as Promise<{ success: boolean }>,
  },

  // Export/Import operations
  exportImport: {
    export: (targets: string[]) =>
      window.electronAPI.exportImportExport(targets) as Promise<{
        success: boolean;
        filePath?: string;
        canceled?: boolean;
        stats?: { tasks?: number; taskTemplates?: number; workflows?: number; workflowTemplates?: number };
      }>,
    import: (mode: 'merge' | 'overwrite') =>
      window.electronAPI.exportImportImport(mode) as Promise<{
        success: boolean;
        canceled?: boolean;
        errors?: string[];
        warnings?: string[];
        stats?: { tasks?: number; taskTemplates?: number; workflows?: number; workflowTemplates?: number };
      }>,
  },

  // Workflow Template operations
  workflowTemplate: {
    getAll: (): Promise<WorkflowTemplate[]> =>
      window.electronAPI.workflowTemplateGetAll() as Promise<WorkflowTemplate[]>,
    get: (id: number): Promise<WorkflowTemplate | null> =>
      window.electronAPI.workflowTemplateGet(id) as Promise<WorkflowTemplate | null>,
    getByCategory: (category: string): Promise<WorkflowTemplate[]> =>
      window.electronAPI.workflowTemplateGetByCategory(category) as Promise<WorkflowTemplate[]>,
    create: (input: TemplateCreateInput): Promise<WorkflowTemplate> =>
      window.electronAPI.workflowTemplateCreate(input) as Promise<WorkflowTemplate>,
    update: (id: number, input: TemplateUpdateInput): Promise<WorkflowTemplate | null> =>
      window.electronAPI.workflowTemplateUpdate(id, input) as Promise<WorkflowTemplate | null>,
    delete: (id: number): Promise<void> =>
      window.electronAPI.workflowTemplateDelete(id),
    apply: (templateId: number, sessionId: number): Promise<Workflow> =>
      window.electronAPI.workflowTemplateApply(templateId, sessionId) as Promise<Workflow>,
  },
  // Theme operations
  theme: {
    getPresets: () =>
      window.electronAPI.themeGetPresets() as Promise<Array<{
        id: string; name: string; colors: Record<string, string>;
      }>>,
    getSettings: () =>
      window.electronAPI.themeGetSettings() as Promise<{
        activeThemeId: string; customAccent?: string;
      }>,
    getActiveColors: () =>
      window.electronAPI.themeGetActiveColors() as Promise<Record<string, string>>,
    setTheme: (themeId: string) =>
      window.electronAPI.themeSetTheme(themeId) as Promise<Record<string, string>>,
    setCustomAccent: (color: string) =>
      window.electronAPI.themeSetCustomAccent(color) as Promise<Record<string, string>>,
    resetCustomAccent: () =>
      window.electronAPI.themeResetCustomAccent() as Promise<Record<string, string>>,
  },

  // Claude Hooks operations
  claudeHooks: {
    getHooks: () =>
      window.electronAPI.claudeHooksGetHooks() as Promise<Array<{
        id: string; event: string; matcher?: string; command: string; enabled: boolean; description?: string;
      }>>,
    addHook: (hook: { event: string; matcher?: string; command: string; enabled: boolean; description?: string }) =>
      window.electronAPI.claudeHooksAddHook(hook),
    updateHook: (id: string, updates: Record<string, unknown>) =>
      window.electronAPI.claudeHooksUpdateHook(id, updates),
    deleteHook: (id: string) =>
      window.electronAPI.claudeHooksDeleteHook(id) as Promise<boolean>,
    getPresets: () =>
      window.electronAPI.claudeHooksGetPresets() as Promise<Array<{
        event: string; matcher?: string; command: string; enabled: boolean; description?: string;
      }>>,
    addPreset: (index: number) =>
      window.electronAPI.claudeHooksAddPreset(index),
    getLogs: () =>
      window.electronAPI.claudeHooksGetLogs() as Promise<Array<{
        id: string; hookId: string; event: string; command: string; output?: string; exitCode?: number; timestamp: string;
      }>>,
    clearLogs: () =>
      window.electronAPI.claudeHooksClearLogs(),
    reload: () =>
      window.electronAPI.claudeHooksReload(),
    onLog: (callback: (data: unknown) => void) =>
      window.electronAPI.onClaudeHooksLog(callback),
  },
};

export default ipcBridge;
