import { ipcMain } from 'electron';
import { agentService, AgentType } from '../services/AgentService';

export function registerAgentHandlers(): void {
  // Start an agent session
  ipcMain.handle('agent:start', (_event, sessionId: string, type: AgentType, cwd: string) => {
    return agentService.start(sessionId, type, cwd);
  });

  // Stop an agent session
  ipcMain.handle('agent:stop', (_event, sessionId: string) => {
    agentService.stop(sessionId);
  });

  // Send input to an agent session
  ipcMain.handle('agent:input', (_event, sessionId: string, data: string) => {
    agentService.input(sessionId, data);
  });

  // List all agent sessions
  ipcMain.handle('agent:list', () => {
    return agentService.getAllSessions();
  });

  console.log('Agent IPC handlers registered');
}
