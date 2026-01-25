import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './channels';

export function registerIpcHandlers(): void {
  // Session handlers
  ipcMain.handle(IPC_CHANNELS.SESSION_CREATE, async (_event, config) => {
    // TODO: Implement SessionService
    console.log('session:create', config);
    return { id: 'test-session', ...config };
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_GET, async (_event, id) => {
    // TODO: Implement SessionService
    console.log('session:get', id);
    return null;
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_LIST, async () => {
    // TODO: Implement SessionService
    console.log('session:list');
    return [];
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_DELETE, async (_event, id) => {
    // TODO: Implement SessionService
    console.log('session:delete', id);
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
