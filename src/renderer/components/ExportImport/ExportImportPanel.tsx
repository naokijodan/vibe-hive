import React, { useState } from 'react';
import { ipcBridge } from '../../bridge/ipcBridge';

type ExportTarget = 'tasks' | 'taskTemplates' | 'workflows' | 'workflowTemplates';

interface ResultMessage {
  type: 'success' | 'error' | 'warning';
  text: string;
}

export const ExportImportPanel: React.FC = () => {
  const [exportTargets, setExportTargets] = useState<Record<ExportTarget, boolean>>({
    tasks: true,
    taskTemplates: true,
    workflows: true,
    workflowTemplates: true,
  });
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ResultMessage[]>([]);

  const toggleTarget = (target: ExportTarget) => {
    setExportTargets(prev => ({ ...prev, [target]: !prev[target] }));
  };

  const handleExport = async () => {
    const targets = (Object.entries(exportTargets) as [ExportTarget, boolean][])
      .filter(([, v]) => v)
      .map(([k]) => k);

    if (targets.length === 0) {
      setMessages([{ type: 'error', text: 'エクスポート対象を1つ以上選択してください' }]);
      return;
    }

    setLoading(true);
    setMessages([]);

    try {
      const result = await ipcBridge.exportImport.export(targets);
      if (result.canceled) {
        setMessages([{ type: 'warning', text: 'キャンセルされました' }]);
      } else if (result.success) {
        const statParts: string[] = [];
        if (result.stats?.tasks) statParts.push(`タスク: ${result.stats.tasks}`);
        if (result.stats?.taskTemplates) statParts.push(`テンプレート: ${result.stats.taskTemplates}`);
        if (result.stats?.workflows) statParts.push(`ワークフロー: ${result.stats.workflows}`);
        if (result.stats?.workflowTemplates) statParts.push(`WFテンプレート: ${result.stats.workflowTemplates}`);
        setMessages([{ type: 'success', text: `エクスポート完了 (${statParts.join(', ')})` }]);
      }
    } catch (e) {
      setMessages([{ type: 'error', text: `エクスポート失敗: ${(e as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setMessages([]);

    try {
      const result = await ipcBridge.exportImport.import(importMode);
      if (result.canceled) {
        setMessages([{ type: 'warning', text: 'キャンセルされました' }]);
      } else {
        const msgs: ResultMessage[] = [];
        if (result.stats) {
          const statParts: string[] = [];
          if (result.stats.tasks) statParts.push(`タスク: ${result.stats.tasks}`);
          if (result.stats.taskTemplates) statParts.push(`テンプレート: ${result.stats.taskTemplates}`);
          if (result.stats.workflows) statParts.push(`ワークフロー: ${result.stats.workflows}`);
          if (result.stats.workflowTemplates) statParts.push(`WFテンプレート: ${result.stats.workflowTemplates}`);
          if (statParts.length > 0) {
            msgs.push({ type: 'success', text: `インポート完了 (${statParts.join(', ')})` });
          }
        }
        if (result.warnings) {
          result.warnings.forEach(w => msgs.push({ type: 'warning', text: w }));
        }
        if (result.errors) {
          result.errors.forEach(e => msgs.push({ type: 'error', text: e }));
        }
        if (msgs.length === 0) {
          msgs.push({ type: 'success', text: 'インポート完了' });
        }
        setMessages(msgs);
      }
    } catch (e) {
      setMessages([{ type: 'error', text: `インポート失敗: ${(e as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const targetOptions: { key: ExportTarget; label: string }[] = [
    { key: 'tasks', label: 'タスク' },
    { key: 'taskTemplates', label: 'タスクテンプレート' },
    { key: 'workflows', label: 'ワークフロー' },
    { key: 'workflowTemplates', label: 'ワークフローテンプレート' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Export / Import</h2>
          <p className="text-sm text-gray-500">データのバックアップと復元</p>
        </div>

        {/* Export Section */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">エクスポート</h3>
          <div className="grid grid-cols-2 gap-2">
            {targetOptions.map(opt => (
              <label key={opt.key} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportTargets[opt.key]}
                  onChange={() => toggleTarget(opt.key)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? '処理中...' : 'JSONファイルにエクスポート'}
          </button>
        </div>

        {/* Import Section */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">インポート</h3>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                className="w-4 h-4 border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm text-gray-300">マージ</span>
                <p className="text-xs text-gray-500">既存データを保持し、新規のみ追加</p>
              </div>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'overwrite'}
                onChange={() => setImportMode('overwrite')}
                className="w-4 h-4 border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
              />
              <div>
                <span className="text-sm text-gray-300">上書き</span>
                <p className="text-xs text-gray-500">既存データを削除して置き換え</p>
              </div>
            </label>
          </div>
          <button
            onClick={handleImport}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? '処理中...' : 'JSONファイルからインポート'}
          </button>
        </div>

        {/* Messages */}
        {messages.length > 0 && (
          <div className="space-y-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded text-sm ${
                  msg.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-700' :
                  msg.type === 'error' ? 'bg-red-900/50 text-red-300 border border-red-700' :
                  'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
