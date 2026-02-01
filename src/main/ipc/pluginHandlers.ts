import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './channels';
import { getPluginService } from '../services/PluginService';

export function registerPluginHandlers(): void {
  const pluginService = getPluginService();

  ipcMain.handle(IPC_CHANNELS.PLUGIN_LIST, async () => {
    return pluginService.getPlugins();
  });

  ipcMain.handle(IPC_CHANNELS.PLUGIN_GET, async (_event, pluginId: string) => {
    return pluginService.getPlugin(pluginId);
  });

  ipcMain.handle(IPC_CHANNELS.PLUGIN_ACTIVATE, async (_event, pluginId: string) => {
    return pluginService.activatePlugin(pluginId);
  });

  ipcMain.handle(IPC_CHANNELS.PLUGIN_DEACTIVATE, async (_event, pluginId: string) => {
    return pluginService.deactivatePlugin(pluginId);
  });

  ipcMain.handle(IPC_CHANNELS.PLUGIN_UPDATE_SETTING, async (_event, pluginId: string, key: string, value: unknown) => {
    pluginService.updatePluginSetting(pluginId, key, value);
    return pluginService.getPlugin(pluginId);
  });

  ipcMain.handle(IPC_CHANNELS.PLUGIN_GET_DIR, async () => {
    return pluginService.getPluginsDir();
  });

  ipcMain.handle(IPC_CHANNELS.PLUGIN_REFRESH, async () => {
    await pluginService.deactivateAll();
    await pluginService.discoverPlugins();
    await pluginService.activateAll();
    return pluginService.getPlugins();
  });
}
