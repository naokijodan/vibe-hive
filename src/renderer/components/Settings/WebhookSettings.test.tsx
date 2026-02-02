// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { WebhookSettings } from './WebhookSettings';

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    webhook: {
      status: vi.fn().mockResolvedValue({ running: false, port: 3100, url: '' }),
      start: vi.fn(),
      stop: vi.fn(),
    },
  },
}));

describe('WebhookSettings', () => {
  it('renders webhook settings header', async () => {
    render(<WebhookSettings />);
    await waitFor(() => {
      expect(screen.getAllByText(/Webhook/i).length).toBeGreaterThan(0);
    });
  });
});
