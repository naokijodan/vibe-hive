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
    const session = sessionService.createSession(config);
    return session;
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_GET, async (_event, id) => {
    const session = sessionService.getSession(id);
    return session;
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_LIST, async () => {
    const sessions = sessionService.listSessions();
    return sessions;
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_DELETE, async (_event, id) => {
    sessionService.deleteSession(id);
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_SWITCH, async (_event, id) => {
    const session = sessionService.switchSession(id);
    return session;
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_GET_ACTIVE, async () => {
    const session = sessionService.getActiveSession();
    return session;
  });

  // Terminal handlers (legacy - delegates to ptyService)
  ipcMain.handle(IPC_CHANNELS.TERMINAL_WRITE, async (_event, sessionId, data) => {
    ptyService.write(sessionId, data);
  });

  ipcMain.handle(IPC_CHANNELS.TERMINAL_RESIZE, async (_event, sessionId, cols, rows) => {
    ptyService.resize(sessionId, cols, rows);
  });

  // Organization handlers
  ipcMain.handle(IPC_CHANNELS.ORG_GET, async () => {
    // TODO: Implement OrgManager
    return null;
  });

  ipcMain.handle(IPC_CHANNELS.ORG_UPDATE, async (_event, org) => {
    // TODO: Implement OrgManager
  });

  // Git handlers
  ipcMain.handle(IPC_CHANNELS.GIT_STATUS, async (_event, path) => {
    const gitService = getGitService();
    const status = await gitService.getStatus(path);
    return status;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_ADD, async (_event, path, files) => {
    const gitService = getGitService();
    const success = await gitService.add(path, files);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_UNSTAGE, async (_event, path, files) => {
    const gitService = getGitService();
    const success = await gitService.unstage(path, files);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_COMMIT, async (_event, path, message) => {
    const gitService = getGitService();
    const success = await gitService.commit(path, message);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_PUSH, async (_event, path) => {
    const gitService = getGitService();
    const success = await gitService.push(path);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_PULL, async (_event, path) => {
    const gitService = getGitService();
    const success = await gitService.pull(path);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_LOG, async (_event, path, limit) => {
    const gitService = getGitService();
    const log = await gitService.log(path, limit);
    return log;
  });

  // Settings handlers
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    const settingsService = getSettingsService();
    const settings = settingsService.getSettings();
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_event, updates) => {
    const settingsService = getSettingsService();
    const settings = settingsService.updateSettings(updates);
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE_GIT, async (_event, gitSettings) => {
    const settingsService = getSettingsService();
    const settings = settingsService.updateGitSettings(gitSettings);
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE_APP, async (_event, appSettings) => {
    const settingsService = getSettingsService();
    const settings = settingsService.updateAppSettings(appSettings);
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE_AGENT, async (_event, agentSettings) => {
    const settingsService = getSettingsService();
    const settings = settingsService.updateAgentSettings(agentSettings);
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, async () => {
    const settingsService = getSettingsService();
    const settings = settingsService.resetSettings();
    return settings;
  });
}
