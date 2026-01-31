import React, { useState, useEffect } from 'react';
import { ipcBridge } from '../../bridge/ipcBridge';

interface NotificationSettings {
  enabled: boolean;
  onTaskComplete: boolean;
  onExecutionComplete: boolean;
  onExecutionFailed: boolean;
  onAgentStopped: boolean;
}

const settingItems: { key: keyof Omit<NotificationSettings, 'enabled'>; label: string; description: string }[] = [
  { key: 'onTaskComplete', label: 'タスク完了', description: 'タスクのステータスが完了になった時' },
  { key: 'onExecutionComplete', label: '実行完了', description: 'タスク実行が正常に完了した時' },
  { key: 'onExecutionFailed', label: '実行失敗', description: 'タスク実行が失敗した時' },
  { key: 'onAgentStopped', label: 'エージェント停止', description: 'エージェントが停止した時' },
];

export const NotificationSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    ipcBridge.desktopNotification.getSettings().then(setSettings);
  }, []);

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const updated = await ipcBridge.desktopNotification.updateSettings({ [key]: value });
    setSettings(updated);
  };

  const handleTest = async () => {
    await ipcBridge.desktopNotification.test();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  if (!settings) return null;

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Notification Settings</h2>
          <p className="text-sm text-gray-500">デスクトップ通知の設定</p>
        </div>

        {/* Master toggle */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-300">デスクトップ通知</h3>
              <p className="text-xs text-gray-500">OS標準の通知を使用してイベントを通知</p>
            </div>
            <button
              onClick={() => updateSetting('enabled', !settings.enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.enabled ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.enabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Individual settings */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">通知カテゴリ</h3>
          {settingItems.map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
              <div>
                <span className="text-sm text-gray-300">{item.label}</span>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
              <button
                onClick={() => updateSetting(item.key, !settings[item.key])}
                disabled={!settings.enabled}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  !settings.enabled ? 'bg-gray-700 opacity-50' :
                  settings[item.key] ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings[item.key] ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Test button */}
        <button
          onClick={handleTest}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {testSent ? 'テスト通知を送信しました' : 'テスト通知を送信'}
        </button>
      </div>
    </div>
  );
};
