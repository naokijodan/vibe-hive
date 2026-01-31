import { ipcMain } from 'electron';
import { getAgentCoordinationService } from '../services/AgentCoordinationService';

export function registerCoordinationHandlers(): void {
  const service = getAgentCoordinationService();

  ipcMain.handle('coordination:sendMessage', async (
    _event,
    fromAgentId: string,
    toAgentId: string | null,
    type: string,
    content: string,
    metadata?: Record<string, unknown>
  ) => {
    return service.sendMessage(fromAgentId, toAgentId, type as any, content, metadata);
  });

  ipcMain.handle('coordination:delegateTask', async (
    _event,
    taskId: string,
    fromAgentId: string,
    toAgentId: string,
    reason?: string
  ) => {
    return service.delegateTask(taskId, fromAgentId, toAgentId, reason);
  });

  ipcMain.handle('coordination:respondDelegation', async (
    _event,
    delegationId: string,
    accepted: boolean
  ) => {
    return service.respondToDelegation(delegationId, accepted);
  });

  ipcMain.handle('coordination:getMessages', async (_event, limit?: number) => {
    return service.getMessages(limit);
  });

  ipcMain.handle('coordination:getMessagesByAgent', async (_event, agentId: string) => {
    return service.getMessagesByAgent(agentId);
  });

  ipcMain.handle('coordination:getDelegations', async () => {
    return service.getDelegations();
  });

  ipcMain.handle('coordination:clearMessages', async () => {
    service.clearMessages();
    return { success: true };
  });
}
