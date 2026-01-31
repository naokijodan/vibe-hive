import { ipcMain } from 'electron';
import { getThemeService } from '../services/ThemeService';

export function registerThemeHandlers(): void {
  const service = getThemeService();

  ipcMain.handle('theme:getPresets', async () => {
    return service.getPresets();
  });

  ipcMain.handle('theme:getSettings', async () => {
    return service.getSettings();
  });

  ipcMain.handle('theme:getActiveColors', async () => {
    return service.getActiveColors();
  });

  ipcMain.handle('theme:setTheme', async (_event, themeId: string) => {
    return service.setTheme(themeId);
  });

  ipcMain.handle('theme:setCustomAccent', async (_event, color: string) => {
    return service.setCustomAccent(color);
  });

  ipcMain.handle('theme:resetCustomAccent', async () => {
    return service.resetCustomAccent();
  });
}
