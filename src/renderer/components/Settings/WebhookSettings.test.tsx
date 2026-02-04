// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WebhookSettings } from './WebhookSettings';

const { mockWebhookFns, mockStatus } = vi.hoisted(() => ({
  mockWebhookFns: {
    status: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  },
  mockStatus: {
    running: false,
    port: 3100,
    url: '',
  },
}));

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    webhook: {
      status: () => mockWebhookFns.status(),
      start: (port: number) => mockWebhookFns.start(port),
      stop: () => mockWebhookFns.stop(),
    },
  },
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('WebhookSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStatus.running = false;
    mockStatus.port = 3100;
    mockStatus.url = '';
    mockWebhookFns.status.mockResolvedValue({ ...mockStatus });
    mockWebhookFns.start.mockResolvedValue(undefined);
    mockWebhookFns.stop.mockResolvedValue(undefined);
  });

  describe('initial rendering', () => {
    it('renders webhook settings header', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Webhook Settings')).toBeDefined();
      });
    });

    it('shows stopped status by default', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Stopped')).toBeDefined();
      });
    });

    it('shows port configuration when stopped', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Port Number')).toBeDefined();
      });
    });

    it('shows port number input', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('3100')).toBeDefined();
      });
    });

    it('shows start button when stopped', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Start Webhook Server')).toBeDefined();
      });
    });

    it('shows valid port range text', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Valid range: 1024-65535')).toBeDefined();
      });
    });

    it('shows usage instructions', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('How to Use')).toBeDefined();
      });
    });
  });

  describe('running state', () => {
    beforeEach(() => {
      mockStatus.running = true;
      mockStatus.port = 4000;
      mockStatus.url = 'http://localhost:4000/webhook';
      mockWebhookFns.status.mockResolvedValue({ ...mockStatus });
    });

    it('shows Running status when running', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Running')).toBeDefined();
      });
    });

    it('shows port number when running', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('4000')).toBeDefined();
      });
    });

    it('shows stop button when running', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Stop Webhook Server')).toBeDefined();
      });
    });

    it('shows base webhook URL when running', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Base Webhook URL')).toBeDefined();
      });
    });

    it('shows copy button for URL', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeDefined();
      });
    });

    it('shows example curl command when running', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Example cURL Command')).toBeDefined();
      });
    });

    it('hides port configuration when running', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Running')).toBeDefined();
      });
      expect(screen.queryByText('Valid range: 1024-65535')).toBeNull();
    });
  });

  describe('port input', () => {
    it('allows changing port number', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        const input = screen.getByPlaceholderText('3100');
        fireEvent.change(input, { target: { value: '4000' } });
        expect(input).toHaveProperty('value', '4000');
      });
    });
  });

  describe('start server', () => {
    it('calls start with port number', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Start Webhook Server')).toBeDefined();
      });
      fireEvent.click(screen.getByText('Start Webhook Server'));
      await waitFor(() => {
        expect(mockWebhookFns.start).toHaveBeenCalledWith(3100);
      });
    });

    it('shows success message after start', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Start Webhook Server')).toBeDefined();
      });
      fireEvent.click(screen.getByText('Start Webhook Server'));
      await waitFor(() => {
        expect(screen.getByText(/Webhook server started/)).toBeDefined();
      });
    });

    it('shows error for invalid port (too low)', async () => {
      render(<WebhookSettings />);
      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByPlaceholderText('3100')).toBeDefined();
      });
      // Change port value
      const input = screen.getByPlaceholderText('3100');
      fireEvent.change(input, { target: { value: '100' } });
      // Click start
      fireEvent.click(screen.getByText('Start Webhook Server'));
      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Port must be between 1024 and 65535')).toBeDefined();
      });
    });

    it('shows error for invalid port (too high)', async () => {
      render(<WebhookSettings />);
      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByPlaceholderText('3100')).toBeDefined();
      });
      // Change port value
      const input = screen.getByPlaceholderText('3100');
      fireEvent.change(input, { target: { value: '99999' } });
      // Click start
      fireEvent.click(screen.getByText('Start Webhook Server'));
      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Port must be between 1024 and 65535')).toBeDefined();
      });
    });

    it('shows error for non-numeric port', async () => {
      render(<WebhookSettings />);
      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByPlaceholderText('3100')).toBeDefined();
      });
      // Change port value to non-numeric
      const input = screen.getByPlaceholderText('3100');
      fireEvent.change(input, { target: { value: 'abc' } });
      // Click start
      fireEvent.click(screen.getByText('Start Webhook Server'));
      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Port must be between 1024 and 65535')).toBeDefined();
      });
    });

    it('shows error when start fails', async () => {
      mockWebhookFns.start.mockRejectedValue(new Error('Connection refused'));
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Start Webhook Server')).toBeDefined();
      });
      fireEvent.click(screen.getByText('Start Webhook Server'));
      await waitFor(() => {
        expect(screen.getByText('Connection refused')).toBeDefined();
      });
    });

    it('shows generic error for non-Error start failure', async () => {
      mockWebhookFns.start.mockRejectedValue('Unknown error');
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Start Webhook Server')).toBeDefined();
      });
      fireEvent.click(screen.getByText('Start Webhook Server'));
      await waitFor(() => {
        expect(screen.getByText('Failed to start webhook server')).toBeDefined();
      });
    });
  });

  describe('stop server', () => {
    beforeEach(() => {
      mockStatus.running = true;
      mockStatus.port = 3100;
      mockStatus.url = 'http://localhost:3100/webhook';
      mockWebhookFns.status.mockResolvedValue({ ...mockStatus });
    });

    it('calls stop when button clicked', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Stop Webhook Server')).toBeDefined();
      });
      fireEvent.click(screen.getByText('Stop Webhook Server'));
      await waitFor(() => {
        expect(mockWebhookFns.stop).toHaveBeenCalled();
      });
    });

    it('shows success message after stop', async () => {
      mockWebhookFns.stop.mockResolvedValue(undefined);
      mockWebhookFns.status.mockResolvedValueOnce({ ...mockStatus })
        .mockResolvedValueOnce({ running: false, port: 3100, url: '' });
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Stop Webhook Server')).toBeDefined();
      });
      fireEvent.click(screen.getByText('Stop Webhook Server'));
      await waitFor(() => {
        expect(screen.getByText('Webhook server stopped')).toBeDefined();
      });
    });

    it('shows error when stop fails', async () => {
      mockWebhookFns.stop.mockRejectedValue(new Error('Stop failed'));
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Stop Webhook Server')).toBeDefined();
      });
      fireEvent.click(screen.getByText('Stop Webhook Server'));
      await waitFor(() => {
        expect(screen.getByText('Stop failed')).toBeDefined();
      });
    });

    it('shows generic error for non-Error stop failure', async () => {
      mockWebhookFns.stop.mockRejectedValue('Unknown error');
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Stop Webhook Server')).toBeDefined();
      });
      fireEvent.click(screen.getByText('Stop Webhook Server'));
      await waitFor(() => {
        expect(screen.getByText('Failed to stop webhook server')).toBeDefined();
      });
    });
  });

  describe('copy URL', () => {
    beforeEach(() => {
      mockStatus.running = true;
      mockStatus.port = 3100;
      mockStatus.url = 'http://localhost:3100/webhook';
      mockWebhookFns.status.mockResolvedValue({ ...mockStatus });
    });

    it('copies URL to clipboard when copy button clicked', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeDefined();
      });
      fireEvent.click(screen.getByText('Copy'));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3100/webhook');
    });

    it('shows success message after copy', async () => {
      render(<WebhookSettings />);
      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeDefined();
      });
      fireEvent.click(screen.getByText('Copy'));
      await waitFor(() => {
        expect(screen.getByText('Webhook URL copied to clipboard')).toBeDefined();
      });
    });
  });

  describe('status indicator', () => {
    it('renders status indicator dot', async () => {
      const { container } = render(<WebhookSettings />);
      await waitFor(() => {
        const dot = container.querySelector('.rounded-full');
        expect(dot).toBeDefined();
      });
    });

    it('shows gray dot when stopped', async () => {
      const { container } = render(<WebhookSettings />);
      await waitFor(() => {
        expect(container.innerHTML).toContain('bg-gray-500');
      });
    });

    it('shows green dot when running', async () => {
      mockStatus.running = true;
      mockStatus.url = 'http://localhost:3100/webhook';
      mockWebhookFns.status.mockResolvedValue({ ...mockStatus });
      const { container } = render(<WebhookSettings />);
      await waitFor(() => {
        expect(container.innerHTML).toContain('bg-green-500');
      });
    });
  });

  describe('error handling', () => {
    it('handles status load error gracefully', async () => {
      mockWebhookFns.status.mockRejectedValue(new Error('Network error'));
      const { container } = render(<WebhookSettings />);
      await waitFor(() => {
        // Component should still render
        expect(container.innerHTML).toContain('Webhook Settings');
      });
    });
  });

  describe('styling', () => {
    it('has gray background', async () => {
      const { container } = render(<WebhookSettings />);
      await waitFor(() => {
        expect(container.innerHTML).toContain('bg-gray-800');
      });
    });

    it('has rounded styling', async () => {
      const { container } = render(<WebhookSettings />);
      await waitFor(() => {
        expect(container.innerHTML).toContain('rounded-lg');
      });
    });
  });
});
