import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreate, mockAll, mockRun, mockPrepare } = vi.hoisted(() => {
  const mockAll = vi.fn(() => []);
  const mockRun = vi.fn(() => ({ changes: 1 }));
  return {
    mockCreate: vi.fn(),
    mockAll,
    mockRun,
    mockPrepare: vi.fn(() => ({ all: mockAll, run: mockRun })),
  };
});

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: mockCreate };
    constructor() {}
  },
}));

vi.mock('./SettingsService', () => ({
  getSettingsService: () => ({
    getSettings: () => ({
      agent: { claudeApiKey: 'test-key' },
    }),
  }),
}));

vi.mock('./db/Database', () => ({
  getDatabase: () => ({ prepare: mockPrepare }),
}));

let getAIAssistantService: () => any;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.doMock('@anthropic-ai/sdk', () => ({
    default: class {
      messages = { create: mockCreate };
      constructor() {}
    },
  }));
  vi.doMock('./SettingsService', () => ({
    getSettingsService: () => ({
      getSettings: () => ({
        agent: { claudeApiKey: 'test-key' },
      }),
    }),
  }));
  vi.doMock('./db/Database', () => ({
    getDatabase: () => ({ prepare: mockPrepare }),
  }));
  const mod = await import('./AIAssistantService');
  getAIAssistantService = mod.getAIAssistantService;
});

describe('AIAssistantService', () => {
  it('hasApiKey returns true when key set', () => {
    const svc = getAIAssistantService();
    expect(svc.hasApiKey()).toBe(true);
  });

  it('clearHistory resets conversation', () => {
    const svc = getAIAssistantService();
    svc.clearHistory();
    // No error
  });

  it('chat returns reply from Anthropic', async () => {
    mockCreate.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'Hello!' }],
    });

    const svc = getAIAssistantService();
    const result = await svc.chat('Hi');
    expect(result.reply).toBe('Hello!');
    expect(result.toolResults).toHaveLength(0);
  });

  it('chat handles tool_use loop', async () => {
    mockCreate
      .mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [
          { type: 'tool_use', id: 'tu1', name: 'list_tasks', input: {} },
        ],
      })
      .mockResolvedValueOnce({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Tasks listed.' }],
      });

    mockAll.mockReturnValue([{ id: '1', title: 'Task 1' }]);

    const svc = getAIAssistantService();
    const result = await svc.chat('Show tasks');
    expect(result.reply).toBe('Tasks listed.');
    expect(result.toolResults).toHaveLength(1);
    expect(result.toolResults[0].toolName).toBe('list_tasks');
  });

  it('chat handles error', async () => {
    mockCreate.mockRejectedValue(new Error('API error'));

    const svc = getAIAssistantService();
    const result = await svc.chat('Hi');
    expect(result.reply).toContain('エラー');
  });

  it('chat returns no-key message when key missing', async () => {
    vi.resetModules();
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class { messages = { create: mockCreate }; },
    }));
    vi.doMock('./SettingsService', () => ({
      getSettingsService: () => ({
        getSettings: () => ({ agent: { claudeApiKey: '' } }),
      }),
    }));
    vi.doMock('./db/Database', () => ({
      getDatabase: () => ({ prepare: mockPrepare }),
    }));
    const mod = await import('./AIAssistantService');
    const svc = mod.getAIAssistantService();
    const result = await svc.chat('Hi');
    expect(result.reply).toContain('APIキー');
  });
});
