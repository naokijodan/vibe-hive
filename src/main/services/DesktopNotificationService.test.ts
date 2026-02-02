import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockShow, mockIsSupported } = vi.hoisted(() => ({
  mockShow: vi.fn(),
  mockIsSupported: vi.fn(() => true),
}));

vi.mock('electron', () => ({
  Notification: class {
    static isSupported = mockIsSupported;
    show = mockShow;
    constructor() {}
  },
}));

vi.mock('./SettingsService', () => ({
  getSettingsService: () => ({
    getSettings: () => ({}),
    updateSettings: vi.fn(),
  }),
}));

let getDesktopNotificationService: () => any;

beforeEach(async () => {
  vi.clearAllMocks();
  mockIsSupported.mockReturnValue(true);
  vi.resetModules();
  vi.doMock('electron', () => ({
    Notification: class {
      static isSupported = mockIsSupported;
      show = mockShow;
      constructor() {}
    },
  }));
  vi.doMock('./SettingsService', () => ({
    getSettingsService: () => ({
      getSettings: () => ({}),
      updateSettings: vi.fn(),
    }),
  }));
  const mod = await import('./DesktopNotificationService');
  getDesktopNotificationService = mod.getDesktopNotificationService;
});

describe('DesktopNotificationService', () => {
  it('getSettings returns default settings', () => {
    const svc = getDesktopNotificationService();
    const settings = svc.getSettings();
    expect(settings.enabled).toBe(true);
    expect(settings.onTaskComplete).toBe(true);
  });

  it('updateSettings merges settings', () => {
    const svc = getDesktopNotificationService();
    const result = svc.updateSettings({ onTaskComplete: false });
    expect(result.onTaskComplete).toBe(false);
    expect(result.enabled).toBe(true);
  });

  it('notify shows notification when enabled and supported', () => {
    const svc = getDesktopNotificationService();
    svc.notify('Title', 'Body');
    expect(mockShow).toHaveBeenCalled();
  });

  it('notify does nothing when disabled', () => {
    const svc = getDesktopNotificationService();
    svc.updateSettings({ enabled: false });
    svc.notify('Title', 'Body');
    expect(mockShow).not.toHaveBeenCalled();
  });

  it('notify does nothing when not supported', () => {
    mockIsSupported.mockReturnValue(false);
    const svc = getDesktopNotificationService();
    svc.notify('Title', 'Body');
    expect(mockShow).not.toHaveBeenCalled();
  });

  it('notifyTaskComplete sends when enabled', () => {
    const svc = getDesktopNotificationService();
    svc.notifyTaskComplete('My Task');
    expect(mockShow).toHaveBeenCalled();
  });

  it('notifyTaskComplete skips when disabled', () => {
    const svc = getDesktopNotificationService();
    svc.updateSettings({ onTaskComplete: false });
    svc.notifyTaskComplete('My Task');
    expect(mockShow).not.toHaveBeenCalled();
  });

  it('notifyExecutionFailed includes error', () => {
    const svc = getDesktopNotificationService();
    svc.notifyExecutionFailed('Task', 'timeout');
    expect(mockShow).toHaveBeenCalled();
  });

  it('testNotification temporarily enables', () => {
    const svc = getDesktopNotificationService();
    svc.updateSettings({ enabled: false });
    svc.testNotification();
    expect(mockShow).toHaveBeenCalled();
    // Should restore to disabled
    expect(svc.getSettings().enabled).toBe(false);
  });
});
