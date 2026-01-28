import React, { useState, useEffect } from 'react';
import { AppSettings as AppSettingsType } from '../../stores/settingsStore';

interface AppSettingsProps {
  settings: AppSettingsType;
  onUpdate: (settings: Partial<AppSettingsType>) => Promise<void>;
  isLoading: boolean;
}

export function AppSettings({ settings, onUpdate, isLoading }: AppSettingsProps): React.ReactElement {
  const [theme, setTheme] = useState(settings.theme);
  const [autoSaveInterval, setAutoSaveInterval] = useState(settings.autoSaveInterval);
  const [terminalFontSize, setTerminalFontSize] = useState(settings.terminalFontSize);
  const [maxLogEntries, setMaxLogEntries] = useState(settings.maxLogEntries);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setTheme(settings.theme);
    setAutoSaveInterval(settings.autoSaveInterval);
    setTerminalFontSize(settings.terminalFontSize);
    setMaxLogEntries(settings.maxLogEntries);
  }, [settings]);

  useEffect(() => {
    const changed =
      theme !== settings.theme ||
      autoSaveInterval !== settings.autoSaveInterval ||
      terminalFontSize !== settings.terminalFontSize ||
      maxLogEntries !== settings.maxLogEntries;
    setHasChanges(changed);
  }, [theme, autoSaveInterval, terminalFontSize, maxLogEntries, settings]);

  const handleSave = async () => {
    await onUpdate({
      theme,
      autoSaveInterval,
      terminalFontSize,
      maxLogEntries,
    });
    setHasChanges(false);
  };

  const handleReset = () => {
    setTheme(settings.theme);
    setAutoSaveInterval(settings.autoSaveInterval);
    setTerminalFontSize(settings.terminalFontSize);
    setMaxLogEntries(settings.maxLogEntries);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">App Settings</h3>
        <p className="text-sm text-hive-muted mb-6">
          Customize application behavior and appearance
        </p>
      </div>

      <div className="space-y-4">
        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Theme
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as AppSettingsType['theme'])}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-hive-surface border border-hive-border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-hive-accent disabled:opacity-50"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
          <p className="text-xs text-hive-muted mt-1">
            Choose your preferred color theme
          </p>
        </div>

        {/* Auto Save Interval */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Auto Save Interval (seconds)
          </label>
          <input
            type="number"
            value={autoSaveInterval}
            onChange={(e) => setAutoSaveInterval(parseInt(e.target.value) || 30)}
            disabled={isLoading}
            min="10"
            max="300"
            className="w-full px-4 py-2 bg-hive-surface border border-hive-border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-hive-accent disabled:opacity-50"
          />
          <p className="text-xs text-hive-muted mt-1">
            Automatically save data every N seconds (10-300)
          </p>
        </div>

        {/* Terminal Font Size */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Terminal Font Size (px)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              value={terminalFontSize}
              onChange={(e) => setTerminalFontSize(parseInt(e.target.value))}
              disabled={isLoading}
              min="10"
              max="24"
              className="flex-1"
            />
            <span className="text-white font-mono w-12 text-right">{terminalFontSize}px</span>
          </div>
          <p className="text-xs text-hive-muted mt-1">
            Adjust terminal text size for better readability
          </p>
        </div>

        {/* Max Log Entries */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Max Log Entries
          </label>
          <input
            type="number"
            value={maxLogEntries}
            onChange={(e) => setMaxLogEntries(parseInt(e.target.value) || 5000)}
            disabled={isLoading}
            min="1000"
            max="50000"
            step="1000"
            className="w-full px-4 py-2 bg-hive-surface border border-hive-border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-hive-accent disabled:opacity-50"
          />
          <p className="text-xs text-hive-muted mt-1">
            Maximum number of terminal log entries to store (1000-50000)
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-hive-border">
        <button
          onClick={handleReset}
          disabled={!hasChanges || isLoading}
          className="px-4 py-2 text-sm text-hive-muted hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          className="px-6 py-2 bg-hive-accent text-black font-medium rounded-md hover:bg-hive-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
