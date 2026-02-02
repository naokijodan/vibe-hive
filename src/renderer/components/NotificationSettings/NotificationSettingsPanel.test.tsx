// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { NotificationSettingsPanel } from './NotificationSettingsPanel';

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    desktopNotification: {
      getSettings: vi.fn().mockResolvedValue({
        enabled: true,
        onTaskComplete: true,
        onExecutionComplete: true,
        onExecutionFailed: true,
        onAgentStopped: false,
      }),
      updateSettings: vi.fn(),
      test: vi.fn(),
    },
  },
}));

describe('NotificationSettingsPanel', () => {
  it('renders settings after loading', async () => {
    render(<NotificationSettingsPanel />);
    await waitFor(() => {
      expect(screen.getByText('Notification Settings')).toBeDefined();
    });
  });

  it('shows notification setting items', async () => {
    render(<NotificationSettingsPanel />);
    await waitFor(() => {
      expect(screen.getByText('タスク完了')).toBeDefined();
      expect(screen.getByText('実行完了')).toBeDefined();
      expect(screen.getByText('実行失敗')).toBeDefined();
      expect(screen.getByText('エージェント停止')).toBeDefined();
    });
  });
});
