// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WebhookSettings } from './WebhookSettings';

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    webhook: {
      status: vi.fn().mockResolvedValue({ running: false, port: 3100, url: '' }),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

describe('WebhookSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('allows changing port number', async () => {
    render(<WebhookSettings />);
    await waitFor(() => {
      const input = screen.getByPlaceholderText('3100');
      fireEvent.change(input, { target: { value: '4000' } });
      expect(input).toHaveProperty('value', '4000');
    });
  });

  it('shows valid port range text', async () => {
    render(<WebhookSettings />);
    await waitFor(() => {
      expect(screen.getByText('Valid range: 1024-65535')).toBeDefined();
    });
  });

  it('shows status label', async () => {
    render(<WebhookSettings />);
    await waitFor(() => {
      expect(screen.getByText('Status')).toBeDefined();
    });
  });

  it('renders buttons', async () => {
    render(<WebhookSettings />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('renders status indicator dot', async () => {
    const { container } = render(<WebhookSettings />);
    await waitFor(() => {
      const dot = container.querySelector('.rounded-full');
      expect(dot).toBeDefined();
    });
  });
});
