import React, { useState, useEffect, useCallback } from 'react';
import { ipcBridge } from '../../bridge/ipcBridge';

interface HookDefinition {
  id: string;
  event: string;
  matcher?: string;
  command: string;
  enabled: boolean;
  description?: string;
}

interface HookPreset {
  event: string;
  matcher?: string;
  command: string;
  enabled: boolean;
  description?: string;
}

interface HookLog {
  id: string;
  hookId: string;
  event: string;
  command: string;
  output?: string;
  exitCode?: number;
  timestamp: string;
}

type TabType = 'hooks' | 'presets' | 'logs';

const HOOK_EVENTS = ['PreToolUse', 'PostToolUse', 'Notification', 'Stop', 'SubagentStop'];

const EVENT_COLORS: Record<string, string> = {
  PreToolUse: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PostToolUse: 'bg-green-500/20 text-green-400 border-green-500/30',
  Notification: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Stop: 'bg-red-500/20 text-red-400 border-red-500/30',
  SubagentStop: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export function ClaudeHooksPanel(): React.ReactElement {
  const [hooks, setHooks] = useState<HookDefinition[]>([]);
  const [presets, setPresets] = useState<HookPreset[]>([]);
  const [logs, setLogs] = useState<HookLog[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('hooks');
  const [isAdding, setIsAdding] = useState(false);
  const [newHook, setNewHook] = useState({ event: 'PreToolUse', matcher: '', command: '', description: '' });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [h, p, l] = await Promise.all([
        ipcBridge.claudeHooks.getHooks(),
        ipcBridge.claudeHooks.getPresets(),
        ipcBridge.claudeHooks.getLogs(),
      ]);
      setHooks(h);
      setPresets(p);
      setLogs(l);
    } catch (err) {
      console.error('Failed to load hooks data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = ipcBridge.claudeHooks.onLog((data: unknown) => {
      setLogs(prev => [...prev, data as HookLog]);
    });
    return () => { if (unsub) unsub(); };
  }, [loadData]);

  const handleToggle = async (hook: HookDefinition) => {
    const updated = await ipcBridge.claudeHooks.updateHook(hook.id, { enabled: !hook.enabled });
    if (updated) {
      setHooks(prev => prev.map(h => h.id === hook.id ? { ...h, enabled: !h.enabled } : h));
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await ipcBridge.claudeHooks.deleteHook(id);
    if (ok) {
      setHooks(prev => prev.filter(h => h.id !== id));
    }
  };

  const handleAdd = async () => {
    if (!newHook.command.trim()) return;
    const hook = await ipcBridge.claudeHooks.addHook({
      event: newHook.event,
      matcher: newHook.matcher || undefined,
      command: newHook.command,
      enabled: true,
      description: newHook.description || undefined,
    }) as HookDefinition;
    setHooks(prev => [...prev, hook]);
    setNewHook({ event: 'PreToolUse', matcher: '', command: '', description: '' });
    setIsAdding(false);
  };

  const handleAddPreset = async (index: number) => {
    const hook = await ipcBridge.claudeHooks.addPreset(index) as HookDefinition;
    if (hook) {
      setHooks(prev => [...prev, hook]);
      setActiveTab('hooks');
    }
  };

  const handleReload = async () => {
    setLoading(true);
    const reloaded = await ipcBridge.claudeHooks.reload() as HookDefinition[];
    setHooks(reloaded);
    setLoading(false);
  };

  const handleClearLogs = async () => {
    await ipcBridge.claudeHooks.clearLogs();
    setLogs([]);
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
    <div className="h-full flex flex-col bg-gray-900 text-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-white">Claude Code Hooks</h2>
          <p className="text-sm text-gray-400 mt-1">
            .claude/settings.json のフック設定を管理
          </p>
        </div>
        <button
          onClick={handleReload}
          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          ディスクから再読込
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 px-6">
        {([
          { key: 'hooks' as TabType, label: 'フック一覧', count: hooks.length },
          { key: 'presets' as TabType, label: 'プリセット', count: presets.length },
          { key: 'logs' as TabType, label: 'ログ', count: logs.length },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs bg-gray-700 px-1.5 py-0.5 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'hooks' && (
          <div className="space-y-3">
            {/* Add button */}
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full py-2 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-purple-400 hover:border-purple-500 transition-colors text-sm"
              >
                + 新しいフックを追加
              </button>
            )}

            {/* Add form */}
            {isAdding && (
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">イベント</label>
                    <select
                      value={newHook.event}
                      onChange={e => setNewHook(p => ({ ...p, event: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
                    >
                      {HOOK_EVENTS.map(ev => (
                        <option key={ev} value={ev}>{ev}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">マッチャー (任意)</label>
                    <input
                      type="text"
                      value={newHook.matcher}
                      onChange={e => setNewHook(p => ({ ...p, matcher: e.target.value }))}
                      placeholder="e.g. Write, Bash"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">コマンド</label>
                  <input
                    type="text"
                    value={newHook.command}
                    onChange={e => setNewHook(p => ({ ...p, command: e.target.value }))}
                    placeholder="e.g. echo 'Hook fired!'"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white font-mono placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">説明 (任意)</label>
                  <input
                    type="text"
                    value={newHook.description}
                    onChange={e => setNewHook(p => ({ ...p, description: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!newHook.command.trim()}
                    className="px-4 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded transition-colors"
                  >
                    追加
                  </button>
                </div>
              </div>
            )}

            {/* Hook list */}
            {hooks.length === 0 && !isAdding && (
              <div className="text-center text-gray-500 py-12">
                フックが設定されていません。<br />
                プリセットタブから追加するか、新規作成してください。
              </div>
            )}

            {hooks.map(hook => (
              <div
                key={hook.id}
                className={`bg-gray-800 border rounded-lg p-4 transition-colors ${
                  hook.enabled ? 'border-gray-600' : 'border-gray-700 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded border ${EVENT_COLORS[hook.event] || 'bg-gray-600 text-gray-300'}`}>
                        {hook.event}
                      </span>
                      {hook.matcher && (
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                          {hook.matcher}
                        </span>
                      )}
                    </div>
                    <code className="text-sm text-gray-200 font-mono block mt-1 truncate">
                      {hook.command}
                    </code>
                    {hook.description && (
                      <p className="text-xs text-gray-500 mt-1">{hook.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(hook)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        hook.enabled ? 'bg-purple-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          hook.enabled ? 'left-5' : 'left-0.5'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(hook.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'presets' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-4">
              よく使われるフック設定をワンクリックで追加できます。
            </p>
            {presets.map((preset, index) => (
              <div key={index} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded border ${EVENT_COLORS[preset.event] || 'bg-gray-600 text-gray-300'}`}>
                        {preset.event}
                      </span>
                      {preset.matcher && (
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                          {preset.matcher}
                        </span>
                      )}
                    </div>
                    <code className="text-sm text-gray-200 font-mono block mt-1 truncate">
                      {preset.command}
                    </code>
                    {preset.description && (
                      <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddPreset(index)}
                    className="ml-3 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 rounded transition-colors flex-shrink-0"
                  >
                    追加
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-400">
                フック実行ログ（最大200件）
              </p>
              {logs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  ログをクリア
                </button>
              )}
            </div>

            {logs.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                実行ログはありません
              </div>
            )}

            {[...logs].reverse().map(log => (
              <div key={log.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded border ${EVENT_COLORS[log.event] || 'bg-gray-600 text-gray-300'}`}>
                    {log.event}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString('ja-JP')}
                  </span>
                  {log.exitCode !== undefined && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      log.exitCode === 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      exit: {log.exitCode}
                    </span>
                  )}
                </div>
                <code className="text-xs text-gray-300 font-mono block truncate">
                  {log.command}
                </code>
                {log.output && (
                  <pre className="text-xs text-gray-500 font-mono mt-1 max-h-20 overflow-y-auto whitespace-pre-wrap">
                    {log.output}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
