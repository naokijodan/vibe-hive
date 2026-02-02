import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/NotificationService', () => ({
  notificationService: { testNotification: vi.fn(), setWebhookUrl: vi.fn(), send: vi.fn() },
}));
vi.mock('../services/WebhookServer', () => ({
  getWebhookServer: () => ({ isRunning: vi.fn(() => false), start: vi.fn(), stop: vi.fn(), getPort: vi.fn(() => 3100) }),
}));
vi.mock('../services/DesktopNotificationService', () => ({
  getDesktopNotificationService: () => ({ getSettings: vi.fn(), updateSettings: vi.fn(), testNotification: vi.fn() }),
}));

import { registerNotificationHandlers } from './notificationHandlers';

describe('notificationHandlers', () => {
  beforeEach(() => vi.clearAllMocks());
  it('registers all handlers', () => {
    registerNotificationHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('notification:test');
    expect(channels).toContain('notification:setWebhookUrl');
    expect(channels).toContain('desktopNotification:getSettings');
    expect(channels).toContain('desktopNotification:updateSettings');
    expect(channels).toContain('desktopNotification:test');
    expect(channels).toContain('webhook:start');
    expect(channels).toContain('webhook:stop');
    expect(channels).toContain('webhook:status');
  });
});
