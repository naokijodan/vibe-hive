// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ClaudeHooksPanel } from './ClaudeHooksPanel';

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    claudeHooks: {
      getHooks: vi.fn().mockResolvedValue([
        { id: 'h1', event: 'PreToolUse', matcher: '*', command: 'echo test', enabled: true },
      ]),
      getPresets: vi.fn().mockResolvedValue([]),
      getLogs: vi.fn().mockResolvedValue([]),
      onLog: vi.fn(() => vi.fn()),
      addHook: vi.fn(),
      addPreset: vi.fn(),
      deleteHook: vi.fn(),
      updateHook: vi.fn(),
      clearLogs: vi.fn(),
      reload: vi.fn(),
    },
  },
}));

describe('ClaudeHooksPanel', () => {
  it('renders header', async () => {
    render(<ClaudeHooksPanel />);
    await waitFor(() => {
      expect(screen.getByText(/Claude.*Hook/i)).toBeDefined();
    });
  });

  it('loads and displays hooks', async () => {
    render(<ClaudeHooksPanel />);
    await waitFor(() => {
      expect(screen.getByText(/echo test/)).toBeDefined();
    });
  });
});
