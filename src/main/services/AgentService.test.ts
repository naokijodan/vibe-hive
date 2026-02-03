import { describe, it, expect, vi, beforeEach } from 'vitest';

// These tests cover basic functionality without mocking the full start() flow
// as it uses dynamic require() which is challenging to mock in vitest

describe('AgentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports agentService singleton', async () => {
    const { mockKill, mockWrite, mockResize, mockOnData, mockOnExit } = {
      mockKill: vi.fn(),
      mockWrite: vi.fn(),
      mockResize: vi.fn(),
      mockOnData: vi.fn(),
      mockOnExit: vi.fn(),
    };

    vi.doMock('node-pty', () => ({
      spawn: vi.fn(() => ({
        kill: mockKill,
        write: mockWrite,
        resize: mockResize,
        onData: mockOnData,
        onExit: mockOnExit,
      })),
    }));

    vi.doMock('electron', () => ({
      BrowserWindow: class {},
    }));

    vi.doMock('./db/TerminalLogRepository', () => ({
      terminalLogRepository: {
        append: vi.fn(),
      },
    }));

    vi.doMock('./SettingsService', () => ({
      getSettingsService: () => ({
        getSettings: () => ({
          agent: {
            providers: {
              'claude-code': { cliPath: '/usr/local/bin/claude' },
              codex: { cliPath: '/usr/local/bin/codex' },
            },
          },
        }),
      }),
    }));

    const { agentService } = await import('./AgentService');
    expect(agentService).toBeDefined();
    expect(typeof agentService.setMainWindow).toBe('function');
    expect(typeof agentService.start).toBe('function');
    expect(typeof agentService.stop).toBe('function');
    expect(typeof agentService.input).toBe('function');
    expect(typeof agentService.resize).toBe('function');
    expect(typeof agentService.stopAll).toBe('function');
    expect(typeof agentService.getSession).toBe('function');
    expect(typeof agentService.getAllSessions).toBe('function');
  });

  it('getSession returns undefined for non-existent session', async () => {
    vi.doMock('node-pty', () => ({
      spawn: vi.fn(() => ({
        kill: vi.fn(),
        write: vi.fn(),
        resize: vi.fn(),
        onData: vi.fn(),
        onExit: vi.fn(),
      })),
    }));

    vi.doMock('electron', () => ({
      BrowserWindow: class {},
    }));

    vi.doMock('./db/TerminalLogRepository', () => ({
      terminalLogRepository: {
        append: vi.fn(),
      },
    }));

    vi.doMock('./SettingsService', () => ({
      getSettingsService: () => ({
        getSettings: () => ({
          agent: {
            providers: {},
          },
        }),
      }),
    }));

    const { agentService } = await import('./AgentService');
    const session = agentService.getSession('non-existent-session');
    expect(session).toBeUndefined();
  });

  it('input warns for non-existent session', async () => {
    vi.doMock('node-pty', () => ({
      spawn: vi.fn(() => ({
        kill: vi.fn(),
        write: vi.fn(),
        resize: vi.fn(),
        onData: vi.fn(),
        onExit: vi.fn(),
      })),
    }));

    vi.doMock('electron', () => ({
      BrowserWindow: class {},
    }));

    vi.doMock('./db/TerminalLogRepository', () => ({
      terminalLogRepository: {
        append: vi.fn(),
      },
    }));

    vi.doMock('./SettingsService', () => ({
      getSettingsService: () => ({
        getSettings: () => ({
          agent: {
            providers: {},
          },
        }),
      }),
    }));

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { agentService } = await import('./AgentService');
    agentService.input('non-existent', 'test');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('resize warns for non-existent session', async () => {
    vi.doMock('node-pty', () => ({
      spawn: vi.fn(() => ({
        kill: vi.fn(),
        write: vi.fn(),
        resize: vi.fn(),
        onData: vi.fn(),
        onExit: vi.fn(),
      })),
    }));

    vi.doMock('electron', () => ({
      BrowserWindow: class {},
    }));

    vi.doMock('./db/TerminalLogRepository', () => ({
      terminalLogRepository: {
        append: vi.fn(),
      },
    }));

    vi.doMock('./SettingsService', () => ({
      getSettingsService: () => ({
        getSettings: () => ({
          agent: {
            providers: {},
          },
        }),
      }),
    }));

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { agentService } = await import('./AgentService');
    agentService.resize('non-existent', 100, 50);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
