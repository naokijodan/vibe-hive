// Collaboration IPC Handlers
import { ipcMain } from 'electron';
import { getCollaborationService } from '../services/CollaborationService';
import type { CollabSettings } from '../../shared/types/collaboration';

export function registerCollaborationIpcHandlers(): void {
  const collab = getCollaborationService();

  ipcMain.handle('collab:startHost', (_event, sessionId: string, settings: CollabSettings, port?: number) => {
    return collab.startHost(sessionId, settings, port);
  });

  ipcMain.handle('collab:join', (_event, host: string, port: number, settings: CollabSettings) => {
    return collab.joinRoom(host, port, settings);
  });

  ipcMain.handle('collab:disconnect', () => {
    return collab.disconnect();
  });

  ipcMain.handle('collab:sendChat', (_event, message: string) => {
    return collab.sendChat(message);
  });

  ipcMain.handle('collab:broadcastTask', (_event, eventType: string, payload: unknown) => {
    collab.broadcastTaskEvent(eventType as 'task:updated' | 'task:created' | 'task:deleted' | 'task:moved', payload);
  });

  ipcMain.handle('collab:getStatus', () => {
    return collab.getStatus();
  });

  ipcMain.handle('collab:getUsers', () => {
    return collab.getUsers();
  });

  ipcMain.handle('collab:getChatHistory', () => {
    return collab.getChatHistory();
  });
}
