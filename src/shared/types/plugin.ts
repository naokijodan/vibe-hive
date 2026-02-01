// Plugin System Type Definitions

export interface PluginManifest {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  permissions: PluginPermission[];
  main?: string;        // Main process entry (relative path)
  renderer?: string;    // Renderer component (relative path)
  settingsSchema?: PluginSettingDefinition[];
  minAppVersion?: string;
}

export type PluginPermission =
  | 'ipc'           // Can register IPC handlers
  | 'filesystem'    // Can read/write files
  | 'network'       // Can make network requests
  | 'database'      // Can access database
  | 'terminal'      // Can spawn terminals
  | 'notification'  // Can send notifications
  | 'settings'      // Can read/write settings
  | 'workflow'      // Can register workflow nodes

export interface PluginSettingDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  default: unknown;
  description?: string;
  options?: { value: string; label: string }[];  // for 'select' type
}

export type PluginStatus = 'installed' | 'active' | 'disabled' | 'error';

export interface PluginInfo {
  id: string;           // directory name
  manifest: PluginManifest;
  status: PluginStatus;
  path: string;         // absolute path to plugin directory
  error?: string;
  settings: Record<string, unknown>;
}

export interface PluginContext {
  pluginId: string;
  pluginPath: string;
  log: (message: string) => void;
  settings: {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
    getAll: () => Record<string, unknown>;
  };
  ipc: {
    handle: (channel: string, handler: (...args: unknown[]) => Promise<unknown>) => void;
    send: (channel: string, ...args: unknown[]) => void;
  };
}

export interface PluginMainModule {
  activate: (context: PluginContext) => Promise<void>;
  deactivate?: () => Promise<void>;
}
