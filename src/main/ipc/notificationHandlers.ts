import { ipcMain } from 'electron';
import { notificationService } from '../services/NotificationService';
import { getWebhookServer } from '../services/WebhookServer';
import { getDesktopNotificationService } from '../services/DesktopNotificationService';

export function registerNotificationHandlers(): void {
  // Test notification
  ipcMain.handle('notification:test', async (_event, params: { type: 'discord' | 'slack' | 'email' }) => {
    try {
      await notificationService.testNotification(params.type);
      return { success: true };
    } catch (error) {
      console.error('Test notification failed:', error);
      throw error;
    }
  });

  // Set webhook URL
  ipcMain.handle('notification:setWebhookUrl', async (_event, params: { type: 'discord' | 'slack'; url: string }) => {
    try {
      notificationService.setWebhookUrl(params.type, params.url);
      return { success: true };
    } catch (error) {
      console.error('Set webhook URL failed:', error);
      throw error;
    }
  });

  // Desktop notification settings
  const desktopService = getDesktopNotificationService();

  ipcMain.handle('desktopNotification:getSettings', async () => {
    return desktopService.getSettings();
  });

  ipcMain.handle('desktopNotification:updateSettings', async (_event, updates: Record<string, unknown>) => {
    return desktopService.updateSettings(updates);
  });

  ipcMain.handle('desktopNotification:test', async () => {
    desktopService.testNotification();
    return { success: true };
  });

  // Start webhook server
  ipcMain.handle('webhook:start', async (_event, params?: { port?: number }) => {
    try {
      const server = getWebhookServer(params?.port);
      if (server.isRunning()) {
        return { success: true, port: server.getPort(), message: 'Already running' };
      }

      await server.start();
      return { success: true, port: server.getPort() };
    } catch (error) {
      console.error('Start webhook server failed:', error);
      throw error;
    }
  });

  // Stop webhook server
  ipcMain.handle('webhook:stop', async () => {
    try {
      const server = getWebhookServer();
      await server.stop();
      return { success: true };
    } catch (error) {
      console.error('Stop webhook server failed:', error);
      throw error;
    }
  });

  // Get webhook server status
  ipcMain.handle('webhook:status', async () => {
    try {
      const server = getWebhookServer();
      return {
        isRunning: server.isRunning(),
        port: server.getPort(),
      };
    } catch (error) {
      console.error('Get webhook server status failed:', error);
      throw error;
    }
  });
}
