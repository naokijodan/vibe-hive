import React, { useState, useEffect } from 'react';
import type { AgentSettings as AgentSettingsType, ModelProviderConfig } from '../../stores/settingsStore';

interface AgentModelSettingsProps {
  settings: AgentSettingsType;
  onUpdate: (settings: Partial<AgentSettingsType>) => Promise<void>;
  isLoading: boolean;
}

const PROVIDERS: { key: keyof AgentSettingsType['providers']; label: string; description: string }[] = [
  { key: 'claude-code', label: 'Claude Code', description: 'Anthropic Claude Code CLI' },
  { key: 'codex', label: 'Codex CLI', description: 'OpenAI Codex CLI' },
  { key: 'gemini', label: 'Gemini CLI', description: 'Google Gemini CLI' },
  { key: 'ollama', label: 'Ollama', description: 'Local LLM via Ollama' },
];

export function AgentModelSettings({ settings, onUpdate, isLoading }: AgentModelSettingsProps): React.ReactElement {
  const [providers, setProviders] = useState(settings.providers);
  const [defaultAgent, setDefaultAgent] = useState(settings.defaultAgent);
  const [ollamaModel, setOllamaModel] = useState(settings.ollamaDefaultModel);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setProviders(settings.providers);
    setDefaultAgent(settings.defaultAgent);
    setOllamaModel(settings.ollamaDefaultModel);
  }, [settings]);

  useEffect(() => {
    const changed =
      JSON.stringify(providers) !== JSON.stringify(settings.providers) ||
      defaultAgent !== settings.defaultAgent ||
      ollamaModel !== settings.ollamaDefaultModel;
    setHasChanges(changed);
  }, [providers, defaultAgent, ollamaModel, settings]);

  const updateProvider = (key: keyof AgentSettingsType['providers'], updates: Partial<ModelProviderConfig>) => {
    setProviders(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates },
    }));
  };

  const handleSave = async () => {
    await onUpdate({
      providers,
      defaultAgent,
      ollamaDefaultModel: ollamaModel,
    });
    setHasChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    setProviders(settings.providers);
    setDefaultAgent(settings.defaultAgent);
    setOllamaModel(settings.ollamaDefaultModel);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">AI Model Settings</h3>
        <p className="text-sm text-hive-muted mb-6">
          Configure AI model providers and CLI paths for agent execution
        </p>
      </div>

      {/* Default Agent */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Default Agent
        </label>
        <select
          value={defaultAgent}
          onChange={(e) => setDefaultAgent(e.target.value)}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-hive-surface border border-hive-border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-hive-accent disabled:opacity-50"
        >
          {PROVIDERS.filter(p => providers[p.key].enabled).map(p => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
        <p className="text-xs text-hive-muted mt-1">
          Default agent type for new workflow agent nodes
        </p>
      </div>

      {/* Provider Cards */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-white">Providers</h4>
        {PROVIDERS.map(({ key, label, description }) => (
          <div
            key={key}
            className={`p-4 rounded-lg border transition-colors ${
              providers[key].enabled
                ? 'bg-hive-surface border-hive-accent/50'
                : 'bg-hive-surface/50 border-hive-border opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs text-hive-muted">{description}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={providers[key].enabled}
                  onChange={(e) => updateProvider(key, { enabled: e.target.checked })}
                  disabled={isLoading}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-hive-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-hive-accent" />
              </label>
            </div>

            {providers[key].enabled && (
              <div className="space-y-3 mt-3 pt-3 border-t border-hive-border">
                <div>
                  <label className="block text-xs text-hive-muted mb-1">CLI Path</label>
                  <input
                    type="text"
                    value={providers[key].cliPath}
                    onChange={(e) => updateProvider(key, { cliPath: e.target.value })}
                    disabled={isLoading}
                    className="w-full px-3 py-1.5 bg-hive-bg border border-hive-border rounded text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-hive-accent disabled:opacity-50"
                    placeholder={key === 'claude-code' ? 'claude' : key}
                  />
                </div>
                <div>
                  <label className="block text-xs text-hive-muted mb-1">Default Arguments (optional)</label>
                  <input
                    type="text"
                    value={providers[key].defaultArgs || ''}
                    onChange={(e) => updateProvider(key, { defaultArgs: e.target.value || undefined })}
                    disabled={isLoading}
                    className="w-full px-3 py-1.5 bg-hive-bg border border-hive-border rounded text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-hive-accent disabled:opacity-50"
                    placeholder="Additional CLI arguments"
                  />
                </div>
                {key === 'ollama' && (
                  <div>
                    <label className="block text-xs text-hive-muted mb-1">Default Model</label>
                    <input
                      type="text"
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-1.5 bg-hive-bg border border-hive-border rounded text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-hive-accent disabled:opacity-50"
                      placeholder="llama3"
                    />
                    <p className="text-xs text-hive-muted mt-1">
                      Model name for Ollama (e.g., llama3, codellama, mistral)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-md">
          <p className="text-sm text-green-400">Settings saved</p>
        </div>
      )}

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
