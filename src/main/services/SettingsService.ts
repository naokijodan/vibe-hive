import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { safeStorage } from 'electron';

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

export interface ModelProviderConfig {
  enabled: boolean;
  cliPath: string;
  defaultArgs?: string;
}

export interface AgentSettings {
  defaultAgent: string;
  providers: {
    'claude-code': ModelProviderConfig;
    'codex': ModelProviderConfig;
    'gemini': ModelProviderConfig;
    'ollama': ModelProviderConfig;
  };
  ollamaDefaultModel: string;
  claudeApiKey?: string;
}

export interface Settings {
  git: GitSettings;
  app: AppSettings;
  agent: AgentSettings;
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
  agent: {
    defaultAgent: 'claude-code',
    providers: {
      'claude-code': { enabled: true, cliPath: 'claude' },
      'codex': { enabled: true, cliPath: 'codex' },
      'gemini': { enabled: false, cliPath: 'gemini' },
      'ollama': { enabled: false, cliPath: 'ollama' },
    },
    ollamaDefaultModel: 'llama3',
  },
};

export class SettingsService {
  private settingsPath: string;
  private apiKeyPath: string;
  private settings: Settings;

  constructor() {
    const homeDir = os.homedir();
    const vibeHiveDir = path.join(homeDir, '.vibe-hive');

    // Ensure directory exists
    if (!fs.existsSync(vibeHiveDir)) {
      fs.mkdirSync(vibeHiveDir, { recursive: true });
    }

    this.settingsPath = path.join(vibeHiveDir, 'settings.json');
    this.apiKeyPath = path.join(vibeHiveDir, '.api-key.enc');
    this.settings = this.loadSettings();
  }

  private loadSettings(): Settings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8');
        const parsed = JSON.parse(data);

        // Merge with defaults to handle new settings
        const settings: Settings = {
          git: { ...DEFAULT_SETTINGS.git, ...parsed.git },
          app: { ...DEFAULT_SETTINGS.app, ...parsed.app },
          agent: {
            ...DEFAULT_SETTINGS.agent,
            ...parsed.agent,
            providers: {
              ...DEFAULT_SETTINGS.agent.providers,
              ...(parsed.agent?.providers || {}),
            },
          },
        };

        // Remove plaintext API key from settings file (migrate to safeStorage)
        if (parsed.agent?.claudeApiKey) {
          this.saveApiKey(parsed.agent.claudeApiKey);
          // Remove from JSON file
          delete parsed.agent.claudeApiKey;
          fs.writeFileSync(this.settingsPath, JSON.stringify(parsed, null, 2), 'utf-8');
        }

        // Load API key from safeStorage
        settings.agent.claudeApiKey = this.loadApiKey() || undefined;
        return settings;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    return DEFAULT_SETTINGS;
  }

  private saveSettings(): boolean {
    try {
      // Save settings WITHOUT the API key (stored separately in safeStorage)
      const settingsToSave = {
        ...this.settings,
        agent: { ...this.settings.agent },
      };
      delete settingsToSave.agent.claudeApiKey;

      fs.writeFileSync(
        this.settingsPath,
        JSON.stringify(settingsToSave, null, 2),
        'utf-8'
      );
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  private saveApiKey(apiKey: string): void {
    try {
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(apiKey);
        fs.writeFileSync(this.apiKeyPath, encrypted);
      } else {
        // Fallback: save as-is (better than not saving at all)
        fs.writeFileSync(this.apiKeyPath, apiKey, 'utf-8');
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  }

  private loadApiKey(): string | null {
    try {
      if (!fs.existsSync(this.apiKeyPath)) return null;
      const data = fs.readFileSync(this.apiKeyPath);
      if (safeStorage.isEncryptionAvailable()) {
        return safeStorage.decryptString(data);
      }
      // Fallback: read as plain text
      return data.toString('utf-8');
    } catch (error) {
      console.error('Failed to load API key:', error);
      return null;
    }
  }

  getSettings(): Settings {
    return this.settings;
  }

  updateAgentSettings(agentSettings: Partial<AgentSettings>): Settings {
    // Handle API key separately via safeStorage
    if (agentSettings.claudeApiKey !== undefined) {
      if (agentSettings.claudeApiKey) {
        this.saveApiKey(agentSettings.claudeApiKey);
      } else {
        // Empty string = delete key
        try { fs.unlinkSync(this.apiKeyPath); } catch { /* ignore */ }
      }
    }

    this.settings.agent = {
      ...this.settings.agent,
      ...agentSettings,
      providers: {
        ...this.settings.agent.providers,
        ...(agentSettings.providers || {}),
      },
    };
    this.saveSettings();
    // Re-attach API key to in-memory settings
    this.settings.agent.claudeApiKey = this.loadApiKey() || undefined;
    return this.settings;
  }

  updateSettings(updates: Partial<Settings>): Settings {
    // Handle API key separately
    if (updates.agent?.claudeApiKey !== undefined) {
      if (updates.agent.claudeApiKey) {
        this.saveApiKey(updates.agent.claudeApiKey);
      } else {
        try { fs.unlinkSync(this.apiKeyPath); } catch { /* ignore */ }
      }
    }

    this.settings = {
      git: { ...this.settings.git, ...(updates.git || {}) },
      app: { ...this.settings.app, ...(updates.app || {}) },
      agent: {
        ...this.settings.agent,
        ...(updates.agent || {}),
        providers: {
          ...this.settings.agent.providers,
          ...(updates.agent?.providers || {}),
        },
      },
    };

    this.saveSettings();
    this.settings.agent.claudeApiKey = this.loadApiKey() || undefined;
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
