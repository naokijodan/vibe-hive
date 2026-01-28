import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface GitSettings {
  userName: string;
  userEmail: string;
  defaultRepo: string;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  autoSaveInterval: number; // seconds
  terminalFontSize: number;
  maxLogEntries: number;
}

export interface Settings {
  git: GitSettings;
  app: AppSettings;
}

const DEFAULT_SETTINGS: Settings = {
  git: {
    userName: '',
    userEmail: '',
    defaultRepo: process.cwd(),
  },
  app: {
    theme: 'dark',
    autoSaveInterval: 30,
    terminalFontSize: 14,
    maxLogEntries: 5000,
  },
};

export class SettingsService {
  private settingsPath: string;
  private settings: Settings;

  constructor() {
    const homeDir = os.homedir();
    const vibeHiveDir = path.join(homeDir, '.vibe-hive');
    
    // Ensure directory exists
    if (!fs.existsSync(vibeHiveDir)) {
      fs.mkdirSync(vibeHiveDir, { recursive: true });
    }

    this.settingsPath = path.join(vibeHiveDir, 'settings.json');
    this.settings = this.loadSettings();
  }

  private loadSettings(): Settings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8');
        const parsed = JSON.parse(data);
        
        // Merge with defaults to handle new settings
        return {
          git: { ...DEFAULT_SETTINGS.git, ...parsed.git },
          app: { ...DEFAULT_SETTINGS.app, ...parsed.app },
        };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    return DEFAULT_SETTINGS;
  }

  private saveSettings(): boolean {
    try {
      fs.writeFileSync(
        this.settingsPath,
        JSON.stringify(this.settings, null, 2),
        'utf-8'
      );
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  getSettings(): Settings {
    return this.settings;
  }

  updateSettings(updates: Partial<Settings>): Settings {
    this.settings = {
      git: { ...this.settings.git, ...(updates.git || {}) },
      app: { ...this.settings.app, ...(updates.app || {}) },
    };

    this.saveSettings();
    return this.settings;
  }

  updateGitSettings(gitSettings: Partial<GitSettings>): Settings {
    this.settings.git = { ...this.settings.git, ...gitSettings };
    this.saveSettings();
    return this.settings;
  }

  updateAppSettings(appSettings: Partial<AppSettings>): Settings {
    this.settings.app = { ...this.settings.app, ...appSettings };
    this.saveSettings();
    return this.settings;
  }

  resetSettings(): Settings {
    this.settings = DEFAULT_SETTINGS;
    this.saveSettings();
    return this.settings;
  }

  getSettingsPath(): string {
    return this.settingsPath;
  }
}

// Singleton instance
let instance: SettingsService | null = null;

export function getSettingsService(): SettingsService {
  if (!instance) {
    instance = new SettingsService();
  }
  return instance;
}
