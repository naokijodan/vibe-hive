// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  describe('test notifications', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('tests discord notification', async () => {
      render(<NotificationSettings />);
      const testButtons = screen.getAllByText('Test');
      fireEvent.click(testButtons[0]); // Discord Test
      await waitFor(() => {
        expect(mockTest).toHaveBeenCalledWith('discord');
      });
    });

    it('tests slack notification', async () => {
      render(<NotificationSettings />);
      const testButtons = screen.getAllByText('Test');
      fireEvent.click(testButtons[1]); // Slack Test
      await waitFor(() => {
        expect(mockTest).toHaveBeenCalledWith('slack');
      });
    });

    it('tests email notification', async () => {
      render(<NotificationSettings />);
      fireEvent.click(screen.getByText('Test Email (Mock)'));
      await waitFor(() => {
        expect(mockTest).toHaveBeenCalledWith('email');
      });
    });

    it('shows success message after test', async () => {
      render(<NotificationSettings />);
      const testButtons = screen.getAllByText('Test');
      fireEvent.click(testButtons[0]);
      await waitFor(() => {
        expect(screen.getByText('Test notification sent to discord')).toBeDefined();
      });
    });

    it('shows error message on test failure', async () => {
      mockTest.mockRejectedValueOnce(new Error('Test failed'));
      render(<NotificationSettings />);
      const testButtons = screen.getAllByText('Test');
      fireEvent.click(testButtons[0]);
      await waitFor(() => {
        expect(screen.getByText('Test failed')).toBeDefined();
      });
    });
  });

  describe('save success messages', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('shows success message after discord save', async () => {
      render(<NotificationSettings />);
      const input = screen.getByPlaceholderText('https://discord.com/api/webhooks/...');
      fireEvent.change(input, { target: { value: 'https://discord.com/api/webhooks/123' } });
      const saveButtons = screen.getAllByText('Save');
      fireEvent.click(saveButtons[0]);
      await waitFor(() => {
        expect(screen.getByText('Discord webhook URL saved successfully')).toBeDefined();
      });
    });

    it('shows success message after slack save', async () => {
      render(<NotificationSettings />);
      const input = screen.getByPlaceholderText('https://hooks.slack.com/services/...');
      fireEvent.change(input, { target: { value: 'https://hooks.slack.com/services/T/B/x' } });
      const saveButtons = screen.getAllByText('Save');
      fireEvent.click(saveButtons[1]);
      await waitFor(() => {
        expect(screen.getByText('Slack webhook URL saved successfully')).toBeDefined();
      });
    });
  });

  describe('save error handling', () => {
    it('shows error message on discord save failure', async () => {
      mockSetWebhookUrl.mockRejectedValueOnce(new Error('Network error'));
      render(<NotificationSettings />);
      const input = screen.getByPlaceholderText('https://discord.com/api/webhooks/...');
      fireEvent.change(input, { target: { value: 'https://discord.com/api/webhooks/123' } });
      const saveButtons = screen.getAllByText('Save');
      fireEvent.click(saveButtons[0]);
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeDefined();
      });
    });

    it('shows error message on slack save failure', async () => {
      mockSetWebhookUrl.mockRejectedValueOnce(new Error('Server error'));
      render(<NotificationSettings />);
      const input = screen.getByPlaceholderText('https://hooks.slack.com/services/...');
      fireEvent.change(input, { target: { value: 'https://hooks.slack.com/services/T/B/x' } });
      const saveButtons = screen.getAllByText('Save');
      fireEvent.click(saveButtons[1]);
      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeDefined();
      });
    });

    it('shows generic error on non-Error discord save failure', async () => {
      mockSetWebhookUrl.mockRejectedValueOnce('Unknown error');
      render(<NotificationSettings />);
      const input = screen.getByPlaceholderText('https://discord.com/api/webhooks/...');
      fireEvent.change(input, { target: { value: 'https://discord.com/api/webhooks/123' } });
      const saveButtons = screen.getAllByText('Save');
      fireEvent.click(saveButtons[0]);
      await waitFor(() => {
        expect(screen.getByText('Failed to save Discord URL')).toBeDefined();
      });
    });

    it('shows generic error on non-Error slack save failure', async () => {
      mockSetWebhookUrl.mockRejectedValueOnce('Unknown error');
      render(<NotificationSettings />);
      const input = screen.getByPlaceholderText('https://hooks.slack.com/services/...');
      fireEvent.change(input, { target: { value: 'https://hooks.slack.com/services/T/B/x' } });
      const saveButtons = screen.getAllByText('Save');
      fireEvent.click(saveButtons[1]);
      await waitFor(() => {
        expect(screen.getByText('Failed to save Slack URL')).toBeDefined();
      });
    });
  });

  describe('test error handling', () => {
    it('shows generic error on non-Error test failure', async () => {
      mockTest.mockRejectedValueOnce('Unknown error');
      render(<NotificationSettings />);
      const testButtons = screen.getAllByText('Test');
      fireEvent.click(testButtons[0]);
      await waitFor(() => {
        expect(screen.getByText('Failed to send test notification to discord')).toBeDefined();
      });
    });
  });

  describe('input changes', () => {
    it('updates discord URL on input change', () => {
      render(<NotificationSettings />);
      const input = screen.getByPlaceholderText('https://discord.com/api/webhooks/...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'test-value' } });
      expect(input.value).toBe('test-value');
    });

    it('updates slack URL on input change', () => {
      render(<NotificationSettings />);
      const input = screen.getByPlaceholderText('https://hooks.slack.com/services/...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'slack-test' } });
      expect(input.value).toBe('slack-test');
    });
  });

  describe('styling', () => {
    it('has gray background', () => {
      const { container } = render(<NotificationSettings />);
      expect(container.innerHTML).toContain('bg-gray-800');
    });

    it('has rounded styling', () => {
      const { container } = render(<NotificationSettings />);
      expect(container.innerHTML).toContain('rounded-lg');
    });
  });

  describe('email section', () => {
    it('shows email not configured message', () => {
      render(<NotificationSettings />);
      expect(screen.getByText('Email notifications are not yet configured.')).toBeDefined();
    });

    it('shows future SMTP info', () => {
      render(<NotificationSettings />);
      expect(screen.getByText('Future implementation will support SMTP configuration.')).toBeDefined();
    });
  });

  describe('webhook creation hints', () => {
    it('shows discord webhook creation hint', () => {
      render(<NotificationSettings />);
      expect(screen.getByText(/Server Settings → Integrations → Webhooks/)).toBeDefined();
    });

    it('shows slack webhook creation hint', () => {
      render(<NotificationSettings />);
      expect(screen.getByText(/Workspace Settings → Apps → Incoming Webhooks/)).toBeDefined();
    });
  });

  describe('template variables', () => {
    it('shows input variable', () => {
      const { container } = render(<NotificationSettings />);
      expect(container.innerHTML).toContain('{{input}}');
    });

    it('shows workflow.name variable', () => {
      const { container } = render(<NotificationSettings />);
      expect(container.innerHTML).toContain('{{workflow.name}}');
    });

    it('shows execution.id variable', () => {
      const { container } = render(<NotificationSettings />);
      expect(container.innerHTML).toContain('{{execution.id}}');
    });

    it('shows timestamp variable', () => {
      const { container } = render(<NotificationSettings />);
      expect(container.innerHTML).toContain('{{timestamp}}');
    });
  });
});
