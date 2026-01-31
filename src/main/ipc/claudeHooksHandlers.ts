import { ipcMain } from 'electron';
import { getClaudeHooksService } from '../services/ClaudeHooksService';

export function registerClaudeHooksHandlers(): void {
  const service = getClaudeHooksService();

  ipcMain.handle('claudeHooks:getHooks', async () => {
    return service.getHooks();
  });

  ipcMain.handle('claudeHooks:addHook', async (_event, hook: Record<string, unknown>) => {
    return service.addHook(hook as any);
  });

  ipcMain.handle('claudeHooks:updateHook', async (_event, id: string, updates: Record<string, unknown>) => {
    return service.updateHook(id, updates as any);
  });

  ipcMain.handle('claudeHooks:deleteHook', async (_event, id: string) => {
    return service.deleteHook(id);
  });

  ipcMain.handle('claudeHooks:getPresets', async () => {
    return service.getPresets();
  });

  ipcMain.handle('claudeHooks:addPreset', async (_event, index: number) => {
    return service.addPreset(index);
  });

  ipcMain.handle('claudeHooks:getLogs', async () => {
    return service.getLogs();
  });

  ipcMain.handle('claudeHooks:clearLogs', async () => {
    service.clearLogs();
    return { success: true };
  });

  ipcMain.handle('claudeHooks:reload', async () => {
    return service.reloadFromDisk();
  });
}
