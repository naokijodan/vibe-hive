import React, { useState, useEffect, useRef } from 'react';
import { useCollaborationStore } from '../../stores/collaborationStore';
import { useSessionStore } from '../../stores/sessionStore';
import { ipcBridge } from '../../bridge/ipcBridge';
import type { CollabChatMessage, CollabUser } from '../../../shared/types/collaboration';

type Tab = 'connection' | 'chat' | 'users';

export function CollaborationPanel(): React.ReactElement {
  const {
    status, users, chatMessages, settings, isLoading, error,
    setSettings, startHost, join, disconnect, sendChat,
    refreshStatus, refreshUsers, loadChatHistory,
    addChatMessage, addUser, removeUser, updateStatus,
  } = useCollaborationStore();

  const { activeSessionId } = useSessionStore();
  const [activeTab, setActiveTab] = useState<Tab>('connection');
  const [joinHost, setJoinHost] = useState('localhost');
  const [joinPort, setJoinPort] = useState('3101');
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Listen for collab events from main process
  useEffect(() => {
    const unsubs = [
      ipcBridge.collab.onStatus((s) => updateStatus(s)),
      ipcBridge.collab.onChat((msg) => addChatMessage(msg)),
      ipcBridge.collab.onUserJoined((u) => { addUser(u); refreshStatus(); }),
      ipcBridge.collab.onUserLeft((u) => { removeUser(u); refreshStatus(); }),
      ipcBridge.collab.onDisconnected(() => {
        updateStatus({ connected: false, role: 'disconnected', userCount: 0 });
      }),
    ];
    return () => unsubs.forEach(fn => fn());
  }, [updateStatus, addChatMessage, addUser, removeUser, refreshStatus]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleStartHost = async () => {
    if (!activeSessionId) return;
    await startHost(activeSessionId);
    setActiveTab('chat');
  };

  const handleJoin = async () => {
    const result = await join(joinHost, parseInt(joinPort, 10));
    if (result.success) {
      await loadChatHistory();
      await refreshUsers();
      setActiveTab('chat');
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setActiveTab('connection');
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    await sendChat(chatInput.trim());
    setChatInput('');
  };

  const tabClass = (t: Tab) =>
    `flex-1 px-3 py-2 text-sm font-medium transition-colors ${
      activeTab === t
        ? 'text-hive-accent border-b-2 border-hive-accent'
        : 'text-hive-muted hover:text-white'
    }`;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-hive-border">
        <h2 className="text-xl font-bold">コラボレーション</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className={`w-2 h-2 rounded-full ${status.connected ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span className="text-sm text-hive-muted">
            {status.role === 'host' ? `ホスト (ポート ${status.serverPort})` :
             status.role === 'guest' ? 'ゲスト接続中' : '未接続'}
            {status.connected && ` — ${status.userCount}人`}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-hive-border">
        <button onClick={() => setActiveTab('connection')} className={tabClass('connection')}>接続</button>
        <button onClick={() => setActiveTab('chat')} className={tabClass('chat')}>チャット</button>
        <button onClick={() => setActiveTab('users')} className={tabClass('users')}>ユーザー ({users.length})</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'connection' && (
          <div className="space-y-6">
            {/* Settings */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-hive-muted uppercase">設定</h3>
              <div>
                <label className="block text-sm mb-1">ニックネーム</label>
                <input
                  type="text"
                  value={settings.nickname}
                  onChange={(e) => setSettings({ nickname: e.target.value })}
                  className="w-full px-3 py-2 bg-hive-bg border border-hive-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-hive-accent"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">カラー</label>
                <div className="flex gap-2">
                  {['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#f97316'].map(c => (
                    <button
                      key={c}
                      onClick={() => setSettings({ color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        settings.color === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {!status.connected ? (
              <>
                {/* Host */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-hive-muted uppercase">ホストする</h3>
                  <button
                    onClick={handleStartHost}
                    disabled={isLoading || !activeSessionId}
                    className="w-full py-2 bg-hive-accent text-black font-medium rounded hover:bg-hive-accent/80 disabled:opacity-50 text-sm"
                  >
                    {isLoading ? '接続中...' : 'セッションをホスト'}
                  </button>
                </div>

                {/* Join */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-hive-muted uppercase">参加する</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={joinHost}
                      onChange={(e) => setJoinHost(e.target.value)}
                      placeholder="ホスト"
                      className="flex-1 px-3 py-2 bg-hive-bg border border-hive-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-hive-accent"
                    />
                    <input
                      type="text"
                      value={joinPort}
                      onChange={(e) => setJoinPort(e.target.value)}
                      placeholder="ポート"
                      className="w-20 px-3 py-2 bg-hive-bg border border-hive-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-hive-accent"
                    />
                  </div>
                  <button
                    onClick={handleJoin}
                    disabled={isLoading}
                    className="w-full py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {isLoading ? '接続中...' : '参加'}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-hive-muted uppercase">接続中</h3>
                <button
                  onClick={handleDisconnect}
                  className="w-full py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 text-sm"
                >
                  切断
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded text-sm text-red-300">{error}</div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full flex flex-col -m-4">
            <div className="flex-1 overflow-auto p-4 space-y-2">
              {chatMessages.length === 0 && (
                <p className="text-center text-hive-muted text-sm py-8">メッセージはありません</p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <span className="font-medium shrink-0" style={{ color: msg.color || '#999' }}>
                    {msg.nickname}:
                  </span>
                  <span className="text-hive-text break-all">{msg.message}</span>
                  <span className="text-hive-muted text-xs shrink-0 ml-auto">
                    {new Date(msg.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-hive-border flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder={status.connected ? 'メッセージを入力...' : '接続してください'}
                disabled={!status.connected}
                className="flex-1 px-3 py-2 bg-hive-bg border border-hive-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-hive-accent disabled:opacity-50"
              />
              <button
                onClick={handleSendChat}
                disabled={!status.connected || !chatInput.trim()}
                className="px-4 py-2 bg-hive-accent text-black font-medium rounded text-sm hover:bg-hive-accent/80 disabled:opacity-50"
              >
                送信
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-2">
            {users.length === 0 && (
              <p className="text-center text-hive-muted text-sm py-8">接続中のユーザーはいません</p>
            )}
            {users.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 bg-hive-surface rounded border border-hive-border">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-black" style={{ backgroundColor: user.color }}>
                  {user.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">{user.nickname}</div>
                  <div className="text-xs text-hive-muted">
                    {new Date(user.joinedAt).toLocaleTimeString('ja-JP')} に参加
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
