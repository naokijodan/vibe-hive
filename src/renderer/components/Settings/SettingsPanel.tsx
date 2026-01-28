import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { GitSettings } from './GitSettings';
import { AppSettings } from './AppSettings';
import { WebhookSettings } from './WebhookSettings';
import { NotificationSettings } from './NotificationSettings';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'git' | 'app' | 'webhook' | 'notification' | 'about';

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps): React.ReactElement | null {
  const {
    settings,
    isLoading,
    error,
    loadSettings,
    updateGitSettings,
    updateAppSettings,
    resetSettings,
    clearError,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<Tab>('git');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      loadSettings();
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isVisible) {
    return null;
  }

  const handleResetAll = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      await resetSettings();
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 100);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="bg-hive-bg border border-hive-border rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hive-border">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={handleClose}
            className="text-hive-muted hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm text-red-400 flex-1">{error}</div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-hive-border px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('git')}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'git'
                ? 'text-hive-accent border-b-2 border-hive-accent'
                : 'text-hive-muted hover:text-white'
            }`}
          >
            Git
          </button>
          <button
            onClick={() => setActiveTab('app')}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'app'
                ? 'text-hive-accent border-b-2 border-hive-accent'
                : 'text-hive-muted hover:text-white'
            }`}
          >
            App
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'webhook'
                ? 'text-hive-accent border-b-2 border-hive-accent'
                : 'text-hive-muted hover:text-white'
            }`}
          >
            Webhook
          </button>
          <button
            onClick={() => setActiveTab('notification')}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'notification'
                ? 'text-hive-accent border-b-2 border-hive-accent'
                : 'text-hive-muted hover:text-white'
            }`}
          >
            Notification
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'about'
                ? 'text-hive-accent border-b-2 border-hive-accent'
                : 'text-hive-muted hover:text-white'
            }`}
          >
            About
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && !settings ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-hive-muted">Loading settings...</div>
            </div>
          ) : settings ? (
            <>
              {activeTab === 'git' && (
                <GitSettings
                  settings={settings.git}
                  onUpdate={updateGitSettings}
                  isLoading={isLoading}
                />
              )}
              {activeTab === 'app' && (
                <AppSettings
                  settings={settings.app}
                  onUpdate={updateAppSettings}
                  isLoading={isLoading}
                />
              )}
              {activeTab === 'webhook' && <WebhookSettings />}
              {activeTab === 'notification' && <NotificationSettings />}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">About Vibe Hive</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-hive-muted w-24">Version:</span>
                        <span className="text-white font-mono">0.2.0</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-hive-muted w-24">License:</span>
                        <span className="text-white">MIT</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-hive-muted w-24">Author:</span>
                        <span className="text-white">Vibe Hive Team</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-hive-border">
                    <h4 className="text-sm font-semibold text-white mb-3">Links</h4>
                    <div className="space-y-2 text-sm">
                      <a
                        href="https://github.com/your-org/vibe-hive"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-hive-accent hover:underline"
                      >
                        📦 GitHub Repository
                      </a>
                      <a
                        href="https://github.com/your-org/vibe-hive/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-hive-accent hover:underline"
                      >
                        🐛 Report Issue
                      </a>
                      <a
                        href="https://docs.vibe-hive.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-hive-accent hover:underline"
                      >
                        📚 Documentation
                      </a>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-hive-border">
                    <h4 className="text-sm font-semibold text-white mb-3">Danger Zone</h4>
                    <button
                      onClick={handleResetAll}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Reset All Settings
                    </button>
                    <p className="text-xs text-hive-muted mt-2">
                      This will reset all settings to their default values
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-hive-muted">
              Failed to load settings
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-hive-border px-6 py-4 flex items-center justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-hive-surface text-white font-medium rounded-md hover:bg-hive-surface/80 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
