import React, { useState, useEffect } from 'react';
import { KanbanBoard } from './components/Kanban';
import { TerminalPanel, TerminalTabs } from './components/Terminal';
import { OrgChart } from './components/Organization';
import { Task, TaskStatus, Agent } from '../shared/types';
import { useTaskStore } from './stores/taskStore';
import { useAgentStore } from './stores/agentStore';

type ViewType = 'kanban' | 'organization' | 'history' | 'settings';

// デモ用のエージェントタブ
interface AgentTab {
  id: string;
  name: string;
  isActive: boolean;
  status: 'running' | 'waiting' | 'idle' | 'error';
}

const initialAgentTabs: AgentTab[] = [
  { id: 'claude-1', name: 'CEO', isActive: true, status: 'running' },
  { id: 'claude-2', name: 'CTO', isActive: false, status: 'waiting' },
  { id: 'claude-3', name: 'Engineer-1', isActive: false, status: 'idle' },
];

function App(): React.ReactElement {
  const { tasks, loadTasks, updateTaskStatus } = useTaskStore();
  const { agents, loadAgents } = useAgentStore();
  const [agentTabs, setAgentTabs] = useState<AgentTab[]>(initialAgentTabs);
  const [activeTabId, setActiveTabId] = useState('claude-1');
  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Load tasks and agents from DB on mount
  useEffect(() => {
    loadTasks();
    loadAgents();
  }, [loadTasks, loadAgents]);

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task);
  };

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    await updateTaskStatus(taskId, newStatus);
  };

  const handleTabSelect = (tabId: string) => {
    setActiveTabId(tabId);
  };

  const handleTabClose = (tabId: string) => {
    setAgentTabs(prev => prev.filter(t => t.id !== tabId));
    if (activeTabId === tabId && agentTabs.length > 1) {
      const remaining = agentTabs.filter(t => t.id !== tabId);
      setActiveTabId(remaining[0].id);
    }
  };

  const handleNewTab = () => {
    const newId = `claude-${Date.now()}`;
    setAgentTabs(prev => [...prev, {
      id: newId,
      name: `Agent-${prev.length + 1}`,
      isActive: false,
      status: 'idle' as const,
    }]);
    setActiveTabId(newId);
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
        return <OrgChart organization={{ name: 'Vibe Hive Organization', agents }} onAgentClick={handleAgentClick} />;
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
            <TerminalTabs
              tabs={agentTabs}
              activeTabId={activeTabId}
              onTabSelect={handleTabSelect}
              onTabClose={handleTabClose}
              onNewTab={handleNewTab}
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
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
