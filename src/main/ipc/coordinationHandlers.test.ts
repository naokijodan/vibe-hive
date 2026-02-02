import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock('../services/AgentCoordinationService', () => ({
  getAgentCoordinationService: () => ({
    sendMessage: vi.fn(),
    delegateTask: vi.fn(),
    respondToDelegation: vi.fn(),
    getMessages: vi.fn(),
    getMessagesByAgent: vi.fn(),
    getDelegations: vi.fn(),
    clearMessages: vi.fn(),
  }),
}));

import { registerCoordinationHandlers } from './coordinationHandlers';

describe('coordinationHandlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers all coordination handlers', () => {
    registerCoordinationHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('coordination:sendMessage');
    expect(channels).toContain('coordination:delegateTask');
    expect(channels).toContain('coordination:respondDelegation');
    expect(channels).toContain('coordination:getMessages');
    expect(channels).toContain('coordination:getMessagesByAgent');
    expect(channels).toContain('coordination:getDelegations');
    expect(channels).toContain('coordination:clearMessages');
  });
});
