import React, { useState, useEffect } from 'react';
import { KanbanBoard } from './components/Kanban';
import { TerminalPanel, TerminalTabs } from './components/Terminal';
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
  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

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
          <button className="w-full bg-hive-accent text-black font-medium py-2 px-4 rounded hover:bg-hive-accent/80 text-sm">
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
            {agents.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center text-hive-muted">
                  <p className="text-lg mb-2">エージェントがありません</p>
                  <p className="text-sm">組織構造画面からエージェントを作成してください</p>
                </div>
              </div>
            ) : (
              <>
                <TerminalTabs
                  tabs={agentTabs}
                  activeTabId={activeTabId || ''}
                  onTabSelect={handleTabSelect}
                />
                <div className="flex-1">
                  {activeAgent && (
                    <TerminalPanel
                      agentId={activeAgent.id}
                      agentName={activeAgent.name}
                      isActive={activeAgent.status === 'running'}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
