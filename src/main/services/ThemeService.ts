import { getSettingsService } from './SettingsService';

export interface ThemeColors {
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: ThemeColors;
}

export interface ThemeSettings {
  activeThemeId: string;
  customAccent?: string;
}

const PRESET_THEMES: ThemePreset[] = [
  {
    id: 'default-dark',
    name: 'Default Dark',
    colors: {
      bg: '#0d1117',
      surface: '#161b22',
      border: '#30363d',
      text: '#c9d1d9',
      muted: '#8b949e',
      accent: '#58a6ff',
      success: '#3fb950',
      warning: '#d29922',
      error: '#f85149',
    },
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    colors: {
      bg: '#0a0e1a',
      surface: '#111827',
      border: '#1e3a5f',
      text: '#d1d5db',
      muted: '#9ca3af',
      accent: '#6366f1',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#ef4444',
    },
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    colors: {
      bg: '#0a120e',
      surface: '#111f17',
      border: '#1e3a2b',
      text: '#d1dbd5',
      muted: '#8b9e92',
      accent: '#4ade80',
      success: '#22c55e',
      warning: '#eab308',
      error: '#f87171',
    },
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    colors: {
      bg: '#120d0a',
      surface: '#1f1611',
      border: '#3a2a1e',
      text: '#dbd1c9',
      muted: '#9e8b7e',
      accent: '#fb923c',
      success: '#4ade80',
      warning: '#facc15',
      error: '#ef4444',
    },
  },
  {
    id: 'light',
    name: 'Light',
    colors: {
      bg: '#ffffff',
      surface: '#f6f8fa',
      border: '#d0d7de',
      text: '#1f2328',
      muted: '#656d76',
      accent: '#0969da',
      success: '#1a7f37',
      warning: '#9a6700',
      error: '#cf222e',
    },
  },
];

const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  activeThemeId: 'default-dark',
};

class ThemeService {
  private settings: ThemeSettings;

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): ThemeSettings {
    try {
      const appSettings = getSettingsService().getSettings();
      const theme = (appSettings as unknown as Record<string, unknown>).theme as
        | Partial<ThemeSettings>
        | undefined;
      if (theme) {
        return { ...DEFAULT_THEME_SETTINGS, ...theme };
      }
    } catch { /* use defaults */ }
    return { ...DEFAULT_THEME_SETTINGS };
  }

  private saveSettings(): void {
    try {
      getSettingsService().updateSettings({ theme: this.settings } as unknown as Record<string, unknown>);
    } catch (error) {
      console.error('Failed to save theme settings:', error);
    }
  }

  getPresets(): ThemePreset[] {
    return PRESET_THEMES;
  }

  getSettings(): ThemeSettings {
    return { ...this.settings };
  }

  getActiveTheme(): ThemePreset {
    const preset = PRESET_THEMES.find(t => t.id === this.settings.activeThemeId);
    return preset || PRESET_THEMES[0];
  }

  getActiveColors(): ThemeColors {
    const theme = this.getActiveTheme();
    const colors = { ...theme.colors };
    if (this.settings.customAccent) {
      colors.accent = this.settings.customAccent;
    }
    return colors;
  }

  setTheme(themeId: string): ThemeColors {
    const preset = PRESET_THEMES.find(t => t.id === themeId);
    if (!preset) return this.getActiveColors();
    this.settings.activeThemeId = themeId;
    this.settings.customAccent = undefined;
    this.saveSettings();
    return this.getActiveColors();
  }

  setCustomAccent(color: string): ThemeColors {
    this.settings.customAccent = color;
    this.saveSettings();
    return this.getActiveColors();
  }

  resetCustomAccent(): ThemeColors {
    this.settings.customAccent = undefined;
    this.saveSettings();
    return this.getActiveColors();
  }
}

let instance: ThemeService | null = null;

export function getThemeService(): ThemeService {
  if (!instance) {
    instance = new ThemeService();
  }
  return instance;
}
