import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { KanbanBoard } from './components/Kanban';
import { TerminalPanel, TerminalTabs, AgentOutputPanel } from './components/Terminal';
import { OrgChart } from './components/Organization';
import { SessionTabs } from './components/Session';
import { CommandPalette } from './components/CommandPalette';
import { GitPanel } from './components/Git/GitPanel';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { TaskDependencyTree } from './components/TaskDependencyTree';
import { HistoryView } from './components/HistoryView';
import { ExecutionPanel } from './components/Execution/ExecutionPanel';
import { ExecutionLog } from './components/Execution/ExecutionLog';
import { WorkflowManager } from './components/Workflow/WorkflowManager';
import { AnalyticsDashboard } from './components/Analytics';
import { ExportImportPanel } from './components/ExportImport';
import { NotificationSettingsPanel } from './components/NotificationSettings';
import { CoordinationPanel } from './components/Coordination';
import { Task, TaskStatus, Agent } from '../shared/types';
import { useTaskStore } from './stores/taskStore';
import { useAgentStore } from './stores/agentStore';
import { useSessionStore } from './stores/sessionStore';
import { useExecutionStore } from './stores/executionStore';
import { useCommandPalette } from './hooks/useCommandPalette';
import type { ExecutionRecord } from '../shared/types/execution';

