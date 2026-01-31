/* eslint-disable @typescript-eslint/no-explicit-any */
export {};

declare global {
  interface Window {
    electronAPI: {
      // Session
      createSession: (...args: any[]) => any;
      dbSessionCreate: (...args: any[]) => any;
      dbSessionGetAll: (...args: any[]) => any;
      dbAgentGetAll: (...args: any[]) => any;
      getSession: (...args: any[]) => any;
      listSessions: (...args: any[]) => any;
      deleteSession: (...args: any[]) => any;
      switchSession: (...args: any[]) => any;
      getActiveSession: (...args: any[]) => any;
      // Terminal / PTY
      terminalWrite: (...args: any[]) => any;
      terminalResize: (...args: any[]) => any;
      onTerminalData: (...args: any[]) => any;
      ptyCreate: (...args: any[]) => any;
      ptyWrite: (...args: any[]) => any;
      ptyResize: (...args: any[]) => any;
      onPtyData: (...args: any[]) => any;
      onPtyExit: (...args: any[]) => any;
      ptyClose: (...args: any[]) => any;
      // Agent
      agentSendMessage: (...args: any[]) => any;
      agentStart: (...args: any[]) => any;
      agentResize: (...args: any[]) => any;
      agentInput: (...args: any[]) => any;
      dbAgentCreate: (...args: any[]) => any;
      dbAgentUpdate: (...args: any[]) => any;
      dbAgentDelete: (...args: any[]) => any;
      onAgentStatus: (...args: any[]) => any;
      onAgentOutput: (...args: any[]) => any;
      onAgentExit: (...args: any[]) => any;
      onAgentError: (...args: any[]) => any;
      onAgentLoading: (...args: any[]) => any;
      onAgentTaskComplete: (...args: any[]) => any;
      // Organization
      getOrganization: (...args: any[]) => any;
      updateOrganization: (...args: any[]) => any;
      // Git
      gitStatus: (...args: any[]) => any;
      gitAdd: (...args: any[]) => any;
      gitUnstage: (...args: any[]) => any;
      gitCommit: (...args: any[]) => any;
      gitPush: (...args: any[]) => any;
      gitPull: (...args: any[]) => any;
      gitLog: (...args: any[]) => any;
      // Task DB
      dbTaskCreate: (...args: any[]) => any;
      dbTaskGet: (...args: any[]) => any;
      dbTaskGetBySession: (...args: any[]) => any;
      dbTaskGetByStatus: (...args: any[]) => any;
      dbTaskGetAll: (...args: any[]) => any;
      dbTaskUpdate: (...args: any[]) => any;
      dbTaskUpdateStatus: (...args: any[]) => any;
      dbTaskDelete: (...args: any[]) => any;
      dbTaskGetSubtasks: (...args: any[]) => any;
      dbTaskCreateSubtasks: (...args: any[]) => any;
      dbTaskCheckDependencies: (...args: any[]) => any;
      dbTaskWouldCreateCircularDependency: (...args: any[]) => any;
      dbTaskGetDependentTasks: (...args: any[]) => any;
      dbTaskGetDependencyTree: (...args: any[]) => any;
      dbTaskClearReviewFeedback: (...args: any[]) => any;
      dbTaskIsReadyToExecute: (...args: any[]) => any;
      dbTaskGetReadyTasks: (...args: any[]) => any;
      // Settings
      settingsGet: (...args: any[]) => any;
      settingsUpdate: (...args: any[]) => any;
      settingsUpdateGit: (...args: any[]) => any;
      settingsUpdateApp: (...args: any[]) => any;
      settingsReset: (...args: any[]) => any;
      // Execution
      executionStart: (...args: any[]) => any;
      executionCancel: (...args: any[]) => any;
      executionGet: (...args: any[]) => any;
      executionGetByTask: (...args: any[]) => any;
      executionGetAll: (...args: any[]) => any;
      executionGetRunning: (...args: any[]) => any;
      onExecutionStarted: (...args: any[]) => any;
      onExecutionCompleted: (...args: any[]) => any;
      onExecutionCancelled: (...args: any[]) => any;
      // Task Template
      templateCreate: (...args: any[]) => any;
      templateGet: (...args: any[]) => any;
      templateGetAll: (...args: any[]) => any;
      templateGetByCategory: (...args: any[]) => any;
      templateGetPopular: (...args: any[]) => any;
      templateUpdate: (...args: any[]) => any;
      templateIncrementUsage: (...args: any[]) => any;
      templateDelete: (...args: any[]) => any;
      templateSearch: (...args: any[]) => any;
      // Workflow
      workflowCreate: (...args: any[]) => any;
      workflowUpdate: (...args: any[]) => any;
      workflowDelete: (...args: any[]) => any;
      workflowGetById: (...args: any[]) => any;
      workflowGetAll: (...args: any[]) => any;
      workflowGetBySession: (...args: any[]) => any;
      workflowExecute: (...args: any[]) => any;
      workflowCancel: (...args: any[]) => any;
      workflowGetExecution: (...args: any[]) => any;
      workflowGetExecutions: (...args: any[]) => any;
      workflowExport: (...args: any[]) => any;
      workflowImport: (...args: any[]) => any;
      invoke: (...args: any[]) => any;
      onWorkflowExecutionStarted?: (...args: any[]) => any;
      onWorkflowExecutionCompleted?: (...args: any[]) => any;
      onWorkflowExecutionCancelled?: (...args: any[]) => any;
      // Export/Import
      exportImportExport: (...args: any[]) => any;
      exportImportImport: (...args: any[]) => any;
      // Notification
      notificationTest: (...args: any[]) => any;
      notificationSetWebhookUrl: (...args: any[]) => any;
      // Webhook
      webhookStart: (...args: any[]) => any;
      webhookStop: (...args: any[]) => any;
      webhookStatus: (...args: any[]) => any;
      // Workflow Template
      workflowTemplateGetAll: (...args: any[]) => any;
      workflowTemplateGet: (...args: any[]) => any;
      workflowTemplateGetByCategory: (...args: any[]) => any;
      workflowTemplateCreate: (...args: any[]) => any;
      workflowTemplateUpdate: (...args: any[]) => any;
      workflowTemplateDelete: (...args: any[]) => any;
      workflowTemplateApply: (...args: any[]) => any;
    };
  }
}
