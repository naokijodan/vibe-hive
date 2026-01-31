import React, { useState, useEffect, useCallback } from 'react';
import { ipcBridge } from '../../bridge/ipcBridge';
import { useAgentStore } from '../../stores/agentStore';
import { useTaskStore } from '../../stores/taskStore';

interface CoordinationMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string | null;
  type: 'message' | 'task_delegate' | 'status_update' | 'request' | 'response';
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface TaskDelegation {
  id: string;
  taskId: string;
  fromAgentId: string;
  toAgentId: string;
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

const typeColors: Record<string, string> = {
  message: 'text-blue-400',
  task_delegate: 'text-yellow-400',
  status_update: 'text-green-400',
  request: 'text-purple-400',
  response: 'text-cyan-400',
};

const typeLabels: Record<string, string> = {
  message: 'MSG',
  task_delegate: 'DELEGATE',
  status_update: 'STATUS',
  request: 'REQ',
  response: 'RES',
};

export const CoordinationPanel: React.FC = () => {
  const [messages, setMessages] = useState<CoordinationMessage[]>([]);
  const [delegations, setDelegations] = useState<TaskDelegation[]>([]);
  const [tab, setTab] = useState<'messages' | 'delegations' | 'send'>('messages');

  // Send form state
  const [fromAgent, setFromAgent] = useState('');
  const [toAgent, setToAgent] = useState('');
  const [msgType, setMsgType] = useState<string>('message');
  const [content, setContent] = useState('');

  // Delegate form state
  const [delegateTaskId, setDelegateTaskId] = useState('');
  const [delegateFrom, setDelegateFrom] = useState('');
  const [delegateTo, setDelegateTo] = useState('');
  const [delegateReason, setDelegateReason] = useState('');

  const { agents, loadAgents } = useAgentStore();
  const { tasks, loadTasks } = useTaskStore();

  const loadData = useCallback(async () => {
    const [msgs, dels] = await Promise.all([
      ipcBridge.coordination.getMessages(100),
      ipcBridge.coordination.getDelegations(),
    ]);
    setMessages(msgs as CoordinationMessage[]);
    setDelegations(dels as TaskDelegation[]);
  }, []);

  useEffect(() => {
    loadAgents();
    loadTasks();
    loadData();

    const unsub1 = ipcBridge.coordination.onMessage((msg) => {
      setMessages(prev => [...prev.slice(-99), msg as CoordinationMessage]);
    });
    const unsub2 = ipcBridge.coordination.onDelegation((del) => {
      setDelegations(prev => {
        const d = del as TaskDelegation;
        const existing = prev.findIndex(p => p.id === d.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = d;
          return updated;
        }
        return [...prev, d];
      });
    });

    return () => {
      unsub1?.();
      unsub2?.();
    };
  }, [loadAgents, loadTasks, loadData]);

  const getAgentName = (id: string) => {
    const agent = agents.find(a => a.id === id);
    return agent?.name || id.slice(0, 8);
  };

  const handleSendMessage = async () => {
    if (!fromAgent || !content) return;
    await ipcBridge.coordination.sendMessage(
      fromAgent,
      toAgent || null,
      msgType,
      content
    );
    setContent('');
  };

  const handleDelegateTask = async () => {
    if (!delegateTaskId || !delegateFrom || !delegateTo) return;
    await ipcBridge.coordination.delegateTask(
      delegateTaskId,
      delegateFrom,
      delegateTo,
      delegateReason || undefined
    );
    setDelegateTaskId('');
    setDelegateReason('');
  };

  const handleRespondDelegation = async (delegationId: string, accepted: boolean) => {
    await ipcBridge.coordination.respondDelegation(delegationId, accepted);
  };

  const handleClear = async () => {
    await ipcBridge.coordination.clearMessages();
    setMessages([]);
    setDelegations([]);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Agent Coordination</h2>
            <p className="text-sm text-gray-500">エージェント間通信・タスク委譲</p>
          </div>
          <button
            onClick={handleClear}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
          >
            ログクリア
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
          {([['messages', 'メッセージログ'], ['delegations', 'タスク委譲'], ['send', '送信']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                tab === key ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Messages Tab */}
        {tab === 'messages' && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-2 max-h-[500px] overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">メッセージなし</p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="flex items-start space-x-2 py-1 border-b border-gray-700/30 last:border-0">
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${typeColors[msg.type]} bg-gray-700/50`}>
                    {typeLabels[msg.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <span className="font-medium text-gray-300">{getAgentName(msg.fromAgentId)}</span>
                      <span>→</span>
                      <span className="font-medium text-gray-300">
                        {msg.toAgentId ? getAgentName(msg.toAgentId) : 'ALL'}
                      </span>
                      <span className="ml-auto">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-gray-300 truncate">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Delegations Tab */}
        {tab === 'delegations' && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
            {delegations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">タスク委譲なし</p>
            ) : (
              delegations.map(del => (
                <div key={del.id} className="bg-gray-700/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-gray-300">{getAgentName(del.fromAgentId)}</span>
                      <span className="text-gray-500"> → </span>
                      <span className="text-gray-300">{getAgentName(del.toAgentId)}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      del.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                      del.status === 'accepted' ? 'bg-green-900/50 text-green-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>
                      {del.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Task: {del.taskId.slice(0, 8)}...</p>
                  {del.reason && <p className="text-xs text-gray-400">{del.reason}</p>}
                  {del.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRespondDelegation(del.id, true)}
                        className="px-2 py-1 text-xs bg-green-700 hover:bg-green-600 text-white rounded"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondDelegation(del.id, false)}
                        className="px-2 py-1 text-xs bg-red-700 hover:bg-red-600 text-white rounded"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Send Tab */}
        {tab === 'send' && (
          <div className="space-y-4">
            {/* Send Message */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">メッセージ送信</h3>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={fromAgent}
                  onChange={e => setFromAgent(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-300"
                >
                  <option value="">送信元エージェント</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select
                  value={toAgent}
                  onChange={e => setToAgent(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-300"
                >
                  <option value="">宛先 (空=ブロードキャスト)</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <select
                value={msgType}
                onChange={e => setMsgType(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-300"
              >
                <option value="message">メッセージ</option>
                <option value="status_update">ステータス更新</option>
                <option value="request">リクエスト</option>
                <option value="response">レスポンス</option>
              </select>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="メッセージ内容..."
                rows={2}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-300 resize-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={!fromAgent || !content}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                送信
              </button>
            </div>

            {/* Delegate Task */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">タスク委譲</h3>
              <select
                value={delegateTaskId}
                onChange={e => setDelegateTaskId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-300"
              >
                <option value="">タスクを選択</option>
                {tasks.filter(t => t.status !== 'done').map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={delegateFrom}
                  onChange={e => setDelegateFrom(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-300"
                >
                  <option value="">委譲元</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select
                  value={delegateTo}
                  onChange={e => setDelegateTo(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-300"
                >
                  <option value="">委譲先</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <input
                type="text"
                value={delegateReason}
                onChange={e => setDelegateReason(e.target.value)}
                placeholder="理由（任意）"
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-300"
              />
              <button
                onClick={handleDelegateTask}
                disabled={!delegateTaskId || !delegateFrom || !delegateTo}
                className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                タスクを委譲
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
