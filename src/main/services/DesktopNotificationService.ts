import { Notification } from 'electron';
import { getSettingsService } from './SettingsService';

export interface DesktopNotificationSettings {
  enabled: boolean;
  onTaskComplete: boolean;
  onExecutionComplete: boolean;
  onExecutionFailed: boolean;
  onAgentStopped: boolean;
}

const DEFAULT_NOTIFICATION_SETTINGS: DesktopNotificationSettings = {
  enabled: true,
  onTaskComplete: true,
  onExecutionComplete: true,
  onExecutionFailed: true,
  onAgentStopped: true,
};

class DesktopNotificationService {
  private settings: DesktopNotificationSettings;

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): DesktopNotificationSettings {
    try {
      const appSettings = getSettingsService().getSettings();
      const notif = (appSettings as unknown as Record<string, unknown>).notifications as
        | Partial<DesktopNotificationSettings>
        | undefined;
      if (notif) {
        return { ...DEFAULT_NOTIFICATION_SETTINGS, ...notif };
      }
    } catch {
      // Settings not yet initialized
    }
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }

  getSettings(): DesktopNotificationSettings {
    return this.settings;
  }

  updateSettings(updates: Partial<DesktopNotificationSettings>): DesktopNotificationSettings {
    this.settings = { ...this.settings, ...updates };
    // Persist via SettingsService
    const settingsService = getSettingsService();
    settingsService.updateSettings({ notifications: this.settings } as any);
    return this.settings;
  }

  notify(title: string, body: string): void {
    if (!this.settings.enabled) return;
    if (!Notification.isSupported()) return;

    const notification = new Notification({ title, body, silent: false });
    notification.show();
  }

  notifyTaskComplete(taskTitle: string): void {
    if (!this.settings.onTaskComplete) return;
    this.notify('タスク完了', `${taskTitle} が完了しました`);
  }

  notifyExecutionComplete(taskTitle: string): void {
    if (!this.settings.onExecutionComplete) return;
    this.notify('実行完了', `${taskTitle} の実行が完了しました`);
  }

  notifyExecutionFailed(taskTitle: string, error?: string): void {
    if (!this.settings.onExecutionFailed) return;
    this.notify('実行失敗', `${taskTitle} の実行が失敗しました${error ? `: ${error}` : ''}`);
  }

  notifyAgentStopped(sessionName: string): void {
    if (!this.settings.onAgentStopped) return;
    this.notify('エージェント停止', `${sessionName} のエージェントが停止しました`);
  }

  testNotification(): void {
    const saved = this.settings.enabled;
    this.settings.enabled = true;
    this.notify('テスト通知', 'Vibe Hive のデスクトップ通知テストです');
    this.settings.enabled = saved;
  }
}

let instance: DesktopNotificationService | null = null;

export function getDesktopNotificationService(): DesktopNotificationService {
  if (!instance) {
    instance = new DesktopNotificationService();
  }
  return instance;
}
