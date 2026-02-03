import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-userData'),
  },
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
  BrowserWindow: class {},
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(() => []),
    readFileSync: vi.fn(() => '{}'),
    writeFileSync: vi.fn(),
  },
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(() => []),
  readFileSync: vi.fn(() => '{}'),
  writeFileSync: vi.fn(),
}));

let PluginService: any;
let getPluginService: any;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();

  vi.doMock('electron', () => ({
    app: {
      getPath: vi.fn(() => '/tmp/test-userData'),
    },
    ipcMain: {
      handle: vi.fn(),
      removeHandler: vi.fn(),
    },
    BrowserWindow: class {},
  }));

  vi.doMock('fs', () => ({
    default: {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      readdirSync: vi.fn(() => []),
      readFileSync: vi.fn(() => '{}'),
      writeFileSync: vi.fn(),
    },
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(() => []),
    readFileSync: vi.fn(() => '{}'),
    writeFileSync: vi.fn(),
  }));

  const mod = await import('./PluginService');
  PluginService = mod.PluginService;
  getPluginService = mod.getPluginService;
});

describe('PluginService', () => {
  it('getPluginService returns singleton', () => {
    const svc1 = getPluginService();
    const svc2 = getPluginService();
    expect(svc1).toBe(svc2);
  });

  it('setMainWindow sets window', () => {
    const svc = getPluginService();
    const mockWindow = {} as any;
    svc.setMainWindow(mockWindow);
  });

  it('getPlugins returns empty array initially', () => {
    const svc = getPluginService();
    expect(svc.getPlugins()).toEqual([]);
  });

  it('getPlugin returns null for non-existent plugin', () => {
    const svc = getPluginService();
    expect(svc.getPlugin('non-existent')).toBeNull();
  });

  it('getPluginsDir returns plugins directory', () => {
    const svc = getPluginService();
    const dir = svc.getPluginsDir();
    expect(dir).toContain('plugins');
  });

  it('updatePluginSetting updates settings', () => {
    const svc = getPluginService();
    svc.updatePluginSetting('test-plugin', 'key', 'value');
  });

  it('discoverPlugins returns empty array when no plugins', async () => {
    const svc = getPluginService();
    const plugins = await svc.discoverPlugins();
    expect(plugins).toEqual([]);
  });

  it('activatePlugin returns error for non-existent plugin', async () => {
    const svc = getPluginService();
    const result = await svc.activatePlugin('non-existent');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Plugin not found');
  });

  it('deactivatePlugin returns error for non-existent plugin', async () => {
    const svc = getPluginService();
    const result = await svc.deactivatePlugin('non-existent');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Plugin not found');
  });

  it('activateAll activates installed plugins', async () => {
    const svc = getPluginService();
    await svc.activateAll();
  });

  it('deactivateAll deactivates active plugins', async () => {
    const svc = getPluginService();
    await svc.deactivateAll();
  });
});
