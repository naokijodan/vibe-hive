import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './channels';
import { getSessionService } from '../services/SessionService';
import { ptyService } from '../services/PtyService';
import { getGitService } from '../services/GitService';
import { getSettingsService } from '../services/SettingsService';

export function registerIpcHandlers(): void {
  const sessionService = getSessionService();

  // Session handlers
  ipcMain.handle(IPC_CHANNELS.SESSION_CREATE, async (_event, config) => {
    console.log('session:create', config);
    const session = sessionService.createSession(config);
    return session;
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_GET, async (_event, id) => {
    console.log('session:get', id);
    const session = sessionService.getSession(id);
    return session;
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_LIST, async () => {
    console.log('session:list');
    const sessions = sessionService.listSessions();
    return sessions;
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_DELETE, async (_event, id) => {
    console.log('session:delete', id);
    sessionService.deleteSession(id);
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_SWITCH, async (_event, id) => {
    console.log('session:switch', id);
    const session = sessionService.switchSession(id);
    return session;
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_GET_ACTIVE, async () => {
    console.log('session:get-active');
    const session = sessionService.getActiveSession();
    return session;
  });

  // Terminal handlers (legacy - delegates to ptyService)
  ipcMain.handle(IPC_CHANNELS.TERMINAL_WRITE, async (_event, sessionId, data) => {
    console.log('terminal:write', sessionId, data);
    ptyService.write(sessionId, data);
  });

  ipcMain.handle(IPC_CHANNELS.TERMINAL_RESIZE, async (_event, sessionId, cols, rows) => {
    console.log('terminal:resize', sessionId, cols, rows);
    ptyService.resize(sessionId, cols, rows);
  });

  // Agent handlers
  ipcMain.handle(IPC_CHANNELS.AGENT_SEND, async (_event, sessionId, message) => {
    // TODO: Implement AgentRunner
    console.log('agent:send', sessionId, message);
  });

  // Organization handlers
  ipcMain.handle(IPC_CHANNELS.ORG_GET, async () => {
    // TODO: Implement OrgManager
    console.log('org:get');
    return null;
  });

  ipcMain.handle(IPC_CHANNELS.ORG_UPDATE, async (_event, org) => {
    // TODO: Implement OrgManager
    console.log('org:update', org);
  });

  // Git handlers
  ipcMain.handle(IPC_CHANNELS.GIT_STATUS, async (_event, path) => {
    console.log('git:status', path);
    const gitService = getGitService();
    const status = await gitService.getStatus(path);
    return status;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_ADD, async (_event, path, files) => {
    console.log('git:add', path, files);
    const gitService = getGitService();
    const success = await gitService.add(path, files);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_UNSTAGE, async (_event, path, files) => {
    console.log('git:unstage', path, files);
    const gitService = getGitService();
    const success = await gitService.unstage(path, files);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_COMMIT, async (_event, path, message) => {
    console.log('git:commit', path, message);
    const gitService = getGitService();
    const success = await gitService.commit(path, message);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_PUSH, async (_event, path) => {
    console.log('git:push', path);
    const gitService = getGitService();
    const success = await gitService.push(path);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_PULL, async (_event, path) => {
    console.log('git:pull', path);
    const gitService = getGitService();
    const success = await gitService.pull(path);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_LOG, async (_event, path, limit) => {
    console.log('git:log', path, limit);
    const gitService = getGitService();
    const log = await gitService.log(path, limit);
    return log;
  });

  // Settings handlers
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    console.log('settings:get');
    const settingsService = getSettingsService();
    const settings = settingsService.getSettings();
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_event, updates) => {
    console.log('settings:update', updates);
    const settingsService = getSettingsService();
    const settings = settingsService.updateSettings(updates);
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE_GIT, async (_event, gitSettings) => {
    console.log('settings:update-git', gitSettings);
    const settingsService = getSettingsService();
    const settings = settingsService.updateGitSettings(gitSettings);
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE_APP, async (_event, appSettings) => {
    console.log('settings:update-app', appSettings);
    const settingsService = getSettingsService();
    const settings = settingsService.updateAppSettings(appSettings);
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, async () => {
    console.log('settings:reset');
    const settingsService = getSettingsService();
    const settings = settingsService.resetSettings();
    return settings;
  });
}
