import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BrowserWindow } from 'electron';

export type HookEvent = 'PreToolUse' | 'PostToolUse' | 'Notification' | 'Stop' | 'SubagentStop';

export interface HookDefinition {
  id: string;
  event: HookEvent;
  matcher?: string; // tool name matcher for PreToolUse/PostToolUse
  command: string;
  enabled: boolean;
  description?: string;
}

export interface HookLogEntry {
  id: string;
  hookId: string;
  event: HookEvent;
  command: string;
  output?: string;
  exitCode?: number;
  timestamp: string;
}

const PRESET_HOOKS: Omit<HookDefinition, 'id'>[] = [
  {
    event: 'Notification',
    command: 'osascript -e \'display notification "$CLAUDE_NOTIFICATION_MESSAGE" with title "Claude Code"\'',
    enabled: false,
    description: 'Claude通知をmacOSデスクトップ通知で表示',
  },
  {
    event: 'PostToolUse',
    matcher: 'Write',
    command: 'echo "File written: $CLAUDE_TOOL_INPUT_FILE_PATH"',
    enabled: false,
    description: 'ファイル書き込み後にログ出力',
  },
  {
    event: 'Stop',
    command: 'echo "Claude session stopped at $(date)"',
    enabled: false,
    description: 'セッション停止時にタイムスタンプ記録',
  },
];

class ClaudeHooksService {
  private hooks: HookDefinition[] = [];
  private logs: HookLogEntry[] = [];
  private maxLogs = 200;
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.hooks = this.loadHooks();
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private getSettingsPath(): string | null {
    // Look for .claude/settings.json in home directory
    const homePath = path.join(os.homedir(), '.claude', 'settings.json');
    if (fs.existsSync(homePath)) return homePath;

    // Also check project-level .claude/settings.json
    const cwdPath = path.join(process.cwd(), '.claude', 'settings.json');
    if (fs.existsSync(cwdPath)) return cwdPath;

    return homePath; // default to home
  }

  private loadHooks(): HookDefinition[] {
    try {
      const settingsPath = this.getSettingsPath();
      if (settingsPath && fs.existsSync(settingsPath)) {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        const settings = JSON.parse(content);
        if (settings.hooks && typeof settings.hooks === 'object') {
          // Convert Claude Code hooks format to our format
          return this.parseClaudeHooks(settings.hooks);
        }
      }
    } catch (error) {
      console.error('Failed to load Claude hooks:', error);
    }
    return [];
  }

  private parseClaudeHooks(hooksObj: Record<string, unknown[]>): HookDefinition[] {
    const result: HookDefinition[] = [];
    let counter = 0;

    for (const [event, hookList] of Object.entries(hooksObj)) {
      if (!Array.isArray(hookList)) continue;
      for (const hook of hookList) {
        const h = hook as Record<string, unknown>;
        counter++;
        result.push({
          id: `hook-${counter}`,
          event: event as HookEvent,
          matcher: h.matcher as string | undefined,
          command: (h.command as string) || '',
          enabled: true,
          description: (h.description as string) || undefined,
        });
      }
    }

    return result;
  }

  private saveHooks(): boolean {
    try {
      const settingsPath = this.getSettingsPath();
      if (!settingsPath) return false;

      // Ensure directory exists
      const dir = path.dirname(settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Read existing settings
      let settings: Record<string, unknown> = {};
      if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      }

      // Convert our format to Claude Code hooks format
      const hooksObj: Record<string, unknown[]> = {};
      for (const hook of this.hooks) {
        if (!hook.enabled) continue;
        if (!hooksObj[hook.event]) hooksObj[hook.event] = [];
        const entry: Record<string, unknown> = { command: hook.command };
        if (hook.matcher) entry.matcher = hook.matcher;
        hooksObj[hook.event].push(entry);
      }

      settings.hooks = hooksObj;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('Failed to save hooks:', error);
      return false;
    }
  }

  getHooks(): HookDefinition[] {
    return [...this.hooks];
  }

  addHook(hook: Omit<HookDefinition, 'id'>): HookDefinition {
    const newHook: HookDefinition = {
      ...hook,
      id: `hook-${Date.now()}`,
    };
    this.hooks.push(newHook);
    this.saveHooks();
    return newHook;
  }

  updateHook(id: string, updates: Partial<HookDefinition>): HookDefinition | null {
    const index = this.hooks.findIndex(h => h.id === id);
    if (index === -1) return null;
    this.hooks[index] = { ...this.hooks[index], ...updates, id };
    this.saveHooks();
    return this.hooks[index];
  }

  deleteHook(id: string): boolean {
    const index = this.hooks.findIndex(h => h.id === id);
    if (index === -1) return false;
    this.hooks.splice(index, 1);
    this.saveHooks();
    return true;
  }

  getPresets(): Omit<HookDefinition, 'id'>[] {
    return PRESET_HOOKS;
  }

  addPreset(index: number): HookDefinition | null {
    if (index < 0 || index >= PRESET_HOOKS.length) return null;
    return this.addHook(PRESET_HOOKS[index]);
  }

  getLogs(): HookLogEntry[] {
    return [...this.logs];
  }

  addLog(entry: Omit<HookLogEntry, 'id' | 'timestamp'>): HookLogEntry {
    const log: HookLogEntry = {
      ...entry,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    this.notifyRenderer('claudeHooks:log', log);
    return log;
  }

  clearLogs(): void {
    this.logs = [];
  }

  reloadFromDisk(): HookDefinition[] {
    this.hooks = this.loadHooks();
    return this.hooks;
  }

  private notifyRenderer(channel: string, data: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}

let instance: ClaudeHooksService | null = null;

export function getClaudeHooksService(): ClaudeHooksService {
  if (!instance) {
    instance = new ClaudeHooksService();
  }
  return instance;
}
