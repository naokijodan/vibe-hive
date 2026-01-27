import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './channels';
import { getSessionService } from '../services/SessionService';

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

  // Terminal handlers
  ipcMain.handle(IPC_CHANNELS.TERMINAL_WRITE, async (_event, sessionId, data) => {
    // TODO: Implement PtyManager
    console.log('terminal:write', sessionId, data);
  });

  ipcMain.handle(IPC_CHANNELS.TERMINAL_RESIZE, async (_event, sessionId, cols, rows) => {
    // TODO: Implement PtyManager
    console.log('terminal:resize', sessionId, cols, rows);
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
    // TODO: Implement GitService
    console.log('git:status', path);
    return null;
  });

  ipcMain.handle(IPC_CHANNELS.GIT_COMMIT, async (_event, path, message) => {
    // TODO: Implement GitService
    console.log('git:commit', path, message);
  });
}
