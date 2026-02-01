import React, { useEffect, useState } from 'react';
import { usePluginStore } from '../../stores/pluginStore';
import type { PluginInfo, PluginSettingDefinition } from '../../../shared/types/plugin';

export function PluginManager(): React.ReactElement {
  const {
    plugins,
    pluginsDir,
    isLoading,
    error,
    loadPlugins,
    activatePlugin,
    deactivatePlugin,
    updateSetting,
    refreshPlugins,
    loadPluginsDir,
  } = usePluginStore();

  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadPlugins();
    loadPluginsDir();
  }, [loadPlugins, loadPluginsDir]);

  const handleToggle = async (plugin: PluginInfo) => {
    setActionError(null);
    if (plugin.status === 'active') {
      const result = await deactivatePlugin(plugin.id);
      if (!result.success) setActionError(result.error || 'Failed to deactivate');
    } else {
      const result = await activatePlugin(plugin.id);
      if (!result.success) setActionError(result.error || 'Failed to activate');
    }
  };

  const selected = plugins.find(p => p.id === selectedPlugin);

  const statusBadge = (status: PluginInfo['status']) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      installed: 'bg-blue-500/20 text-blue-400',
      disabled: 'bg-gray-500/20 text-gray-400',
      error: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || colors.disabled}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Plugin Manager</h2>
            <p className="text-sm text-hive-muted mt-1">
              Manage third-party extensions
            </p>
          </div>
          <button
            onClick={refreshPlugins}
            disabled={isLoading}
            className="px-4 py-2 bg-hive-accent text-black font-medium rounded-md hover:bg-hive-accent/90 transition-colors disabled:opacity-50 text-sm"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Error display */}
        {(error || actionError) && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-sm text-red-400">{error || actionError}</p>
          </div>
        )}

        {/* Plugin directory info */}
        <div className="mb-6 p-4 bg-hive-surface border border-hive-border rounded-lg">
          <div className="text-xs text-hive-muted mb-1">Plugin Directory</div>
          <div className="text-sm text-white font-mono break-all">{pluginsDir || 'Loading...'}</div>
          <p className="text-xs text-hive-muted mt-2">
            Place plugin folders here. Each plugin needs a <code className="text-hive-accent">manifest.json</code> file.
          </p>
        </div>

        {/* Plugin list */}
        {plugins.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🧩</div>
            <h3 className="text-lg font-medium text-white mb-2">No Plugins Installed</h3>
            <p className="text-sm text-hive-muted mb-4">
              Add plugin folders to the plugins directory to get started.
            </p>
            <div className="text-xs text-left bg-hive-bg rounded-lg p-4 max-w-md mx-auto space-y-2">
              <p className="text-hive-accent font-medium">Plugin Structure:</p>
              <pre className="text-hive-muted">
{`my-plugin/
  manifest.json
  main.js (optional)
  renderer.js (optional)`}
              </pre>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {plugins.map(plugin => (
              <div
                key={plugin.id}
                className={`p-4 bg-hive-surface border rounded-lg transition-colors cursor-pointer ${
                  selectedPlugin === plugin.id
                    ? 'border-hive-accent'
                    : 'border-hive-border hover:border-hive-border/80'
                }`}
                onClick={() => setSelectedPlugin(selectedPlugin === plugin.id ? null : plugin.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {plugin.manifest.displayName}
                      </span>
                      <span className="text-xs text-hive-muted font-mono">
                        v{plugin.manifest.version}
                      </span>
                      {statusBadge(plugin.status)}
                    </div>
                    <p className="text-xs text-hive-muted mt-1">
                      {plugin.manifest.description || 'No description'}
                    </p>
                    {plugin.manifest.author && (
                      <p className="text-xs text-hive-muted">
                        by {plugin.manifest.author}
                      </p>
                    )}
                    {plugin.error && (
                      <p className="text-xs text-red-400 mt-1">{plugin.error}</p>
                    )}
                  </div>
                  <div className="ml-4" onClick={(e) => e.stopPropagation()}>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plugin.status === 'active'}
                        onChange={() => handleToggle(plugin)}
                        disabled={plugin.status === 'error' || isLoading}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-hive-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-hive-accent peer-disabled:opacity-50" />
                    </label>
                  </div>
                </div>

                {/* Expanded details */}
                {selectedPlugin === plugin.id && (
                  <div className="mt-4 pt-4 border-t border-hive-border space-y-4">
                    {/* Permissions */}
                    {plugin.manifest.permissions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-hive-muted uppercase mb-2">Permissions</h4>
                        <div className="flex flex-wrap gap-1">
                          {plugin.manifest.permissions.map(perm => (
                            <span key={perm} className="px-2 py-0.5 bg-hive-bg rounded text-xs text-hive-muted">
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Settings */}
                    {plugin.manifest.settingsSchema && plugin.manifest.settingsSchema.length > 0 && (
                      <PluginSettingsForm
                        pluginId={plugin.id}
                        schema={plugin.manifest.settingsSchema}
                        values={plugin.settings}
                        onUpdate={updateSetting}
                        disabled={plugin.status !== 'active'}
                      />
                    )}

                    {/* Info */}
                    <div className="text-xs text-hive-muted">
                      <span>ID: {plugin.id}</span>
                      <span className="mx-2">|</span>
                      <span>Path: {plugin.path}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Inline settings form for a plugin
function PluginSettingsForm({
  pluginId,
  schema,
  values,
  onUpdate,
  disabled,
}: {
  pluginId: string;
  schema: PluginSettingDefinition[];
  values: Record<string, unknown>;
  onUpdate: (pluginId: string, key: string, value: unknown) => Promise<void>;
  disabled: boolean;
}): React.ReactElement {
  return (
    <div>
      <h4 className="text-xs font-semibold text-hive-muted uppercase mb-2">Settings</h4>
      <div className="space-y-3">
        {schema.map(def => (
          <div key={def.key}>
            <label className="block text-xs text-white mb-1">{def.label}</label>
            {def.type === 'boolean' ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(values[def.key] ?? def.default)}
                  onChange={(e) => onUpdate(pluginId, def.key, e.target.checked)}
                  disabled={disabled}
                  className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-hive-accent text-hive-accent"
                />
                <span className="text-xs text-hive-muted">{def.description}</span>
              </label>
            ) : def.type === 'select' ? (
              <select
                value={String(values[def.key] ?? def.default)}
                onChange={(e) => onUpdate(pluginId, def.key, e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-1.5 bg-hive-bg border border-hive-border rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-hive-accent disabled:opacity-50"
              >
                {def.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : def.type === 'number' ? (
              <input
                type="number"
                value={Number(values[def.key] ?? def.default)}
                onChange={(e) => onUpdate(pluginId, def.key, parseFloat(e.target.value))}
                disabled={disabled}
                className="w-full px-3 py-1.5 bg-hive-bg border border-hive-border rounded text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-hive-accent disabled:opacity-50"
              />
            ) : (
              <input
                type="text"
                value={String(values[def.key] ?? def.default ?? '')}
                onChange={(e) => onUpdate(pluginId, def.key, e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-1.5 bg-hive-bg border border-hive-border rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-hive-accent disabled:opacity-50"
              />
            )}
            {def.description && def.type !== 'boolean' && (
              <p className="text-xs text-hive-muted mt-0.5">{def.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
