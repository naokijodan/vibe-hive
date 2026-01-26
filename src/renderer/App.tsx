import React, { useState, useEffect, useCallback } from 'react';
import { KanbanBoard } from './components/Kanban';
import { TerminalPanel, TerminalTabs, AgentOutputPanel } from './components/Terminal';
import { OrgChart } from './components/Organization';
import { Task, TaskStatus, Agent } from '../shared/types';
import { useTaskStore } from './stores/taskStore';
import { useAgentStore } from './stores/agentStore';

type ViewType = 'kanban' | 'organization' | 'history' | 'settings';

// ターミナルタブ用の型
interface AgentTab {
  id: string;
  name: string;
  isActive: boolean;
  status: 'running' | 'waiting' | 'idle' | 'error';
}

// AgentStatusをタブステータスに変換
const mapAgentStatusToTabStatus = (agentStatus: Agent['status']): AgentTab['status'] => {
  switch (agentStatus) {
    case 'executing':
      return 'running';
    case 'thinking':
    case 'waiting_input':
      return 'waiting';
    case 'error':
      return 'error';
    case 'idle':
    default:
      return 'idle';
  }
};

function App(): React.ReactElement {
  const { tasks, loadTasks, updateTaskStatus } = useTaskStore();
  const { agents, loadAgents } = useAgentStore();
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeRunningTaskId, setActiveRunningTaskId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionCwd, setNewSessionCwd] = useState('');

  // Get tasks that are currently running (in_progress)
  const runningTasks = tasks.filter(t => t.status === 'in_progress');

  // Auto-select first running task if none selected
  useEffect(() => {
    if (runningTasks.length > 0 && (!activeRunningTaskId || !runningTasks.find(t => t.id === activeRunningTaskId))) {
      setActiveRunningTaskId(runningTasks[0].id);
    } else if (runningTasks.length === 0) {
      setActiveRunningTaskId(null);
    }
  }, [runningTasks, activeRunningTaskId]);

  // Handle agent exit - move task to review
  const handleAgentExit = useCallback(async (taskId: string, exitCode: number) => {
    console.log(`Agent for task ${taskId} exited with code ${exitCode}`);
    // Move task to review status regardless of exit code
    await updateTaskStatus(taskId, 'review');
  }, [updateTaskStatus]);

  // Load tasks and agents from DB on mount
  useEffect(() => {
    loadTasks();
    loadAgents();
  }, [loadTasks, loadAgents]);

  // エージェントからタブを生成
  const agentTabs: AgentTab[] = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    isActive: agent.id === activeTabId,
    status: mapAgentStatusToTabStatus(agent.status),
  }));

  // 初期アクティブタブの設定
  useEffect(() => {
    if (agents.length > 0 && !activeTabId) {
      setActiveTabId(agents[0].id);
    }
  }, [agents, activeTabId]);

  // エージェントが実行中になったら自動的にそのタブに切り替え
  useEffect(() => {
    const executingAgent = agents.find(a => a.status === 'executing');
    if (executingAgent) {
      setActiveTabId(executingAgent.id);
    }
  }, [agents]);

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task);
  };

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    await updateTaskStatus(taskId, newStatus);
  };

  const handleTabSelect = (tabId: string) => {
    setActiveTabId(tabId);
  };

  const activeAgent = agentTabs.find(t => t.id === activeTabId);

  const handleAgentClick = (agent: Agent) => {
    console.log('Agent clicked:', agent);
    setSelectedAgentId(agent.id);
    setCurrentView('kanban'); // Switch to kanban view to show tasks
  };

  // Handle new session creation
  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;

    try {
      await window.electronAPI.dbSessionCreate({
        name: newSessionName,
        workingDirectory: newSessionCwd || '.',
        status: 'idle',
      });

      // Reset form and close modal
      setNewSessionName('');
      setNewSessionCwd('');
      setIsSessionModalOpen(false);

      console.log('Session created:', newSessionName);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const renderNavButton = (view: ViewType, icon: string, label: string) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`w-full text-left px-3 py-2 rounded text-sm ${
        currentView === view
          ? 'bg-hive-accent/20 text-hive-accent'
          : 'hover:bg-hive-surface text-hive-muted'
      }`}
    >
      {icon} {label}
    </button>
  );

  const renderMainContent = () => {
    // Filter tasks if an agent is selected
    const filteredTasks = selectedAgentId
      ? tasks.filter(task => task.assignedAgentId === selectedAgentId)
      : tasks;

    const selectedAgent = selectedAgentId ? agents.find(a => a.id === selectedAgentId) : null;

    switch (currentView) {
      case 'kanban':
        return (
          <div className="h-full flex flex-col">
            {selectedAgent && (
              <div className="px-4 py-3 border-b border-hive-border bg-hive-surface">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-hive-muted">フィルター:</span>
                    <span className="text-sm font-medium text-hive-accent">
                      🤖 {selectedAgent.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedAgentId(null)}
                    className="text-xs text-hive-muted hover:text-white"
                  >
                    クリア
                  </button>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <KanbanBoard tasks={filteredTasks} onTaskClick={handleTaskClick} onTaskMove={handleTaskMove} />
            </div>
          </div>
        );
      case 'organization':
        return (
          <OrgChart
            organization={{
              id: 'default-org',
              name: 'Vibe Hive Organization',
              agents,
              connections: [],
              whiteboard: {
                id: 'default-whiteboard',
                organizationId: 'default-org',
                entries: [],
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            }}
            onAgentClick={handleAgentClick}
          />
        );
      case 'history':
        return (
          <div className="flex items-center justify-center h-full text-hive-muted">
            <p>履歴機能は開発中です...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="flex items-center justify-center h-full text-hive-muted">
            <p>設定機能は開発中です...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-hive-bg text-hive-text">
      {/* Sidebar */}
      <aside className="w-64 border-r border-hive-border bg-hive-surface flex flex-col">
        <div className="p-4 border-b border-hive-border drag-region" style={{ paddingTop: '28px' }}>
          <h1 className="text-xl font-bold text-hive-accent flex items-center gap-2 no-drag">
            <span>🐝</span> Vibe Hive
          </h1>
          <p className="text-sm text-hive-muted mt-1">AI Swarm Manager</p>
        </div>
        <nav className="flex-1 p-2">
          <div className="space-y-1">
            {renderNavButton('kanban', '📋', 'タスクボード')}
            {renderNavButton('organization', '🏢', '組織構造')}
            {renderNavButton('history', '📜', '履歴')}
            {renderNavButton('settings', '⚙️', '設定')}
          </div>
        </nav>
        <div className="p-4 border-t border-hive-border">
          <button
            onClick={() => setIsSessionModalOpen(true)}
            className="w-full bg-hive-accent text-black font-medium py-2 px-4 rounded hover:bg-hive-accent/80 text-sm"
          >
            + 新規セッション
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Draggable region for window movement */}
        <header className="h-12 border-b border-hive-border bg-hive-surface flex items-center justify-between px-4 drag-region">
          <div className="flex items-center gap-4 no-drag">
            <span className="font-medium">Session: Vibe Hive 開発</span>
            <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">Active</span>
          </div>
          <span className="text-hive-muted text-sm no-drag">⌘K でコマンドパレット</span>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            {renderMainContent()}
          </div>

          {/* Terminal Panel Area */}
          <div className="w-96 border-l border-hive-border bg-hive-surface flex flex-col">
            {/* Show running task agent output if any */}
            {runningTasks.length > 0 ? (
              <>
                {/* Running tasks tab header */}
                <div className="border-b border-hive-border bg-green-900/20">
                  <div className="px-3 py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-green-400">
                      並列実行中 ({runningTasks.length})
                    </span>
                  </div>
                  {/* Task tabs for switching between parallel running tasks */}
                  <div className="flex overflow-x-auto px-2 pb-1 gap-1">
                    {runningTasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => setActiveRunningTaskId(task.id)}
                        className={`px-3 py-1.5 text-xs rounded-t whitespace-nowrap transition-colors ${
                          activeRunningTaskId === task.id
                            ? 'bg-hive-surface text-white border-t border-x border-hive-border'
                            : 'bg-transparent text-hive-muted hover:text-white hover:bg-hive-surface/50'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block mr-1.5 animate-pulse" />
                        {task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Active task terminal */}
                <div className="flex-1 overflow-hidden">
                  {activeRunningTaskId && runningTasks.find(t => t.id === activeRunningTaskId) && (
                    <AgentOutputPanel
                      key={activeRunningTaskId}
                      taskId={activeRunningTaskId}
                      taskTitle={runningTasks.find(t => t.id === activeRunningTaskId)?.title || ''}
                      isActive={true}
                      onAgentExit={handleAgentExit}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center text-hive-muted">
                  <p className="text-lg mb-2">稼働中のタスクがありません</p>
                  <p className="text-sm mb-4">タスクカードの「▶ 実行」ボタンをクリックして開始</p>
                  <div className="text-xs text-left bg-hive-bg rounded p-3 space-y-2">
                    <p className="text-hive-accent font-medium">使い方:</p>
                    <p>1. タスクボードでタスクを作成</p>
                    <p>2. 🎭役割 ボタンでAIの役割を設定（任意）</p>
                    <p>3. ▶実行 ボタンでClaude Codeを起動</p>
                    <p>4. 複数タスクを同時に実行可能</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Session Modal */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-hive-surface border border-hive-border rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">新規セッション作成</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">セッション名 *</label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  className="w-full px-3 py-2 bg-hive-bg border border-hive-border rounded text-hive-text focus:outline-none focus:ring-2 focus:ring-hive-accent"
                  placeholder="例: 新規プロジェクト開発"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">作業ディレクトリ</label>
                <input
                  type="text"
                  value={newSessionCwd}
                  onChange={(e) => setNewSessionCwd(e.target.value)}
                  className="w-full px-3 py-2 bg-hive-bg border border-hive-border rounded text-hive-text focus:outline-none focus:ring-2 focus:ring-hive-accent"
                  placeholder="例: /Users/name/projects/my-app"
                />
                <p className="text-xs text-hive-muted mt-1">空の場合はカレントディレクトリが使用されます</p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateSession}
                disabled={!newSessionName.trim()}
                className="flex-1 px-4 py-2 bg-hive-accent text-black font-medium rounded hover:bg-hive-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                作成
              </button>
              <button
                onClick={() => {
                  setNewSessionName('');
                  setNewSessionCwd('');
                  setIsSessionModalOpen(false);
                }}
                className="flex-1 px-4 py-2 bg-hive-bg border border-hive-border text-hive-text rounded hover:bg-hive-surface"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
