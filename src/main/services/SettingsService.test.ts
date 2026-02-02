import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const tmpDir = path.join(os.tmpdir(), `vibe-hive-test-${Date.now()}`);

// Mock electron safeStorage
vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: vi.fn((str: string) => Buffer.from(`enc:${str}`)),
    decryptString: vi.fn((buf: Buffer) => buf.toString().replace('enc:', '')),
  },
}));

// Mock os.homedir to use temp dir
vi.mock('os', async () => {
  const actual = await vi.importActual<typeof import('os')>('os');
  return { ...actual, homedir: () => tmpDir };
});

import { SettingsService } from './SettingsService';

describe('SettingsService', () => {
  beforeEach(() => {
    // Clean slate for each test
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(tmpDir, '.vibe-hive'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns default settings when no config file exists', () => {
    const service = new SettingsService();
    const settings = service.getSettings();
    expect(settings.app.theme).toBe('dark');
    expect(settings.app.terminalFontSize).toBe(14);
    expect(settings.agent.defaultAgent).toBe('claude-code');
  });

  it('loads settings from file and merges with defaults', () => {
    const settingsPath = path.join(tmpDir, '.vibe-hive', 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify({
      app: { theme: 'light', terminalFontSize: 18 },
    }), 'utf-8');

    const service = new SettingsService();
    const settings = service.getSettings();
    expect(settings.app.theme).toBe('light');
    expect(settings.app.terminalFontSize).toBe(18);
    // defaults preserved
    expect(settings.app.autoSaveInterval).toBe(30);
    expect(settings.agent.defaultAgent).toBe('claude-code');
  });

  it('updateAppSettings persists changes', () => {
    const service = new SettingsService();
    const updated = service.updateAppSettings({ terminalFontSize: 20 });
    expect(updated.app.terminalFontSize).toBe(20);

    // Verify file was written
    const settingsPath = path.join(tmpDir, '.vibe-hive', 'settings.json');
    const saved = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(saved.app.terminalFontSize).toBe(20);
  });

  it('updateGitSettings persists changes', () => {
    const service = new SettingsService();
    const updated = service.updateGitSettings({ userName: 'test-user' });
    expect(updated.git.userName).toBe('test-user');
  });

  it('updateAgentSettings handles API key via safeStorage', () => {
    const service = new SettingsService();
    service.updateAgentSettings({ claudeApiKey: 'sk-test-123' });

    // API key should be stored in encrypted file, not in settings JSON
    const settingsPath = path.join(tmpDir, '.vibe-hive', 'settings.json');
    const saved = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(saved.agent.claudeApiKey).toBeUndefined();

    // API key file should exist
    const apiKeyPath = path.join(tmpDir, '.vibe-hive', '.api-key.enc');
    expect(fs.existsSync(apiKeyPath)).toBe(true);

    // In-memory settings should have the key
    const settings = service.getSettings();
    expect(settings.agent.claudeApiKey).toBe('sk-test-123');
  });

  it('updateAgentSettings deletes API key when empty string', () => {
    const service = new SettingsService();
    service.updateAgentSettings({ claudeApiKey: 'sk-test-123' });
    service.updateAgentSettings({ claudeApiKey: '' });

    const apiKeyPath = path.join(tmpDir, '.vibe-hive', '.api-key.enc');
    expect(fs.existsSync(apiKeyPath)).toBe(false);
  });

  it('updateSettings merges all sections', () => {
    const service = new SettingsService();
    const updated = service.updateSettings({
      app: { theme: 'light' } as any,
      git: { userName: 'new-user' } as any,
    });
    expect(updated.app.theme).toBe('light');
    expect(updated.git.userName).toBe('new-user');
    // Other defaults preserved
    expect(updated.app.terminalFontSize).toBe(14);
  });

  it('resetSettings restores defaults via deep clone', () => {
    const service = new SettingsService();
    service.updateAppSettings({ terminalFontSize: 24, theme: 'light' });
    const reset = service.resetSettings();
    expect(reset.app.terminalFontSize).toBe(14);
    expect(reset.app.theme).toBe('dark');
    // Verify settings file was rewritten
    const settingsPath = path.join(tmpDir, '.vibe-hive', 'settings.json');
    expect(fs.existsSync(settingsPath)).toBe(true);
  });

  it('getSettingsPath returns correct path', () => {
    const service = new SettingsService();
    expect(service.getSettingsPath()).toBe(
      path.join(tmpDir, '.vibe-hive', 'settings.json')
    );
  });

  it('handles corrupted settings file gracefully', () => {
    const settingsPath = path.join(tmpDir, '.vibe-hive', 'settings.json');
    fs.writeFileSync(settingsPath, 'not valid json', 'utf-8');

    const service = new SettingsService();
    const settings = service.getSettings();
    // Falls back to defaults
    expect(settings.app.theme).toBe('dark');
    expect(settings.agent.defaultAgent).toBe('claude-code');
  });

  it('migrates plaintext API key to safeStorage', () => {
    const settingsPath = path.join(tmpDir, '.vibe-hive', 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify({
      agent: { claudeApiKey: 'sk-plain-key' },
    }), 'utf-8');

    const service = new SettingsService();
    // Key should be migrated to encrypted file
    const apiKeyPath = path.join(tmpDir, '.vibe-hive', '.api-key.enc');
    expect(fs.existsSync(apiKeyPath)).toBe(true);

    // Plaintext key removed from settings file
    const saved = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(saved.agent.claudeApiKey).toBeUndefined();

    // In-memory has the key
    expect(service.getSettings().agent.claudeApiKey).toBe('sk-plain-key');
  });
});
