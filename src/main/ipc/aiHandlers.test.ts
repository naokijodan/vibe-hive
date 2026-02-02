import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/AIAssistantService', () => ({
  getAIAssistantService: () => ({
    chat: vi.fn(),
    clearHistory: vi.fn(),
    hasApiKey: vi.fn(),
  }),
}));

import { registerAIHandlers } from './aiHandlers';

describe('aiHandlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers all AI assistant handlers', () => {
    registerAIHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('aiAssistant:chat');
    expect(channels).toContain('aiAssistant:clear');
    expect(channels).toContain('aiAssistant:hasKey');
    expect(mockHandle).toHaveBeenCalledTimes(3);
  });
});
