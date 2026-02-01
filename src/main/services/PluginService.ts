// Plugin Service - Discovery, loading, lifecycle management
import fs from 'fs';
import path from 'path';
import { app, ipcMain, BrowserWindow } from 'electron';
import type {
  PluginManifest,
  PluginInfo,
  PluginStatus,
  PluginContext,
  PluginMainModule,
  PluginSettingDefinition,
} from '../../shared/types/plugin';

const PLUGINS_DIR_NAME = 'plugins';
const PLUGIN_SETTINGS_FILE = 'plugin-settings.json';

export class PluginService {
  private plugins: Map<string, PluginInfo> = new Map();
  private activeModules: Map<string, PluginMainModule> = new Map();
  private registeredHandlers: Map<string, string[]> = new Map(); // pluginId -> channel[]
  private mainWindow: BrowserWindow | null = null;
  private pluginsDir: string;
  private settingsPath: string;
  private allPluginSettings: Record<string, Record<string, unknown>> = {};

  constructor() {
    const userDataPath = app.getPath('userData');
    this.pluginsDir = path.join(userDataPath, PLUGINS_DIR_NAME);
    this.settingsPath = path.join(userDataPath, PLUGIN_SETTINGS_FILE);

    // Ensure plugins directory exists
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }

    this.loadPluginSettings();
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  // --- Discovery & Loading ---

  async discoverPlugins(): Promise<PluginInfo[]> {
    this.plugins.clear();

    if (!fs.existsSync(this.pluginsDir)) {
      return [];
    }

    const entries = fs.readdirSync(this.pluginsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const pluginDir = path.join(this.pluginsDir, entry.name);
      const manifestPath = path.join(pluginDir, 'manifest.json');

      if (!fs.existsSync(manifestPath)) continue;

      try {
        const raw = fs.readFileSync(manifestPath, 'utf-8');
        const manifest: PluginManifest = JSON.parse(raw);

        if (!this.validateManifest(manifest)) {
          this.plugins.set(entry.name, {
            id: entry.name,
            manifest,
            status: 'error',
            path: pluginDir,
            error: 'Invalid manifest: missing required fields',
            settings: this.getPluginSettings(entry.name, manifest.settingsSchema),
          });
          continue;
        }

        const savedStatus = this.allPluginSettings[entry.name]?.__status as PluginStatus | undefined;

        this.plugins.set(entry.name, {
          id: entry.name,
          manifest,
          status: savedStatus === 'disabled' ? 'disabled' : 'installed',
          path: pluginDir,
          settings: this.getPluginSettings(entry.name, manifest.settingsSchema),
        });
      } catch (err) {
        this.plugins.set(entry.name, {
          id: entry.name,
          manifest: { name: entry.name, displayName: entry.name, version: '0.0.0', description: '', author: '', permissions: [] },
          status: 'error',
          path: pluginDir,
          error: `Failed to parse manifest: ${err instanceof Error ? err.message : String(err)}`,
          settings: {},
        });
      }
    }

    return Array.from(this.plugins.values());
  }

  async activatePlugin(pluginId: string): Promise<{ success: boolean; error?: string }> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return { success: false, error: 'Plugin not found' };
    if (plugin.status === 'active') return { success: true };
    if (plugin.status === 'error') return { success: false, error: plugin.error };

