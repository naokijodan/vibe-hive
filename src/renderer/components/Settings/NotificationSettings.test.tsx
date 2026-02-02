// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationSettings } from './NotificationSettings';

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    notification: {
      setWebhookUrl: vi.fn(),
      testWebhook: vi.fn(),
    },
  },
}));

describe('NotificationSettings', () => {
  it('renders notification sections', () => {
    render(<NotificationSettings />);
    expect(screen.getAllByText(/Discord/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Slack/i).length).toBeGreaterThan(0);
  });
});
