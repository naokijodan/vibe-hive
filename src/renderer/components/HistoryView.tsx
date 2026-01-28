import React, { useState, useEffect } from 'react';
import ipcBridge from '../bridge/ipcBridge';
import type { Task } from '../../shared/types/task';
import type { Agent } from '../../shared/types/agent';

type HistoryTab = 'tasks' | 'agents' | 'sessions';

interface SessionData {
  id: string;
  name: string;
  workingDirectory: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  taskCount?: number;
}

export const HistoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HistoryTab>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'tasks') {
        const allTasks = await ipcBridge.task.getAll();
        // 完了日時順でソート
        const sortedTasks = allTasks.sort((a, b) => {
          const dateA = a.completedAt || a.updatedAt;
          const dateB = b.completedAt || b.updatedAt;
          return dateB.getTime() - dateA.getTime();
        });
        setTasks(sortedTasks);
      } else if (activeTab === 'agents') {
        const allAgents = await window.electronAPI.dbAgentGetAll() as Agent[];
        // 作成日時順でソート
        const sortedAgents = allAgents.sort((a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime()
        );
        setAgents(sortedAgents);
      } else if (activeTab === 'sessions') {
        const allSessions = await window.electronAPI.dbSessionGetAll() as SessionData[];
        // タスク数を取得
        const sessionsWithTaskCount = await Promise.all(
          allSessions.map(async (session) => {
            const sessionTasks = await ipcBridge.task.getBySession(session.id);
            return { ...session, taskCount: sessionTasks.length };
          })
        );
        // 作成日時順でソート
        const sortedSessions = sessionsWithTaskCount.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSessions(sortedSessions);
      }
    } catch (error) {
      console.error('Failed to load history data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (task: Task): string => {
    if (!task.completedAt || !task.createdAt) return '-';
    const durationMs = task.completedAt.getTime() - task.createdAt.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}時間${minutes % 60}分`;
    }
    return `${minutes}分`;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      backlog: 'text-gray-400',
      todo: 'text-blue-400',
      in_progress: 'text-yellow-400',
      review: 'text-purple-400',
      done: 'text-green-400',
      idle: 'text-gray-400',
      thinking: 'text-blue-400',
      executing: 'text-yellow-400',
      waiting_input: 'text-purple-400',
      error: 'text-red-400',
      failed: 'text-red-400',
    };
    return colors[status] || 'text-gray-400';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      backlog: 'バックログ',
      todo: '未着手',
      in_progress: '実行中',
      review: 'レビュー',
      done: '完了',
      idle: 'アイドル',
      thinking: '思考中',
      executing: '実行中',
      waiting_input: '入力待ち',
      error: 'エラー',
      failed: '失敗',
    };
    return labels[status] || status;
  };

  const renderTaskHistory = () => (
    <div className="space-y-3">
      {tasks.length === 0 ? (
        <div className="text-center text-hive-muted py-12">
          <p>タスク履歴がありません</p>
        </div>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className="p-4 bg-hive-surface border border-hive-border rounded-lg hover:border-hive-accent transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-medium ${getStatusColor(task.status)}`}>
                    [{getStatusLabel(task.status)}]
                  </span>
                  <span className="text-white font-medium">{task.title}</span>
                </div>
                {task.description && (
                  <p className="text-sm text-hive-muted mb-2">{task.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-hive-muted">
                  <span>作成: {formatDate(task.createdAt)}</span>
                  {task.completedAt && (
                    <>
                      <span>完了: {formatDate(task.completedAt)}</span>
                      <span>所要時間: {calculateDuration(task)}</span>
                    </>
                  )}
                  <span>優先度: {task.priority}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderAgentHistory = () => (
    <div className="space-y-3">
      {agents.length === 0 ? (
        <div className="text-center text-hive-muted py-12">
          <p>エージェント履歴がありません</p>
        </div>
      ) : (
        agents.map((agent) => (
          <div
            key={agent.id}
            className="p-4 bg-hive-surface border border-hive-border rounded-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-medium ${getStatusColor(agent.status)}`}>
                    [{getStatusLabel(agent.status)}]
                  </span>
                  <span className="text-white font-medium">{agent.name}</span>
                  <span className="text-xs text-hive-muted">({agent.role})</span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-hive-muted">
                  <span>作成: {formatDate(agent.createdAt)}</span>
                  {agent.capabilities && agent.capabilities.length > 0 && (
                    <span>機能: {agent.capabilities.join(', ')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderSessionHistory = () => (
    <div className="space-y-3">
      {sessions.length === 0 ? (
        <div className="text-center text-hive-muted py-12">
          <p>セッション履歴がありません</p>
        </div>
      ) : (
        sessions.map((session) => (
          <div
            key={session.id}
            className="p-4 bg-hive-surface border border-hive-border rounded-lg hover:border-hive-accent transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-medium">{session.name}</span>
                  <span className="text-xs px-2 py-1 bg-hive-bg rounded text-hive-muted">
                    {session.status}
                  </span>
                </div>
                <div className="text-sm text-hive-muted mb-2">
                  {session.workingDirectory}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-hive-muted">
                  <span>作成: {formatDate(session.createdAt)}</span>
                  <span>更新: {formatDate(session.updatedAt)}</span>
                  {session.taskCount !== undefined && (
                    <span>タスク数: {session.taskCount}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col p-6">
      <h2 className="text-2xl font-bold mb-6">履歴</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-hive-border">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'tasks'
              ? 'text-hive-accent border-b-2 border-hive-accent'
              : 'text-hive-muted hover:text-white'
          }`}
        >
          タスク履歴
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'agents'
              ? 'text-hive-accent border-b-2 border-hive-accent'
              : 'text-hive-muted hover:text-white'
          }`}
        >
          エージェント履歴
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'sessions'
              ? 'text-hive-accent border-b-2 border-hive-accent'
              : 'text-hive-muted hover:text-white'
          }`}
        >
          セッション履歴
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-hive-muted">読み込み中...</p>
          </div>
        ) : (
          <>
            {activeTab === 'tasks' && renderTaskHistory()}
            {activeTab === 'agents' && renderAgentHistory()}
            {activeTab === 'sessions' && renderSessionHistory()}
          </>
        )}
      </div>
    </div>
  );
};
