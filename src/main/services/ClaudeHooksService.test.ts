import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFs, mockOs } = vi.hoisted(() => ({
  mockFs: {
    existsSync: vi.fn().mockReturnValue(false),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
  mockOs: {
    homedir: vi.fn(() => '/home/test'),
  },
}));

vi.mock('fs', () => mockFs);
vi.mock('os', () => mockOs);
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return actual;
});
vi.mock('electron', () => ({
  BrowserWindow: class {},
}));

// We need to reset the singleton for each test
let getClaudeHooksService: () => any;

beforeEach(async () => {
  vi.clearAllMocks();
  mockFs.existsSync.mockReturnValue(false);
  // Reset module to get fresh singleton
  vi.resetModules();
  // Re-apply mocks after reset
  vi.doMock('fs', () => mockFs);
  vi.doMock('os', () => mockOs);
  vi.doMock('electron', () => ({ BrowserWindow: class {} }));
  const mod = await import('./ClaudeHooksService');
  getClaudeHooksService = mod.getClaudeHooksService;
});

describe('ClaudeHooksService', () => {
  it('constructs with empty hooks when no settings file', () => {
    const service = getClaudeHooksService();
    expect(service.getHooks()).toEqual([]);
  });

  it('loads hooks from settings file', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({
      hooks: {
        Notification: [{ command: 'echo hello', description: 'test' }],
      },
    }));

    vi.resetModules();
    vi.doMock('fs', () => mockFs);
    vi.doMock('os', () => mockOs);
    vi.doMock('electron', () => ({ BrowserWindow: class {} }));
    const mod = await import('./ClaudeHooksService');
    const service = mod.getClaudeHooksService();

    const hooks = service.getHooks();
    expect(hooks).toHaveLength(1);
    expect(hooks[0].event).toBe('Notification');
  });

  it('addHook adds a hook', () => {
    const service = getClaudeHooksService();
    const hook = service.addHook({ event: 'Stop', command: 'echo stop', enabled: true });

    expect(hook.id).toBeTruthy();
    expect(service.getHooks()).toHaveLength(1);
  });

  it('updateHook updates existing hook', () => {
    const service = getClaudeHooksService();
    const hook = service.addHook({ event: 'Stop', command: 'old', enabled: true });
    const updated = service.updateHook(hook.id, { command: 'new' });
    expect(updated?.command).toBe('new');
  });

  it('updateHook returns null for non-existent', () => {
    const service = getClaudeHooksService();
    expect(service.updateHook('bad-id', { command: 'x' })).toBeNull();
  });

  it('deleteHook removes hook', () => {
    const service = getClaudeHooksService();
    const hook = service.addHook({ event: 'Stop', command: 'x', enabled: true });
    expect(service.deleteHook(hook.id)).toBe(true);
    expect(service.getHooks()).toHaveLength(0);
  });

  it('deleteHook returns false for non-existent', () => {
    const service = getClaudeHooksService();
    expect(service.deleteHook('bad')).toBe(false);
  });

  it('getPresets returns preset hooks', () => {
    const service = getClaudeHooksService();
    expect(service.getPresets().length).toBeGreaterThan(0);
  });

  it('addPreset adds a preset hook', () => {
    const service = getClaudeHooksService();
    const result = service.addPreset(0);
    expect(result).toBeTruthy();
    expect(service.getHooks()).toHaveLength(1);
  });

  it('addPreset returns null for invalid index', () => {
    const service = getClaudeHooksService();
    expect(service.addPreset(-1)).toBeNull();
    expect(service.addPreset(999)).toBeNull();
  });

  it('addLog and getLogs work', () => {
    const service = getClaudeHooksService();
    service.addLog({ hookId: 'h1', event: 'Stop', command: 'echo' });
    expect(service.getLogs()).toHaveLength(1);
  });

  it('clearLogs clears all logs', () => {
    const service = getClaudeHooksService();
    service.addLog({ hookId: 'h1', event: 'Stop', command: 'echo' });
    service.clearLogs();
    expect(service.getLogs()).toHaveLength(0);
  });
});
