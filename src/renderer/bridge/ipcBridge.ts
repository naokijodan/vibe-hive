// IPC Bridge - Renderer process API abstraction
// This module provides type-safe access to Electron IPC

// Check if running in Electron environment
const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

// Helper to safely call electronAPI methods
function safeCall<T>(fn: () => T, fallback: T): T {
  if (!isElectron) {
    console.warn('[ipcBridge] Not running in Electron, returning fallback');
    return fallback;
  }
  return fn();
}

// Helper for async calls
function safeCallAsync<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isElectron) {
    console.warn('[ipcBridge] Not running in Electron, returning fallback');
    return Promise.resolve(fallback);
  }
  return fn();
}

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
import type { PluginInfo } from '../../shared/types/plugin';
import type {
  AgentContext,
  AgentContextCreateInput,
} from '../../shared/types/context';
import type {
  NodeExecution,
  ExecuteNodeRequest,
  ExecuteNodeResult,
  OrchestrationState,
  OrchestrateNodeRequest,
  ApproveRejectRequest,
} from '../../shared/types/orchestration';
import type {
  CollabConnectionStatus,
  CollabUser,
  CollabChatMessage,
  CollabSettings,
} from '../../shared/types/collaboration';
import type {
  ProfilerSummary,
  ProfilerFilter,
  ExecutionProfile,
  TaskStats,
  SessionStats,
  TimelineEntry,
} from '../../shared/types/profiler';

