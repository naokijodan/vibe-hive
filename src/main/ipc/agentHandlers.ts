import { ipcMain } from 'electron';
import { agentService, AgentType } from '../services/AgentService';

export function registerAgentHandlers(): void {
  // Start an agent session
  ipcMain.handle('agent:start', (_event, sessionId: string, type: AgentType, cwd: string, initialPrompt?: string) => {
    return agentService.start(sessionId, type, cwd, initialPrompt);
  });

  // Stop an agent session
  ipcMain.handle('agent:stop', (_event, sessionId: string) => {
    agentService.stop(sessionId);
  });

  // Send input to an agent session
  ipcMain.handle('agent:input', (_event, sessionId: string, data: string) => {
    agentService.input(sessionId, data);
  });

  // Send message to an agent session (alias for agent:input for compatibility)
  ipcMain.handle('agent:send', (_event, sessionId: string, message: string) => {
    agentService.input(sessionId, message + '\n');
  });

  // List all agent sessions
  ipcMain.handle('agent:list', () => {
    return agentService.getAllSessions();
  });

  console.log('Agent IPC handlers registered');
}
