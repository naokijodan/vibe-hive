import React, { useState, useRef, useEffect, memo } from 'react';
import { useAIAssistantStore, AIChatMessage } from '../../stores/aiAssistantStore';
import { useSettingsStore } from '../../stores/settingsStore';

const MessageBubble: React.FC<{ message: AIChatMessage }> = memo(({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-hive-accent/20 text-white'
            : 'bg-hive-surface border border-hive-border text-white'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        {message.toolResults && message.toolResults.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolResults.map((tr, i) => (
              <div key={i} className="text-[10px] px-2 py-1 bg-blue-900/30 text-blue-300 rounded">
                {tr.toolName} 実行済み
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

const ApiKeyPrompt: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const { checkApiKey } = useAIAssistantStore();
  const settingsStore = useSettingsStore();

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    await settingsStore.updateAgentSettings({ claudeApiKey: apiKey.trim() });
    await checkApiKey();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center space-y-3 max-w-xs">
        <p className="text-hive-muted text-sm">
          AIアシスタントを使用するには Claude APIキーが必要です
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full bg-hive-bg border border-hive-border rounded p-2 text-white text-sm focus:outline-none focus:border-hive-accent"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={handleSave}
          className="w-full px-3 py-2 text-sm bg-hive-accent text-black font-medium rounded hover:bg-hive-accent/80 transition-colors"
        >
          保存
        </button>
      </div>
    </div>
  );
};

export const AIChatPanel: React.FC = () => {
  const { messages, isLoading, isOpen, hasApiKey, error, closePanel, sendMessage, clearHistory, checkApiKey } = useAIAssistantStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && hasApiKey === null) {
      checkApiKey();
    }
  }, [isOpen, hasApiKey, checkApiKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-hive-bg border-l border-hive-border flex flex-col z-40 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hive-border bg-hive-surface">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="text-white font-medium text-sm">AI アシスタント</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => clearHistory()}
            className="text-xs px-2 py-1 text-hive-muted hover:text-white transition-colors"
            title="履歴をクリア"
          >
            🗑
          </button>
          <button
            onClick={closePanel}
            className="text-hive-muted hover:text-white transition-colors p-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      {hasApiKey === false ? (
        <ApiKeyPrompt />
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="text-center text-hive-muted text-sm mt-8 space-y-2">
                <p>Vibe Hive AIアシスタントへようこそ</p>
                <p className="text-xs">タスク管理、エージェント操作、プロジェクト情報の取得など、何でも聞いてください</p>
                <div className="space-y-1 mt-4">
                  {['タスクを一覧表示して', 'ログイン画面のタスクを作成して', 'プロジェクトの状態を教えて'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                      className="block w-full text-left text-xs px-3 py-2 bg-hive-surface border border-hive-border rounded hover:border-hive-accent/50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-hive-surface border border-hive-border rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-sm text-hive-muted">
                    <div className="w-4 h-4 border-2 border-hive-accent border-t-transparent rounded-full animate-spin" />
                    考え中...
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="text-red-400 text-xs bg-red-900/20 rounded p-2 mb-3">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-hive-border bg-hive-surface">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力... (Shift+Enterで改行)"
                rows={1}
                className="flex-1 bg-hive-bg border border-hive-border rounded p-2 text-white text-sm resize-none focus:outline-none focus:border-hive-accent"
                style={{ minHeight: '36px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-3 py-2 bg-hive-accent text-black font-medium rounded text-sm hover:bg-hive-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                送信
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