export const ipcBridge = {
  // Session operations
  session: {
    create: (config: unknown) => safeCallAsync(() => window.electronAPI.createSession(config), null),
    get: (id: string) => safeCallAsync(() => window.electronAPI.getSession(id), null),
    list: () => safeCallAsync(() => window.electronAPI.listSessions(), []),
    delete: (id: string) => safeCallAsync(() => window.electronAPI.deleteSession(id), undefined),
    switch: (id: string) => safeCallAsync(() => window.electronAPI.switchSession(id), undefined),
    getActive: () => safeCallAsync(() => window.electronAPI.getActiveSession(), null),
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
    create: (input: TaskCreateInput) => safeCallAsync(() => window.electronAPI.dbTaskCreate(input) as Promise<Task>, null as unknown as Task),
    get: (id: string) => safeCallAsync(() => window.electronAPI.dbTaskGet(id) as Promise<Task | null>, null),
    getBySession: (sessionId: string) => safeCallAsync(() => window.electronAPI.dbTaskGetBySession(sessionId) as Promise<Task[]>, []),
    getByStatus: (status: TaskStatus) => safeCallAsync(() => window.electronAPI.dbTaskGetByStatus(status) as Promise<Task[]>, []),
    getAll: () => safeCallAsync(() => window.electronAPI.dbTaskGetAll() as Promise<Task[]>, []),
    update: (id: string, updates: Partial<Task>) => safeCallAsync(() => window.electronAPI.dbTaskUpdate(id, updates) as Promise<Task | null>, null),
    updateStatus: (id: string, status: TaskStatus) => safeCallAsync(() => window.electronAPI.dbTaskUpdateStatus(id, status) as Promise<Task | null>, null),
    delete: (id: string) => safeCallAsync(() => window.electronAPI.dbTaskDelete(id), undefined),
    // Subtasks
    getSubtasks: (parentId: string) => safeCallAsync(() => window.electronAPI.dbTaskGetSubtasks(parentId) as Promise<Task[]>, []),
    createSubtasks: (parentId: string, titles: string[]) => safeCallAsync(() => window.electronAPI.dbTaskCreateSubtasks(parentId, titles) as Promise<Task[]>, []),
    // Dependencies
    checkDependencies: (taskId: string) => safeCallAsync(() => window.electronAPI.dbTaskCheckDependencies(taskId), { ready: true, blockedBy: [] }),
    wouldCreateCircularDependency: (taskId: string, newDependencyId: string) => safeCallAsync(() => window.electronAPI.dbTaskWouldCreateCircularDependency(taskId, newDependencyId), false),
    getDependentTasks: (taskId: string) => safeCallAsync(() => window.electronAPI.dbTaskGetDependentTasks(taskId) as Promise<Task[]>, []),
    getDependencyTree: (taskId: string) => safeCallAsync(() => window.electronAPI.dbTaskGetDependencyTree(taskId), { task: null, dependencies: [], dependents: [] }),
    // Review Feedback
    clearReviewFeedback: (taskId: string) => safeCallAsync(() => window.electronAPI.dbTaskClearReviewFeedback(taskId) as Promise<Task | null>, null),
    // Ready to Execute
    isReadyToExecute: (taskId: string) => safeCallAsync(() => window.electronAPI.dbTaskIsReadyToExecute(taskId) as Promise<boolean>, false),
    getReadyTasks: () => safeCallAsync(() => window.electronAPI.dbTaskGetReadyTasks() as Promise<Task[]>, []),
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
      safeCallAsync(() => window.electronAPI.executionStart(request) as Promise<StartExecutionResponse>, { success: false, error: 'Not in Electron' } as StartExecutionResponse),
    cancel: (executionId: string) => safeCallAsync(() => window.electronAPI.executionCancel(executionId), undefined),
    get: (executionId: string) =>
      safeCallAsync(() => window.electronAPI.executionGet(executionId) as Promise<ExecutionRecord | null>, null),
    getByTask: (taskId: string) =>
      safeCallAsync(() => window.electronAPI.executionGetByTask(taskId) as Promise<ExecutionRecord[]>, []),
    getAll: () => safeCallAsync(() => window.electronAPI.executionGetAll() as Promise<ExecutionRecord[]>, []),
    getRunning: () => safeCallAsync(() => window.electronAPI.executionGetRunning() as Promise<ExecutionRecord[]>, []),
    onStarted: (callback: (data: { executionId: string; taskId: string }) => void) =>
      isElectron ? window.electronAPI.onExecutionStarted(callback) : (() => {}),
    onCompleted: (callback: (execution: ExecutionRecord) => void) =>
      isElectron ? window.electronAPI.onExecutionCompleted(callback) : (() => {}),
    onCancelled: (callback: (execution: ExecutionRecord) => void) =>
      isElectron ? window.electronAPI.onExecutionCancelled(callback) : (() => {}),
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
      window.electronAPI.workflowExportAsTemplate(workflowId, templateData) as Promise<{ success: boolean; template?: unknown }>,
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
      safeCallAsync(
        () => window.electronAPI.themeGetPresets() as Promise<Array<{ id: string; name: string; colors: Record<string, string> }>>,
        []
      ),
    getSettings: () =>
      safeCallAsync(
        () => window.electronAPI.themeGetSettings() as Promise<{ activeThemeId: string; customAccent?: string }>,
        { activeThemeId: 'default' }
      ),
    getActiveColors: () =>
      safeCallAsync(
        () => window.electronAPI.themeGetActiveColors() as Promise<Record<string, string>>,
        {}
      ),
    setTheme: (themeId: string) =>
      safeCallAsync(
        () => window.electronAPI.themeSetTheme(themeId) as Promise<Record<string, string>>,
        {}
      ),
    setCustomAccent: (color: string) =>
      safeCallAsync(
        () => window.electronAPI.themeSetCustomAccent(color) as Promise<Record<string, string>>,
        {}
      ),
    resetCustomAccent: () =>
      safeCallAsync(
        () => window.electronAPI.themeResetCustomAccent() as Promise<Record<string, string>>,
        {}
      ),
  },

  // Plugin operations
  plugin: {
    list: () =>
      window.electronAPI.pluginList() as Promise<PluginInfo[]>,
    get: (pluginId: string) =>
      window.electronAPI.pluginGet(pluginId) as Promise<PluginInfo | null>,
    activate: (pluginId: string) =>
      window.electronAPI.pluginActivate(pluginId) as Promise<{ success: boolean; error?: string }>,
    deactivate: (pluginId: string) =>
      window.electronAPI.pluginDeactivate(pluginId) as Promise<{ success: boolean; error?: string }>,
    updateSetting: (pluginId: string, key: string, value: unknown) =>
      window.electronAPI.pluginUpdateSetting(pluginId, key, value) as Promise<PluginInfo>,
    getDir: () =>
      window.electronAPI.pluginGetDir(),
    refresh: () =>
      window.electronAPI.pluginRefresh() as Promise<PluginInfo[]>,
  },

  // Collaboration operations
  collab: {
    startHost: (sessionId: string, settings: CollabSettings, port?: number) =>
      window.electronAPI.collabStartHost(sessionId, settings, port) as Promise<{ success: boolean; port: number; error?: string }>,
    join: (host: string, port: number, settings: CollabSettings) =>
      window.electronAPI.collabJoin(host, port, settings) as Promise<{ success: boolean; error?: string }>,
    disconnect: () => window.electronAPI.collabDisconnect(),
    sendChat: (message: string) =>
      window.electronAPI.collabSendChat(message) as Promise<CollabChatMessage | null>,
    broadcastTask: (eventType: string, payload: unknown) =>
      window.electronAPI.collabBroadcastTask(eventType, payload),
    getStatus: () =>
      window.electronAPI.collabGetStatus() as Promise<CollabConnectionStatus>,
    getUsers: () =>
      window.electronAPI.collabGetUsers() as Promise<CollabUser[]>,
    getChatHistory: () =>
      window.electronAPI.collabGetChatHistory() as Promise<CollabChatMessage[]>,
    onStatus: (callback: (data: CollabConnectionStatus) => void) =>
      window.electronAPI.onCollabStatus(callback as (data: unknown) => void),
    onChat: (callback: (data: CollabChatMessage) => void) =>
      window.electronAPI.onCollabChat(callback as (data: unknown) => void),
    onUserJoined: (callback: (data: CollabUser) => void) =>
      window.electronAPI.onCollabUserJoined(callback as (data: unknown) => void),
    onUserLeft: (callback: (data: CollabUser) => void) =>
      window.electronAPI.onCollabUserLeft(callback as (data: unknown) => void),
    onTaskEvent: (callback: (data: unknown) => void) =>
      window.electronAPI.onCollabTaskEvent(callback),
    onDisconnected: (callback: (data: unknown) => void) =>
      window.electronAPI.onCollabDisconnected(callback),
  },

  // Profiler operations
  profiler: {
    getSummary: (filter?: ProfilerFilter) =>
      window.electronAPI.profilerGetSummary(filter) as Promise<ProfilerSummary>,
    getExecutions: (filter?: ProfilerFilter) =>
      window.electronAPI.profilerGetExecutions(filter) as Promise<ExecutionProfile[]>,
    getTaskStats: (filter?: ProfilerFilter) =>
      window.electronAPI.profilerGetTaskStats(filter) as Promise<TaskStats[]>,
    getSessionStats: () =>
      window.electronAPI.profilerGetSessionStats() as Promise<SessionStats[]>,
    getTimeline: (filter?: ProfilerFilter) =>
      window.electronAPI.profilerGetTimeline(filter) as Promise<TimelineEntry[]>,
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
  // Orchestration operations
  orchestration: {
    execute: (request: ExecuteNodeRequest) =>
      window.electronAPI.orchestrationExecute(request) as Promise<ExecuteNodeResult>,
    stop: (nodeId: string) =>
      window.electronAPI.orchestrationStop(nodeId),
    status: (nodeId: string) =>
      window.electronAPI.orchestrationStatus(nodeId) as Promise<NodeExecution | null>,
    statusAll: (sessionId: string) =>
      window.electronAPI.orchestrationStatusAll(sessionId) as Promise<NodeExecution[]>,
    onStatusChange: (callback: (data: NodeExecution) => void) =>
      window.electronAPI.onOrchestrationStatusChange(callback as (data: unknown) => void),
    orchestrate: (request: OrchestrateNodeRequest) =>
      window.electronAPI.orchestrationOrchestrate(request) as Promise<OrchestrationState>,
    approve: (request: ApproveRejectRequest) =>
      window.electronAPI.orchestrationApprove(request) as Promise<OrchestrationState | null>,
    getState: (nodeId: string) =>
      window.electronAPI.orchestrationGetState(nodeId) as Promise<OrchestrationState | null>,
    onStateChange: (callback: (data: OrchestrationState) => void) =>
      window.electronAPI.onOrchestrationStateChange(callback as (data: unknown) => void),
  },

  // Context operations
  context: {
    save: (input: AgentContextCreateInput) =>
      window.electronAPI.contextSave(input) as Promise<AgentContext>,
    get: (id: string) =>
      window.electronAPI.contextGet(id) as Promise<AgentContext | null>,
    getByNode: (orgNodeId: string, limit?: number) =>
      window.electronAPI.contextGetByNode(orgNodeId, limit) as Promise<AgentContext[]>,
    getChain: (contextId: string) =>
      window.electronAPI.contextGetChain(contextId) as Promise<AgentContext[]>,
    getBySession: (sessionId: string) =>
      window.electronAPI.contextGetBySession(sessionId) as Promise<AgentContext[]>,
    delete: (id: string) =>
      window.electronAPI.contextDelete(id),
  },

  // AI Assistant operations
  aiAssistant: {
    chat: (message: string) => window.electronAPI.aiAssistantChat(message),
    clear: () => window.electronAPI.aiAssistantClear(),
    hasKey: () => window.electronAPI.aiAssistantHasKey(),
  },
};

export default ipcBridge;