type ViewType = 'kanban' | 'organization' | 'dependencies' | 'execution' | 'history' | 'workflow' | 'analytics' | 'export-import' | 'notifications' | 'coordination' | 'settings';

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
  const { sessions, activeSessionId, loadSessions, loadActiveSession, switchSession } = useSessionStore();
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeRunningTaskId, setActiveRunningTaskId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionCwd, setNewSessionCwd] = useState('');
  const [showBashTerminal, setShowBashTerminal] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isGitPanelOpen, setIsGitPanelOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [selectedTaskForDependencies, setSelectedTaskForDependencies] = useState<string | null>(null);

  // Memoized close handler for settings panel
  const handleCloseSettings = useCallback(() => {
    setIsSettingsPanelOpen(false);
  }, []);
  const [selectedExecution, setSelectedExecution] = useState<ExecutionRecord | null>(null);

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

  // Track completed tasks (for visual alert)
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  // Handle task completion (Claude CLI returned to prompt) - show alert instead of moving
  const handleTaskComplete = useCallback((taskId: string) => {
    console.log(`Task ${taskId} completed - showing alert`);
    // Add to completed set for visual indicator
    setCompletedTaskIds(prev => new Set(prev).add(taskId));
    // Play notification sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp+dlI6Ff3N0hJWkrrGxqqKXi39zdH6Ok6GqsK+ooZWJe3J0foqYoaqwr6ecj4J2c3V/i5mjqq6tnpOHe3N1fomXoamtrZ2ShHhzdX6IlZ+nq6yckYN3c3V9h5Sdpamrm5CCdnN1fIaTm6OoqZqPgHVzc3uEkZmhoqeYjn90c3N6g5CXn6KlloyCc3Jze4KPlp6ho5WLgHJycnqBjZSdoKKUin5xcXF5gIySnaCgk4l9cHBweX+Lkpufn5KIfG9wcHh+io+Zn5+RhntvbW94fYmOmJ2ekYV6bm1ud3yHjJeclIF5bWxsdXqFi5eblYB3bGtsc3mEiZaZlH91a2prcniDh5SYk350amlocXeDhpOXkn1ya2hocHWBhJKVkXtxa2docHSAg5GUkHpwamdncHN/go+SkHlwaWZmb3J+gY6RjnhvZ2VlbnF9gI2Qjndtak5mbnB8f4yPjXZuZ2RkbW97fo2OjHVtZmNjbG56fYuNi3RsZWJia2x5fIqMi3NrZGFhamx4e4mLinJqY2BgaWt3eoiKiXFpYl9faGp2eYeJiHBoYV5dZ2l1eIaIhnBnYF1cZmh0d4WHhW9mX1xbZWdzdoSGhG5lXltaZGZyd4OFg21kXVpZY2VxdYKEgmxjXFlYYmRwdIGDgWtCW1hXYWNvcoCD/2pBWFdWYGJucn+B/2lAV1ZVX2FtcX5//2g/VlVUXmBscX1+/2c+VVRTXl9rcHx9/2Y9VFNSXV5qb3t8/2U8U1JRXFprcHt7/2RdUlFQW1lqb3p5/2NcUVBPWlhpbnl4/2JbUE9OWVdobXd3/2E=');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if audio can't play
    } catch (e) {
      // Ignore audio errors
    }
  }, []);

  // Load tasks, agents, and sessions from DB on mount
  useEffect(() => {
    loadTasks();
    loadAgents();
    loadSessions();
    loadActiveSession();
  }, [loadTasks, loadAgents, loadSessions, loadActiveSession]);

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

  // Handle session switch
  const handleSessionSwitch = async (sessionId: string) => {
    await switchSession(sessionId);
  };

  // Command palette
  const commands = useCommandPalette({
    currentView,
    setCurrentView,
    setIsSessionModalOpen,
    setShowBashTerminal,
    setIsGitPanelOpen,
    setIsSettingsPanelOpen,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K: Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // ⌘1-9 / Ctrl+1-9: Session switching
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (sessions[index]) {
          switchSession(sessions[index].id);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessions, switchSession]);

  // Handle new session creation
  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;

    try {
      await window.electronAPI.dbSessionCreate({
        name: newSessionName,
        workingDirectory: newSessionCwd || '.',
        status: 'idle',
      });

      // Reload sessions to show the new one
      await loadSessions();

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
            onAgentClick={handleAgentClick}
          />
        );
      case 'dependencies':
        return (
          <div className="h-full overflow-auto p-6">
            {selectedTaskForDependencies ? (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTaskForDependencies(null)}
                    className="text-hive-accent hover:text-hive-accent/80 text-sm"
                  >
                    ← 戻る
                  </button>
                </div>
                <TaskDependencyTree taskId={selectedTaskForDependencies} />
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-6">タスク依存関係管理</h2>
                <p className="text-hive-muted mb-6">タスクを選択して依存関係を表示・編集します</p>
                <div className="grid gap-3">
                  {tasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTaskForDependencies(task.id)}
                      className="p-4 bg-hive-surface border border-hive-border rounded-lg hover:border-hive-accent transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{task.title}</div>
                          <div className="text-sm text-hive-muted mt-1">
                            Status: {task.status} | Priority: {task.priority}
                          </div>
                        </div>
                        <div className="text-hive-muted">
                          {task.dependsOn && task.dependsOn.length > 0 && (
                            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                              {task.dependsOn.length} 依存
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'execution':
        return (
          <div className="h-full flex">
            {/* Left: Execution List */}
            <div className="w-80 border-r border-hive-border">
              <ExecutionPanel onSelectExecution={setSelectedExecution} />
            </div>
            {/* Right: Execution Log */}
            <div className="flex-1">
              <ExecutionLog execution={selectedExecution} />
            </div>
          </div>
        );
      case 'history':
        return <HistoryView />;
      case 'workflow':
        return <WorkflowManager />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'export-import':
        return <ExportImportPanel />;
      case 'notifications':
        return <NotificationSettingsPanel />;
      case 'coordination':
        return <CoordinationPanel />;
      case 'settings':
        // Open settings panel instead of inline view
        if (!isSettingsPanelOpen) {
          setIsSettingsPanelOpen(true);
        }
        return (
          <div className="flex items-center justify-center h-full text-hive-muted">
            <p>Settings opened in modal</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
        }}
      />
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
            {renderNavButton('dependencies', '🔗', '依存関係')}
            {renderNavButton('execution', '⚙', '実行管理')}
            {renderNavButton('workflow', '🔄', 'ワークフロー')}
            {renderNavButton('history', '📜', '履歴')}
            {renderNavButton('analytics', '📊', '分析')}
            {renderNavButton('export-import', '💾', 'E/I')}
            {renderNavButton('notifications', '🔔', '通知')}
            {renderNavButton('coordination', '🤝', '連携')}
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
        {/* Header - Session tabs and command palette hint */}
        <header className="border-b border-hive-border bg-hive-surface drag-region">
          <div className="flex items-center justify-between">
            <div className="flex-1 no-drag">
              <SessionTabs
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSessionSwitch={handleSessionSwitch}
              />
            </div>
            <div className="px-4 py-2">
              <span className="text-hive-muted text-sm no-drag">⌘K でコマンドパレット</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            {renderMainContent()}
          </div>

          {/* Terminal Panel Area */}
          <div className="w-96 border-l border-hive-border bg-hive-surface flex flex-col">
            {/* Panel type selector */}
            <div className="flex border-b border-hive-border">
              <button
                onClick={() => setShowBashTerminal(false)}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors relative ${
                  !showBashTerminal
                    ? 'bg-hive-surface text-hive-accent border-b-2 border-hive-accent'
                    : 'text-hive-muted hover:text-white'
                }`}
              >
                🤖 Agent ({runningTasks.length})
                {completedTaskIds.size > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded animate-pulse">
                    確認待ち {completedTaskIds.size}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowBashTerminal(true)}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  showBashTerminal
                    ? 'bg-hive-surface text-hive-accent border-b-2 border-hive-accent'
                    : 'text-hive-muted hover:text-white'
                }`}
              >
                💻 Terminal
              </button>
            </div>

            {/* Show bash terminal or agent output */}
            {showBashTerminal ? (
              <div className="flex-1 overflow-hidden">
                <TerminalPanel agentId="bash" agentName="Bash Terminal" isActive={true} />
              </div>
            ) : (
              <>
                {/* Show running task agent output if any */}
                {runningTasks.length > 0 ? (
                  <>
                    {/* Running tasks section */}
                    <div className="border-b border-hive-border bg-green-900/20">
                      <div className="px-3 py-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-green-400">
                          稼働中 ({runningTasks.length})
                        </span>
                      </div>
                      {/* Task tabs for switching between parallel running tasks */}
                      <div className="flex overflow-x-auto px-2 pb-1 gap-1">
                        {runningTasks.map(task => {
                          const isCompleted = completedTaskIds.has(task.id);
                          return (
                            <button
                              key={task.id}
                              onClick={() => {
                                setActiveRunningTaskId(task.id);
                                // Clear completed status when clicked
                                if (isCompleted) {
                                  setCompletedTaskIds(prev => {
                                    const next = new Set(prev);
                                    next.delete(task.id);
                                    return next;
                                  });
                                }
                              }}
                              className={`px-3 py-1.5 text-xs rounded-t whitespace-nowrap transition-colors ${
                                isCompleted
                                  ? 'bg-yellow-500 text-black font-semibold'
                                  : activeRunningTaskId === task.id
                                    ? 'bg-hive-surface text-white border-t border-x border-hive-border'
                                    : 'bg-transparent text-hive-muted hover:text-white hover:bg-hive-surface/50'
                              }`}
                            >
                              {isCompleted ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block mr-1.5 animate-ping" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block mr-1.5 animate-pulse" />
                              )}
                              {task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title}
                              {isCompleted && <span className="ml-1">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active task terminal */}
                    <div className="flex-1 overflow-hidden">
                      {/* Show running task output */}
                      {activeRunningTaskId && runningTasks.find(t => t.id === activeRunningTaskId) && (
                        <AgentOutputPanel
                          key={activeRunningTaskId}
                          taskId={activeRunningTaskId}
                          taskTitle={runningTasks.find(t => t.id === activeRunningTaskId)?.title || ''}
                          isActive={true}
                          onAgentExit={handleAgentExit}
                          onTaskComplete={handleTaskComplete}
                        />
                      )}
                      {/* No task selected - show first available */}
                      {!activeRunningTaskId && runningTasks.length > 0 && (
                        <AgentOutputPanel
                          key={runningTasks[0].id}
                          taskId={runningTasks[0].id}
                          taskTitle={runningTasks[0].title}
                          isActive={true}
                          onAgentExit={handleAgentExit}
                          onTaskComplete={handleTaskComplete}
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
              </>
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

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commands}
      />

      {/* Git Panel */}
      <GitPanel
        isOpen={isGitPanelOpen}
        onClose={() => setIsGitPanelOpen(false)}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsPanelOpen}
        onClose={handleCloseSettings}
      />
      </div>
    </>
  );
}

export default App;
