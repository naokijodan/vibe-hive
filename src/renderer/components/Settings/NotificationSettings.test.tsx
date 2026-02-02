// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationSettings } from './NotificationSettings';

const mockSetWebhookUrl = vi.fn().mockResolvedValue(undefined);
const mockTest = vi.fn().mockResolvedValue(undefined);

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    notification: {
      setWebhookUrl: (...args: any[]) => mockSetWebhookUrl(...args),
      test: (...args: any[]) => mockTest(...args),
    },
  },
}));

describe('NotificationSettings', () => {
  it('renders notification sections', () => {
    render(<NotificationSettings />);
    expect(screen.getAllByText(/Discord/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Slack/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Email/i).length).toBeGreaterThan(0);
  });

  it('renders header', () => {
    render(<NotificationSettings />);
    expect(screen.getByText('Notification Settings')).toBeDefined();
  });

  it('renders discord webhook input', () => {
    render(<NotificationSettings />);
    expect(screen.getByPlaceholderText('https://discord.com/api/webhooks/...')).toBeDefined();
  });

  it('renders slack webhook input', () => {
    render(<NotificationSettings />);
    expect(screen.getByPlaceholderText('https://hooks.slack.com/services/...')).toBeDefined();
  });

  it('shows save buttons', () => {
    render(<NotificationSettings />);
    const saveButtons = screen.getAllByText('Save');
    expect(saveButtons.length).toBe(2);
  });

  it('shows test buttons', () => {
    render(<NotificationSettings />);
    const testButtons = screen.getAllByText('Test');
    expect(testButtons.length).toBe(2);
  });

  it('shows email test button', () => {
    render(<NotificationSettings />);
    expect(screen.getByText('Test Email (Mock)')).toBeDefined();
  });

  it('shows error when saving discord with empty URL', async () => {
    render(<NotificationSettings />);
    const saveButtons = screen.getAllByText('Save');
    fireEvent.click(saveButtons[0]); // Discord Save
    await waitFor(() => {
      expect(screen.getByText('Discord webhook URL is required')).toBeDefined();
    });
  });

  it('shows error when saving slack with empty URL', async () => {
    render(<NotificationSettings />);
    const saveButtons = screen.getAllByText('Save');
    fireEvent.click(saveButtons[1]); // Slack Save
    await waitFor(() => {
      expect(screen.getByText('Slack webhook URL is required')).toBeDefined();
    });
  });

  it('saves discord URL successfully', async () => {
    render(<NotificationSettings />);
    const input = screen.getByPlaceholderText('https://discord.com/api/webhooks/...');
    fireEvent.change(input, { target: { value: 'https://discord.com/api/webhooks/123' } });
    const saveButtons = screen.getAllByText('Save');
    fireEvent.click(saveButtons[0]);
    await waitFor(() => {
      expect(mockSetWebhookUrl).toHaveBeenCalledWith('discord', 'https://discord.com/api/webhooks/123');
    });
  });

  it('saves slack URL successfully', async () => {
    render(<NotificationSettings />);
    const input = screen.getByPlaceholderText('https://hooks.slack.com/services/...');
    fireEvent.change(input, { target: { value: 'https://hooks.slack.com/services/T/B/x' } });
    const saveButtons = screen.getAllByText('Save');
    fireEvent.click(saveButtons[1]);
    await waitFor(() => {
      expect(mockSetWebhookUrl).toHaveBeenCalledWith('slack', 'https://hooks.slack.com/services/T/B/x');
    });
  });

  it('renders usage info', () => {
    render(<NotificationSettings />);
    expect(screen.getByText('Usage in Workflows')).toBeDefined();
  });

  it('renders template variables', () => {
    render(<NotificationSettings />);
    expect(screen.getByText('Available Template Variables')).toBeDefined();
  });
});
