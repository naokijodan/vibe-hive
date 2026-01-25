import React, { useState } from 'react';
import { KanbanBoard } from './components/Kanban';
import { TerminalPanel, TerminalTabs } from './components/Terminal';
import { OrgChart } from './components/Organization';
import { Task, TaskStatus, Agent } from '../shared/types';

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

// デモ用のサンプルタスク
const sampleTasks: Task[] = [
  {
    id: '1',
    sessionId: 'session-1',
    title: 'Electronプロジェクト初期化',
    description: 'package.json, tsconfig, 基本構成を作成',
    status: 'done',
    priority: 'high',
    assignedAgentId: 'claude-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    sessionId: 'session-1',
    title: 'Kanban UIコンポーネント',
    description: 'TaskCard, KanbanColumn, KanbanBoardを実装',
    status: 'in_progress',
    priority: 'high',
    assignedAgentId: 'claude-2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    sessionId: 'session-1',
    title: 'ターミナル統合',
    description: 'xterm.js + node-ptyでターミナル機能を実装',
    status: 'todo',
    priority: 'medium',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    sessionId: 'session-1',
    title: '組織構造ビュー',
    description: 'CEO→CTO→エンジニアのツリー表示',
    status: 'review',
    priority: 'medium',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function App(): React.ReactElement {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [agentTabs, setAgentTabs] = useState<AgentTab[]>(initialAgentTabs);
  const [activeTabId, setActiveTabId] = useState('claude-1');
  const [currentView, setCurrentView] = useState<ViewType>('kanban');

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task);
  };

  const handleTaskMove = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, status: newStatus, updatedAt: new Date() }
        : task
    ));
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
    switch (currentView) {
      case 'kanban':
        return <KanbanBoard tasks={tasks} onTaskClick={handleTaskClick} onTaskMove={handleTaskMove} />;
      case 'organization':
        return <OrgChart onAgentClick={handleAgentClick} />;
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
        <div className="p-4 border-b border-hive-border">
          <h1 className="text-xl font-bold text-hive-accent flex items-center gap-2">
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
        {/* Header */}
        <header className="h-12 border-b border-hive-border bg-hive-surface flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="font-medium">Session: Vibe Hive 開発</span>
            <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">Active</span>
          </div>
          <span className="text-hive-muted text-sm">⌘K でコマンドパレット</span>
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
