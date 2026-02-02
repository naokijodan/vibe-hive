import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/ClaudeHooksService', () => ({
  getClaudeHooksService: () => ({
    getHooks: vi.fn(), addHook: vi.fn(), updateHook: vi.fn(), deleteHook: vi.fn(),
    getPresets: vi.fn(), addPreset: vi.fn(), getLogs: vi.fn(), clearLogs: vi.fn(), reloadFromDisk: vi.fn(),
  }),
}));

import { registerClaudeHooksHandlers } from './claudeHooksHandlers';

describe('claudeHooksHandlers', () => {
  beforeEach(() => vi.clearAllMocks());
  it('registers all claude hooks handlers', () => {
    registerClaudeHooksHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('claudeHooks:getHooks');
    expect(channels).toContain('claudeHooks:addHook');
    expect(channels).toContain('claudeHooks:updateHook');
    expect(channels).toContain('claudeHooks:deleteHook');
    expect(channels).toContain('claudeHooks:getPresets');
    expect(channels).toContain('claudeHooks:addPreset');
    expect(channels).toContain('claudeHooks:getLogs');
    expect(channels).toContain('claudeHooks:clearLogs');
    expect(channels).toContain('claudeHooks:reload');
  });
});