    try {
      // Load main process module if defined
      if (plugin.manifest.main) {
        const mainPath = path.join(plugin.path, plugin.manifest.main);
        if (!fs.existsSync(mainPath)) {
          return { success: false, error: `Main module not found: ${plugin.manifest.main}` };
        }

        // Clear require cache for hot-reload support
        delete require.cache[require.resolve(mainPath)];
        const mod: PluginMainModule = require(mainPath);

        if (typeof mod.activate !== 'function') {
          return { success: false, error: 'Main module missing activate() function' };
        }

        const context = this.createPluginContext(pluginId, plugin.path);
        await mod.activate(context);
        this.activeModules.set(pluginId, mod);
      }

      plugin.status = 'active';
      this.savePluginStatus(pluginId, 'active');
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      plugin.status = 'error';
      plugin.error = errorMsg;
      return { success: false, error: errorMsg };
    }
  }

  async deactivatePlugin(pluginId: string): Promise<{ success: boolean; error?: string }> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return { success: false, error: 'Plugin not found' };

    try {
      // Call deactivate on module
      const mod = this.activeModules.get(pluginId);
      if (mod?.deactivate) {
        await mod.deactivate();
      }
      this.activeModules.delete(pluginId);

      // Remove registered IPC handlers
      const channels = this.registeredHandlers.get(pluginId) || [];
      for (const channel of channels) {
        ipcMain.removeHandler(channel);
      }
      this.registeredHandlers.delete(pluginId);

      plugin.status = 'disabled';
      this.savePluginStatus(pluginId, 'disabled');
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async activateAll(): Promise<void> {
    for (const [id, plugin] of this.plugins) {
      if (plugin.status === 'installed') {
        await this.activatePlugin(id);
      }
    }
  }

  async deactivateAll(): Promise<void> {
    for (const id of this.activeModules.keys()) {
      await this.deactivatePlugin(id);
    }
  }

  // --- Plugin Info ---

  getPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(pluginId: string): PluginInfo | null {
    return this.plugins.get(pluginId) || null;
  }

  getPluginsDir(): string {
    return this.pluginsDir;
  }

  // --- Plugin Settings ---

  updatePluginSetting(pluginId: string, key: string, value: unknown): void {
    if (!this.allPluginSettings[pluginId]) {
      this.allPluginSettings[pluginId] = {};
    }
    this.allPluginSettings[pluginId][key] = value;

    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.settings[key] = value;
    }

    this.saveAllPluginSettings();
  }

  // --- Private ---

  private validateManifest(manifest: PluginManifest): boolean {
    return !!(
      manifest.name &&
      manifest.displayName &&
      manifest.version &&
      typeof manifest.name === 'string' &&
      typeof manifest.version === 'string'
    );
  }

  private createPluginContext(pluginId: string, pluginPath: string): PluginContext {
    const service = this;
    return {
      pluginId,
      pluginPath,
      log: (message: string) => {
        console.log(`[Plugin:${pluginId}] ${message}`);
      },
      settings: {
        get: (key: string) => {
          return service.allPluginSettings[pluginId]?.[key];
        },
        set: (key: string, value: unknown) => {
          service.updatePluginSetting(pluginId, key, value);
        },
        getAll: () => {
          return { ...(service.allPluginSettings[pluginId] || {}) };
        },
      },
      ipc: {
        handle: (channel: string, handler: (...args: unknown[]) => Promise<unknown>) => {
          const fullChannel = `plugin:${pluginId}:${channel}`;
          ipcMain.handle(fullChannel, async (_event, ...args) => handler(...args));
          if (!service.registeredHandlers.has(pluginId)) {
            service.registeredHandlers.set(pluginId, []);
          }
          service.registeredHandlers.get(pluginId)!.push(fullChannel);
        },
        send: (channel: string, ...args: unknown[]) => {
          const fullChannel = `plugin:${pluginId}:${channel}`;
          if (service.mainWindow && !service.mainWindow.isDestroyed()) {
            service.mainWindow.webContents.send(fullChannel, ...args);
          }
        },
      },
    };
  }

  private getPluginSettings(pluginId: string, schema?: PluginSettingDefinition[]): Record<string, unknown> {
    const saved = this.allPluginSettings[pluginId] || {};
    const result: Record<string, unknown> = {};

    if (schema) {
      for (const def of schema) {
        result[def.key] = saved[def.key] !== undefined ? saved[def.key] : def.default;
      }
    }

    // Include any extra saved settings not in schema
    for (const [key, value] of Object.entries(saved)) {
      if (key !== '__status' && !(key in result)) {
        result[key] = value;
      }
    }

    return result;
  }

  private savePluginStatus(pluginId: string, status: PluginStatus): void {
    if (!this.allPluginSettings[pluginId]) {
      this.allPluginSettings[pluginId] = {};
    }
    this.allPluginSettings[pluginId].__status = status;
    this.saveAllPluginSettings();
  }

  private loadPluginSettings(): void {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const raw = fs.readFileSync(this.settingsPath, 'utf-8');
        this.allPluginSettings = JSON.parse(raw);
      }
    } catch {
      this.allPluginSettings = {};
    }
  }

  private saveAllPluginSettings(): void {
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.allPluginSettings, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save plugin settings:', err);
    }
  }
}

// Singleton
let instance: PluginService | null = null;

export function getPluginService(): PluginService {
  if (!instance) {
    instance = new PluginService();
  }
  return instance;
}
