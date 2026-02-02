import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./SettingsService', () => ({
  getSettingsService: () => ({
    getSettings: () => ({}),
    updateSettings: vi.fn(),
  }),
}));

let getThemeService: () => any;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.doMock('./SettingsService', () => ({
    getSettingsService: () => ({
      getSettings: () => ({}),
      updateSettings: vi.fn(),
    }),
  }));
  const mod = await import('./ThemeService');
  getThemeService = mod.getThemeService;
});

describe('ThemeService', () => {
  it('getSettings returns default', () => {
    const svc = getThemeService();
    expect(svc.getSettings().activeThemeId).toBe('default-dark');
  });

  it('getPresets returns all themes', () => {
    const svc = getThemeService();
    const presets = svc.getPresets();
    expect(presets.length).toBeGreaterThanOrEqual(5);
    expect(presets[0].id).toBe('default-dark');
  });

  it('getActiveTheme returns default-dark by default', () => {
    const svc = getThemeService();
    const theme = svc.getActiveTheme();
    expect(theme.id).toBe('default-dark');
    expect(theme.colors.bg).toBe('#0d1117');
  });

  it('getActiveColors returns RGB values', () => {
    const svc = getThemeService();
    const colors = svc.getActiveColors();
    // #0d1117 -> "13, 17, 23"
    expect(colors.bg).toBe('13, 17, 23');
  });

  it('setTheme changes active theme', () => {
    const svc = getThemeService();
    const colors = svc.setTheme('midnight-blue');
    expect(svc.getSettings().activeThemeId).toBe('midnight-blue');
    // #0a0e1a -> "10, 14, 26"
    expect(colors.bg).toBe('10, 14, 26');
  });

  it('setTheme with invalid id does nothing', () => {
    const svc = getThemeService();
    svc.setTheme('nonexistent');
    expect(svc.getSettings().activeThemeId).toBe('default-dark');
  });

  it('setCustomAccent overrides accent color', () => {
    const svc = getThemeService();
    const colors = svc.setCustomAccent('#ff0000');
    // #ff0000 -> "255, 0, 0"
    expect(colors.accent).toBe('255, 0, 0');
  });

  it('resetCustomAccent removes custom accent', () => {
    const svc = getThemeService();
    svc.setCustomAccent('#ff0000');
    const colors = svc.resetCustomAccent();
    // default-dark accent is #58a6ff -> "88, 166, 255"
    expect(colors.accent).toBe('88, 166, 255');
  });

  it('setTheme clears custom accent', () => {
    const svc = getThemeService();
    svc.setCustomAccent('#ff0000');
    svc.setTheme('light');
    expect(svc.getSettings().customAccent).toBeUndefined();
  });
});
