import React, { useState, useEffect, useCallback } from 'react';
import { ipcBridge } from '../../bridge/ipcBridge';

interface ThemeColors {
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

interface ThemePreset {
  id: string;
  name: string;
  colors: ThemeColors;
}

interface ThemeSettings {
  activeThemeId: string;
  customAccent?: string;
}

function applyThemeColors(colors: Record<string, string>): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(`--hive-${key}`, value);
  }
}

const ACCENT_PRESETS = [
  '#58a6ff', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#fb923c', '#eab308',
  '#4ade80', '#22d3ee', '#06b6d4', '#14b8a6',
];

export function ThemePanel(): React.ReactElement {
  const [presets, setPresets] = useState<ThemePreset[]>([]);
  const [settings, setSettings] = useState<ThemeSettings>({ activeThemeId: 'default-dark' });
  const [customAccent, setCustomAccent] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([
        ipcBridge.theme.getPresets(),
        ipcBridge.theme.getSettings(),
      ]);
      setPresets(p as unknown as ThemePreset[]);
      setSettings(s);
      if (s.customAccent) setCustomAccent(s.customAccent);
    } catch (err) {
      console.error('Failed to load theme data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectTheme = async (themeId: string) => {
    const colors = await ipcBridge.theme.setTheme(themeId);
    applyThemeColors(colors);
    setSettings(prev => ({ ...prev, activeThemeId: themeId, customAccent: undefined }));
    setCustomAccent('');
  };

  const handleAccentChange = async (color: string) => {
    setCustomAccent(color);
    const colors = await ipcBridge.theme.setCustomAccent(color);
    applyThemeColors(colors);
    setSettings(prev => ({ ...prev, customAccent: color }));
  };

  const handleResetAccent = async () => {
    const colors = await ipcBridge.theme.resetCustomAccent();
    applyThemeColors(colors);
    setSettings(prev => ({ ...prev, customAccent: undefined }));
    setCustomAccent('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mr-3" />
        読み込み中...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-hive-bg text-hive-text overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-hive-border">
        <h2 className="text-xl font-bold">カスタムテーマ</h2>
        <p className="text-sm text-hive-muted mt-1">アプリの外観をカスタマイズ</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Theme Presets */}
        <section>
          <h3 className="text-sm font-semibold text-hive-muted uppercase tracking-wider mb-4">
            テーマプリセット
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {presets.map(preset => {
              const isActive = settings.activeThemeId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectTheme(preset.id)}
                  className={`relative rounded-lg border-2 transition-all overflow-hidden ${
                    isActive
                      ? 'border-hive-accent ring-2 ring-hive-accent/30'
                      : 'border-hive-border hover:border-hive-muted'
                  }`}
                >
                  {/* Color preview */}
                  <div
                    className="h-24 p-3 flex flex-col justify-between"
                    style={{ backgroundColor: preset.colors.bg }}
                  >
                    <div className="flex gap-1.5">
                      {['accent', 'success', 'warning', 'error'].map(key => (
                        <div
                          key={key}
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.colors[key as keyof ThemeColors] }}
                        />
                      ))}
                    </div>
                    <div className="space-y-1">
                      <div
                        className="h-2 rounded w-3/4"
                        style={{ backgroundColor: preset.colors.surface }}
                      />
                      <div
                        className="h-2 rounded w-1/2"
                        style={{ backgroundColor: preset.colors.border }}
                      />
                    </div>
                  </div>
                  {/* Label */}
                  <div
                    className="px-3 py-2 text-sm font-medium"
                    style={{
                      backgroundColor: preset.colors.surface,
                      color: preset.colors.text,
                      borderTop: `1px solid ${preset.colors.border}`,
                    }}
                  >
                    {preset.name}
                    {isActive && (
                      <span className="ml-2 text-xs" style={{ color: preset.colors.accent }}>
                        (Active)
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Custom Accent Color */}
        <section>
          <h3 className="text-sm font-semibold text-hive-muted uppercase tracking-wider mb-4">
            アクセントカラー
          </h3>
          <div className="space-y-4">
            {/* Color presets */}
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map(color => (
                <button
                  key={color}
                  onClick={() => handleAccentChange(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    customAccent === color ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Custom color input */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-hive-muted">カスタム:</label>
              <input
                type="color"
                value={customAccent || settings.customAccent || '#58a6ff'}
                onChange={e => handleAccentChange(e.target.value)}
                className="w-10 h-8 rounded cursor-pointer border border-hive-border bg-transparent"
              />
              <span className="text-sm font-mono text-hive-muted">
                {customAccent || settings.customAccent || 'デフォルト'}
              </span>
              {(customAccent || settings.customAccent) && (
                <button
                  onClick={handleResetAccent}
                  className="text-xs text-hive-muted hover:text-hive-text px-2 py-1 rounded bg-hive-surface border border-hive-border"
                >
                  リセット
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Preview */}
        <section>
          <h3 className="text-sm font-semibold text-hive-muted uppercase tracking-wider mb-4">
            プレビュー
          </h3>
          <div className="bg-hive-surface border border-hive-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-hive-accent font-medium">アクセント</span>
              <span className="text-hive-text">テキスト</span>
              <span className="text-hive-muted">ミュート</span>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-hive-accent text-black rounded text-sm font-medium">
                ボタン
              </span>
              <span className="px-3 py-1 bg-hive-success/20 text-hive-success rounded text-sm">
                成功
              </span>
              <span className="px-3 py-1 bg-hive-warning/20 text-hive-warning rounded text-sm">
                警告
              </span>
              <span className="px-3 py-1 bg-hive-error/20 text-hive-error rounded text-sm">
                エラー
              </span>
            </div>
            <div className="h-px bg-hive-border" />
            <p className="text-sm text-hive-muted">
              テーマの変更はアプリ全体に即時反映されます。設定は自動保存されます。
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
