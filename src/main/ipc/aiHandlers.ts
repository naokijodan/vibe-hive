import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './channels';
import { getAIAssistantService } from '../services/AIAssistantService';

export function registerAIHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.AI_ASSISTANT_CHAT, async (_event, message: string) => {
    const service = getAIAssistantService();
    return service.chat(message);
  });

  ipcMain.handle(IPC_CHANNELS.AI_ASSISTANT_CLEAR, async () => {
    const service = getAIAssistantService();
    service.clearHistory();
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.AI_ASSISTANT_HAS_KEY, async () => {
    const service = getAIAssistantService();
    return service.hasApiKey();
  });
}
