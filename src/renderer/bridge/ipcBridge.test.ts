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
  // Task operations
  dbTaskCreate: vi.fn().mockResolvedValue({ id: 't1' }),
  dbTaskGet: vi.fn().mockResolvedValue({ id: 't1' }),
  dbTaskGetBySession: vi.fn().mockResolvedValue([]),
  dbTaskGetByStatus: vi.fn().mockResolvedValue([]),
  dbTaskGetAll: vi.fn().mockResolvedValue([]),
  dbTaskUpdate: vi.fn().mockResolvedValue({ id: 't1' }),
  dbTaskUpdateStatus: vi.fn().mockResolvedValue({ id: 't1' }),
  dbTaskDelete: vi.fn().mockResolvedValue(true),
  dbTaskGetSubtasks: vi.fn().mockResolvedValue([]),
  dbTaskCreateSubtasks: vi.fn().mockResolvedValue([]),
  dbTaskCheckDependencies: vi.fn().mockResolvedValue(true),
  dbTaskWouldCreateCircularDependency: vi.fn().mockResolvedValue(false),
  dbTaskGetDependentTasks: vi.fn().mockResolvedValue([]),
  dbTaskGetDependencyTree: vi.fn().mockResolvedValue({}),
  dbTaskClearReviewFeedback: vi.fn().mockResolvedValue({ id: 't1' }),
  dbTaskIsReadyToExecute: vi.fn().mockResolvedValue(true),
  dbTaskGetReadyTasks: vi.fn().mockResolvedValue([]),
  // Settings operations
  settingsGet: vi.fn().mockResolvedValue({}),
  settingsUpdate: vi.fn().mockResolvedValue({}),
  settingsUpdateGit: vi.fn().mockResolvedValue({}),
  settingsUpdateApp: vi.fn().mockResolvedValue({}),
  settingsUpdateAgent: vi.fn().mockResolvedValue({}),
  settingsReset: vi.fn().mockResolvedValue({}),
  // Execution operations
  executionStart: vi.fn().mockResolvedValue({ executionId: 'e1' }),
  executionCancel: vi.fn().mockResolvedValue(true),
  executionGet: vi.fn().mockResolvedValue(null),
  executionGetByTask: vi.fn().mockResolvedValue([]),
  executionGetAll: vi.fn().mockResolvedValue([]),
  executionGetRunning: vi.fn().mockResolvedValue([]),
  onExecutionStarted: vi.fn(() => vi.fn()),
  onExecutionCompleted: vi.fn(() => vi.fn()),
  onExecutionCancelled: vi.fn(() => vi.fn()),
  // Notification operations
  notificationTest: vi.fn().mockResolvedValue(true),
  notificationSetWebhookUrl: vi.fn().mockResolvedValue(true),
  // Webhook operations
  webhookStart: vi.fn().mockResolvedValue(true),
  webhookStop: vi.fn().mockResolvedValue(true),
  webhookStatus: vi.fn().mockResolvedValue({ running: false }),
  // Theme operations
  themeGetPresets: vi.fn().mockResolvedValue([]),
  themeGetSettings: vi.fn().mockResolvedValue({ activeThemeId: 'dark' }),
  themeGetActiveColors: vi.fn().mockResolvedValue({}),
  themeSetTheme: vi.fn().mockResolvedValue({}),
  themeSetCustomAccent: vi.fn().mockResolvedValue({}),
  themeResetCustomAccent: vi.fn().mockResolvedValue({}),
  // Plugin operations
  pluginList: vi.fn().mockResolvedValue([]),
  pluginGet: vi.fn().mockResolvedValue(null),
  pluginActivate: vi.fn().mockResolvedValue({ success: true }),
  pluginDeactivate: vi.fn().mockResolvedValue({ success: true }),
  pluginUpdateSetting: vi.fn().mockResolvedValue({}),
  pluginGetDir: vi.fn().mockResolvedValue('/plugins'),
  pluginRefresh: vi.fn().mockResolvedValue([]),
  // AI Assistant operations
  aiAssistantChat: vi.fn().mockResolvedValue('response'),
  aiAssistantClear: vi.fn().mockResolvedValue(undefined),
  aiAssistantHasKey: vi.fn().mockResolvedValue(true),
  // Profiler operations
  profilerGetSummary: vi.fn().mockResolvedValue({}),
  profilerGetExecutions: vi.fn().mockResolvedValue([]),
  profilerGetTaskStats: vi.fn().mockResolvedValue([]),
  profilerGetSessionStats: vi.fn().mockResolvedValue([]),
  profilerGetTimeline: vi.fn().mockResolvedValue([]),
  // Coordination operations
  coordinationSendMessage: vi.fn().mockResolvedValue(true),
  coordinationDelegateTask: vi.fn().mockResolvedValue(true),
  coordinationRespondDelegation: vi.fn().mockResolvedValue(true),
  coordinationGetMessages: vi.fn().mockResolvedValue([]),
  coordinationGetMessagesByAgent: vi.fn().mockResolvedValue([]),
  coordinationGetDelegations: vi.fn().mockResolvedValue([]),
  coordinationClearMessages: vi.fn().mockResolvedValue(true),
  onCoordinationMessage: vi.fn(() => vi.fn()),
  onCoordinationDelegation: vi.fn(() => vi.fn()),
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

    it('switch calls electronAPI.switchSession', async () => {
      await ipcBridge.session.switch('s1');
      expect(mockElectronAPI.switchSession).toHaveBeenCalledWith('s1');
    });

    it('getActive calls electronAPI.getActiveSession', async () => {
      await ipcBridge.session.getActive();
      expect(mockElectronAPI.getActiveSession).toHaveBeenCalled();
    });
  });

  describe('terminal', () => {
    it('write calls electronAPI.terminalWrite', async () => {
      await ipcBridge.terminal.write('s1', 'data');
      expect(mockElectronAPI.terminalWrite).toHaveBeenCalledWith('s1', 'data');
    });

    it('resize calls electronAPI.terminalResize', async () => {
      await ipcBridge.terminal.resize('s1', 80, 24);
      expect(mockElectronAPI.terminalResize).toHaveBeenCalledWith('s1', 80, 24);
    });

    it('onData calls electronAPI.onTerminalData', () => {
      const cb = vi.fn();
      ipcBridge.terminal.onData(cb);
      expect(mockElectronAPI.onTerminalData).toHaveBeenCalledWith(cb);
    });
  });

  describe('agent', () => {
    it('send calls electronAPI.agentSendMessage', async () => {
      await ipcBridge.agent.send('s1', 'hello');
      expect(mockElectronAPI.agentSendMessage).toHaveBeenCalledWith('s1', 'hello');
    });

    it('onStatus calls electronAPI.onAgentStatus', () => {
      const cb = vi.fn();
      ipcBridge.agent.onStatus(cb);
      expect(mockElectronAPI.onAgentStatus).toHaveBeenCalledWith(cb);
    });
  });

  describe('organization', () => {
    it('get calls electronAPI.getOrganization', async () => {
      await ipcBridge.organization.get();
      expect(mockElectronAPI.getOrganization).toHaveBeenCalled();
    });

    it('update calls electronAPI.updateOrganization', async () => {
      await ipcBridge.organization.update({ name: 'org' });
      expect(mockElectronAPI.updateOrganization).toHaveBeenCalledWith({ name: 'org' });
    });
  });

  describe('git', () => {
    it('status calls electronAPI.gitStatus', async () => {
      await ipcBridge.git.status('/path');
      expect(mockElectronAPI.gitStatus).toHaveBeenCalledWith('/path');
    });

    it('add calls electronAPI.gitAdd', async () => {
      await ipcBridge.git.add('/path', ['file.ts']);
      expect(mockElectronAPI.gitAdd).toHaveBeenCalledWith('/path', ['file.ts']);
    });

    it('unstage calls electronAPI.gitUnstage', async () => {
      await ipcBridge.git.unstage('/path', ['file.ts']);
      expect(mockElectronAPI.gitUnstage).toHaveBeenCalledWith('/path', ['file.ts']);
    });

    it('commit calls electronAPI.gitCommit', async () => {
      await ipcBridge.git.commit('/path', 'msg');
      expect(mockElectronAPI.gitCommit).toHaveBeenCalledWith('/path', 'msg');
    });

    it('push calls electronAPI.gitPush', async () => {
      await ipcBridge.git.push('/path');
      expect(mockElectronAPI.gitPush).toHaveBeenCalledWith('/path');
    });

    it('pull calls electronAPI.gitPull', async () => {
      await ipcBridge.git.pull('/path');
      expect(mockElectronAPI.gitPull).toHaveBeenCalledWith('/path');
    });

    it('log calls electronAPI.gitLog', async () => {
      await ipcBridge.git.log('/path', 10);
      expect(mockElectronAPI.gitLog).toHaveBeenCalledWith('/path', 10);
    });
  });

  describe('task', () => {
    it('create calls dbTaskCreate', async () => {
      await ipcBridge.task.create({ title: 'test' } as any);
      expect(mockElectronAPI.dbTaskCreate).toHaveBeenCalledWith({ title: 'test' });
    });

    it('get calls dbTaskGet', async () => {
      await ipcBridge.task.get('t1');
      expect(mockElectronAPI.dbTaskGet).toHaveBeenCalledWith('t1');
    });

    it('getAll calls dbTaskGetAll', async () => {
      await ipcBridge.task.getAll();
      expect(mockElectronAPI.dbTaskGetAll).toHaveBeenCalled();
    });

    it('update calls dbTaskUpdate', async () => {
      await ipcBridge.task.update('t1', { title: 'updated' } as any);
      expect(mockElectronAPI.dbTaskUpdate).toHaveBeenCalledWith('t1', { title: 'updated' });
    });

    it('delete calls dbTaskDelete', async () => {
      await ipcBridge.task.delete('t1');
      expect(mockElectronAPI.dbTaskDelete).toHaveBeenCalledWith('t1');
    });

    it('getSubtasks calls dbTaskGetSubtasks', async () => {
      await ipcBridge.task.getSubtasks('t1');
      expect(mockElectronAPI.dbTaskGetSubtasks).toHaveBeenCalledWith('t1');
    });

    it('checkDependencies calls dbTaskCheckDependencies', async () => {
      await ipcBridge.task.checkDependencies('t1');
      expect(mockElectronAPI.dbTaskCheckDependencies).toHaveBeenCalledWith('t1');
    });

    it('getReadyTasks calls dbTaskGetReadyTasks', async () => {
      await ipcBridge.task.getReadyTasks();
      expect(mockElectronAPI.dbTaskGetReadyTasks).toHaveBeenCalled();
    });
  });

  describe('settings', () => {
    it('get calls settingsGet', async () => {
      await ipcBridge.settings.get();
      expect(mockElectronAPI.settingsGet).toHaveBeenCalled();
    });

    it('update calls settingsUpdate', async () => {
      await ipcBridge.settings.update({ theme: 'light' });
      expect(mockElectronAPI.settingsUpdate).toHaveBeenCalledWith({ theme: 'light' });
    });

    it('reset calls settingsReset', async () => {
      await ipcBridge.settings.reset();
      expect(mockElectronAPI.settingsReset).toHaveBeenCalled();
    });
  });

  describe('execution', () => {
    it('start calls executionStart', async () => {
      await ipcBridge.execution.start({ taskId: 't1' } as any);
      expect(mockElectronAPI.executionStart).toHaveBeenCalledWith({ taskId: 't1' });
    });

    it('cancel calls executionCancel', async () => {
      await ipcBridge.execution.cancel('e1');
      expect(mockElectronAPI.executionCancel).toHaveBeenCalledWith('e1');
    });

    it('getRunning calls executionGetRunning', async () => {
      await ipcBridge.execution.getRunning();
      expect(mockElectronAPI.executionGetRunning).toHaveBeenCalled();
    });
  });

  describe('notification', () => {
    it('test calls notificationTest', async () => {
      await ipcBridge.notification.test('discord');
      expect(mockElectronAPI.notificationTest).toHaveBeenCalledWith({ type: 'discord' });
    });

    it('setWebhookUrl calls notificationSetWebhookUrl', async () => {
      await ipcBridge.notification.setWebhookUrl('slack', 'https://hook');
      expect(mockElectronAPI.notificationSetWebhookUrl).toHaveBeenCalledWith({ type: 'slack', url: 'https://hook' });
    });
  });

  describe('webhook', () => {
    it('start calls webhookStart', async () => {
      await ipcBridge.webhook.start(3000);
      expect(mockElectronAPI.webhookStart).toHaveBeenCalledWith({ port: 3000 });
    });

    it('stop calls webhookStop', async () => {
      await ipcBridge.webhook.stop();
      expect(mockElectronAPI.webhookStop).toHaveBeenCalled();
    });

    it('status calls webhookStatus', async () => {
      await ipcBridge.webhook.status();
      expect(mockElectronAPI.webhookStatus).toHaveBeenCalled();
    });
  });

  describe('theme', () => {
    it('getPresets calls themeGetPresets', async () => {
      await ipcBridge.theme.getPresets();
      expect(mockElectronAPI.themeGetPresets).toHaveBeenCalled();
    });

    it('setTheme calls themeSetTheme', async () => {
      await ipcBridge.theme.setTheme('dark');
      expect(mockElectronAPI.themeSetTheme).toHaveBeenCalledWith('dark');
    });
  });

  describe('plugin', () => {
    it('list calls pluginList', async () => {
      await ipcBridge.plugin.list();
      expect(mockElectronAPI.pluginList).toHaveBeenCalled();
    });

    it('activate calls pluginActivate', async () => {
      await ipcBridge.plugin.activate('p1');
      expect(mockElectronAPI.pluginActivate).toHaveBeenCalledWith('p1');
    });
  });

  describe('aiAssistant', () => {
    it('chat calls aiAssistantChat', async () => {
      await ipcBridge.aiAssistant.chat('hello');
      expect(mockElectronAPI.aiAssistantChat).toHaveBeenCalledWith('hello');
    });

    it('hasKey calls aiAssistantHasKey', async () => {
      await ipcBridge.aiAssistant.hasKey();
      expect(mockElectronAPI.aiAssistantHasKey).toHaveBeenCalled();
    });
  });

  describe('profiler', () => {
    it('getSummary calls profilerGetSummary', async () => {
      await ipcBridge.profiler.getSummary();
      expect(mockElectronAPI.profilerGetSummary).toHaveBeenCalled();
    });

    it('getTimeline calls profilerGetTimeline', async () => {
      await ipcBridge.profiler.getTimeline({ limit: 10 } as any);
      expect(mockElectronAPI.profilerGetTimeline).toHaveBeenCalledWith({ limit: 10 });
    });
  });

  describe('coordination', () => {
    it('sendMessage calls coordinationSendMessage', async () => {
      await ipcBridge.coordination.sendMessage('a1', 'a2', 'info', 'hello');
      expect(mockElectronAPI.coordinationSendMessage).toHaveBeenCalledWith('a1', 'a2', 'info', 'hello', undefined);
    });

    it('getMessages calls coordinationGetMessages', async () => {
      await ipcBridge.coordination.getMessages(50);
      expect(mockElectronAPI.coordinationGetMessages).toHaveBeenCalledWith(50);
    });
  });
});
