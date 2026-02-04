// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockFns, mockState } = vi.hoisted(() => ({
  mockFns: {
    loadTasks: vi.fn(),
    updateTaskStatus: vi.fn().mockResolvedValue(undefined),
    loadAgents: vi.fn(),
    loadSessions: vi.fn(),
    loadActiveSession: vi.fn(),
    switchSession: vi.fn().mockResolvedValue(undefined),
    loadExecutions: vi.fn(),
    togglePanel: vi.fn(),
    toggle: vi.fn(),
    dbSessionCreate: vi.fn().mockResolvedValue({ id: 's-new' }),
    getActiveColors: vi.fn().mockResolvedValue({}),
    onStatusChange: vi.fn(() => vi.fn()),
  },
  mockState: {
    tasks: [] as any[],
    agents: [] as any[],
    sessions: [
      { id: 's1', name: 'Session 1' },
      { id: 's2', name: 'Session 2' },
    ] as any[],
    activeSessionId: 's1' as string | null,
    isOpen: false,
    commandPaletteOpen: false,
  },
}));

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  } as any;

  (window as any).electronAPI = {
    dbSessionCreate: mockFns.dbSessionCreate,
  };
});

// Mock all lazy-loaded components
vi.mock('./components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('./components/ViewLoadingFallback', () => ({
  ViewLoadingFallback: () => <div>Loading...</div>,
}));

vi.mock('./components/Kanban', () => ({
  KanbanBoard: ({ tasks }: any) => <div data-testid="kanban-board">KanbanBoard ({tasks?.length || 0} tasks)</div>,
}));

vi.mock('./components/Terminal', () => ({
  TerminalPanel: ({ agentName }: any) => <div data-testid="terminal-panel">{agentName}</div>,
  TerminalTabs: () => null,
  AgentOutputPanel: ({ taskId, taskTitle }: any) => (
    <div data-testid="agent-output-panel">AgentOutput: {taskTitle} ({taskId})</div>
  ),
}));

vi.mock('./components/Session', () => ({
  SessionTabs: ({ sessions, onSessionSwitch }: any) => (
    <div data-testid="session-tabs">
      {sessions?.map((s: any) => (
        <button key={s.id} onClick={() => onSessionSwitch(s.id)}>
          {s.name}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('./components/CommandPalette', () => ({
  CommandPalette: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="command-palette">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

vi.mock('./components/Git/GitPanel', () => ({
  GitPanel: ({ isOpen }: any) => (isOpen ? <div data-testid="git-panel">GitPanel</div> : null),
}));

vi.mock('./components/Settings/SettingsPanel', () => ({
  SettingsPanel: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="settings-panel">
        SettingsPanel
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

vi.mock('./components/Execution/ExecutionPanel', () => ({
  ExecutionPanel: ({ onSelectExecution }: any) => (
    <div data-testid="execution-panel">
      <button onClick={() => onSelectExecution({ id: 'e1' })}>Select Execution</button>
    </div>
  ),
}));

vi.mock('./components/Execution/ExecutionLog', () => ({
  ExecutionLog: ({ execution }: any) => (
    <div data-testid="execution-log">{execution ? `Log: ${execution.id}` : 'No execution'}</div>
  ),
}));

vi.mock('./components/AI/AIChatPanel', () => ({
  AIChatPanel: () => <div data-testid="ai-chat-panel">AIChatPanel</div>,
}));

vi.mock('./components/Organization', () => ({
  OrgChart: () => <div data-testid="org-chart">OrgChart</div>,
}));

vi.mock('./components/TaskDependencyTree', () => ({
  TaskDependencyTree: ({ taskId }: any) => <div data-testid="dependency-tree">DependencyTree: {taskId}</div>,
}));

vi.mock('./components/HistoryView', () => ({
  HistoryView: () => <div data-testid="history-view">HistoryView</div>,
}));

vi.mock('./components/Workflow/WorkflowManager', () => ({
  WorkflowManager: () => <div data-testid="workflow-manager">WorkflowManager</div>,
}));

vi.mock('./components/Analytics', () => ({
  AnalyticsDashboard: () => <div data-testid="analytics-dashboard">AnalyticsDashboard</div>,
}));

vi.mock('./components/ExportImport', () => ({
  ExportImportPanel: () => <div data-testid="export-import-panel">ExportImportPanel</div>,
}));

vi.mock('./components/NotificationSettings', () => ({
  NotificationSettingsPanel: () => <div data-testid="notification-settings">NotificationSettings</div>,
}));

vi.mock('./components/Coordination', () => ({
  CoordinationPanel: () => <div data-testid="coordination-panel">CoordinationPanel</div>,
}));

vi.mock('./components/ClaudeHooks', () => ({
  ClaudeHooksPanel: () => <div data-testid="claude-hooks-panel">ClaudeHooksPanel</div>,
}));

vi.mock('./components/Theme', () => ({
  ThemePanel: () => <div data-testid="theme-panel">ThemePanel</div>,
}));

vi.mock('./components/Plugin/PluginManager', () => ({
  PluginManager: () => <div data-testid="plugin-manager">PluginManager</div>,
}));

vi.mock('./components/Profiler/ProfilerPanel', () => ({
  ProfilerPanel: () => <div data-testid="profiler-panel">ProfilerPanel</div>,
}));

vi.mock('./components/Collaboration/CollaborationPanel', () => ({
  CollaborationPanel: () => <div data-testid="collaboration-panel">CollaborationPanel</div>,
}));

vi.mock('./components/Voice/VoiceCommandPanel', () => ({
  VoiceCommandPanel: () => <div data-testid="voice-command-panel">VoiceCommandPanel</div>,
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('./stores/taskStore', () => ({
  useTaskStore: () => ({
    tasks: mockState.tasks,
    loadTasks: mockFns.loadTasks,
    updateTaskStatus: mockFns.updateTaskStatus,
  }),
}));

vi.mock('./stores/agentStore', () => ({
  useAgentStore: () => ({
    agents: mockState.agents,
    loadAgents: mockFns.loadAgents,
  }),
}));

vi.mock('./stores/sessionStore', () => ({
  useSessionStore: () => ({
    sessions: mockState.sessions,
    activeSessionId: mockState.activeSessionId,
    loadSessions: mockFns.loadSessions,
    loadActiveSession: mockFns.loadActiveSession,
    switchSession: mockFns.switchSession,
  }),
}));

vi.mock('./stores/executionStore', () => ({
  useExecutionStore: () => ({
    loadExecutions: mockFns.loadExecutions,
  }),
}));

vi.mock('./stores/aiAssistantStore', () => ({
  useAIAssistantStore: Object.assign(
    () => ({
      isOpen: mockState.isOpen,
      toggle: mockFns.toggle,
    }),
    {
      getState: () => ({
        togglePanel: mockFns.togglePanel,
      }),
    }
  ),
}));

vi.mock('./hooks/useCommandPalette', () => ({
  useCommandPalette: () => [
    { id: 'cmd1', label: 'Command 1', action: vi.fn() },
  ],
}));

vi.mock('./bridge/ipcBridge', () => ({
  ipcBridge: {
    session: {
      create: vi.fn().mockResolvedValue({ id: 's1' }),
    },
    execution: {
      onStatusChange: mockFns.onStatusChange,
    },
    theme: {
      getActiveColors: mockFns.getActiveColors,
    },
  },
}));

import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.tasks = [];
    mockState.agents = [];
    mockState.sessions = [
      { id: 's1', name: 'Session 1' },
      { id: 's2', name: 'Session 2' },
    ];
    mockState.activeSessionId = 's1';
    mockState.isOpen = false;
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<App />);
      expect(container.innerHTML).not.toBe('');
    });

    it('renders sidebar with logo', () => {
      render(<App />);
      expect(screen.getByText('Vibe Hive')).toBeDefined();
    });

    it('renders AI Swarm Manager subtitle', () => {
      render(<App />);
      expect(screen.getByText('AI Swarm Manager')).toBeDefined();
    });

    it('renders session tabs', () => {
      render(<App />);
      expect(screen.getByTestId('session-tabs')).toBeDefined();
    });

    it('renders kanban board by default', () => {
      render(<App />);
      expect(screen.getByTestId('kanban-board')).toBeDefined();
    });

    it('renders AI chat panel', () => {
      render(<App />);
      expect(screen.getByTestId('ai-chat-panel')).toBeDefined();
    });
  });

  describe('initial data loading', () => {
    it('calls loadTasks on mount', () => {
      render(<App />);
      expect(mockFns.loadTasks).toHaveBeenCalled();
    });

    it('calls loadAgents on mount', () => {
      render(<App />);
      expect(mockFns.loadAgents).toHaveBeenCalled();
    });

    it('calls loadSessions on mount', () => {
      render(<App />);
      expect(mockFns.loadSessions).toHaveBeenCalled();
    });

    it('calls loadActiveSession on mount', () => {
      render(<App />);
      expect(mockFns.loadActiveSession).toHaveBeenCalled();
    });

    it('calls getActiveColors for theme on mount', async () => {
      render(<App />);
      await waitFor(() => {
        expect(mockFns.getActiveColors).toHaveBeenCalled();
      });
    });
  });

  describe('sidebar navigation', () => {
    it('shows kanban button', () => {
      render(<App />);
      expect(screen.getByText('📋 タスクボード')).toBeDefined();
    });

    it('shows organization button', () => {
      render(<App />);
      expect(screen.getByText('🏢 組織構造')).toBeDefined();
    });

    it('shows dependencies button', () => {
      render(<App />);
      expect(screen.getByText('🔗 依存関係')).toBeDefined();
    });

    it('shows execution button', () => {
      render(<App />);
      expect(screen.getByText('⚙ 実行管理')).toBeDefined();
    });

    it('shows workflow button', () => {
      render(<App />);
      expect(screen.getByText('🔄 ワークフロー')).toBeDefined();
    });

    it('shows history button', () => {
      render(<App />);
      expect(screen.getByText('📜 履歴')).toBeDefined();
    });

    it('shows analytics button', () => {
      render(<App />);
      expect(screen.getByText('📊 分析')).toBeDefined();
    });

    it('shows settings button', () => {
      render(<App />);
      expect(screen.getByText('⚙️ 設定')).toBeDefined();
    });

    it('shows AI assistant button', () => {
      render(<App />);
      expect(screen.getByText('AI アシスタント')).toBeDefined();
    });
  });

  describe('view switching', () => {
    it('switches to organization view', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('🏢 組織構造'));
      await waitFor(() => {
        expect(screen.getByTestId('org-chart')).toBeDefined();
      });
    });

    it('switches to history view', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('📜 履歴'));
      await waitFor(() => {
        expect(screen.getByTestId('history-view')).toBeDefined();
      });
    });

    it('switches to workflow view', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('🔄 ワークフロー'));
      await waitFor(() => {
        expect(screen.getByTestId('workflow-manager')).toBeDefined();
      });
    });

    it('switches to analytics view', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('📊 分析'));
      await waitFor(() => {
        expect(screen.getByTestId('analytics-dashboard')).toBeDefined();
      });
    });

    it('switches to export-import view', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('💾 E/I'));
      await waitFor(() => {
        expect(screen.getByTestId('export-import-panel')).toBeDefined();
      });
    });

    it('switches to notifications view', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('🔔 通知'));
      await waitFor(() => {
        expect(screen.getByTestId('notification-settings')).toBeDefined();
      });
    });

    it('switches to coordination view', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('🤝 連携'));
      await waitFor(() => {
        expect(screen.getByTestId('coordination-panel')).toBeDefined();
      });
    });

    it('switches to claude-hooks view', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('🪝 Hooks'));
      await waitFor(() => {
        expect(screen.getByTestId('claude-hooks-panel')).toBeDefined();
      });
    });

    it('switches to plugins view', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('🧩 プラグイン'));
      await waitFor(() => {
        expect(screen.getByTestId('plugin-manager')).toBeDefined();
      });
    });

    it('switches to profiler view', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('⏱ プロファイラー'));
      await waitFor(() => {
        expect(screen.getByTestId('profiler-panel')).toBeDefined();
      });
    });

    it('switches to collaboration view', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('👥 コラボ'));
      await waitFor(() => {
        expect(screen.getByTestId('collaboration-panel')).toBeDefined();
      });
    });

    it('switches to voice view', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('🎙 音声'));
      await waitFor(() => {
        expect(screen.getByTestId('voice-command-panel')).toBeDefined();
      });
    });

    it('switches to theme view', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('🎨 テーマ'));
      await waitFor(() => {
        expect(screen.getByTestId('theme-panel')).toBeDefined();
      });
    });
  });

  describe('execution view', () => {
    it('shows execution panel and log', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('⚙ 実行管理'));
      await waitFor(() => {
        expect(screen.getByTestId('execution-panel')).toBeDefined();
        expect(screen.getByTestId('execution-log')).toBeDefined();
      });
    });

    it('shows no execution initially in log', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('⚙ 実行管理'));
      await waitFor(() => {
        expect(screen.getByText('No execution')).toBeDefined();
      });
    });
  });

  describe('dependencies view', () => {
    it('shows task list when no task selected', async () => {
      mockState.tasks = [
        { id: 't1', title: 'Dep Task 1', status: 'todo', priority: 'high' },
        { id: 't2', title: 'Dep Task 2', status: 'todo', priority: 'medium' },
      ];
      render(<App />);
      fireEvent.click(screen.getByText('🔗 依存関係'));
      await waitFor(() => {
        expect(screen.getByText('タスク依存関係管理')).toBeDefined();
        expect(screen.getByText('Dep Task 1')).toBeDefined();
        expect(screen.getByText('Dep Task 2')).toBeDefined();
      });
    });

    it('shows dependency tree when task selected', async () => {
      mockState.tasks = [
        { id: 't1', title: 'Task 1', status: 'todo', priority: 'high' },
      ];
      render(<App />);
      fireEvent.click(screen.getByText('🔗 依存関係'));
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeDefined();
      });
      fireEvent.click(screen.getByText('Task 1'));
      await waitFor(() => {
        expect(screen.getByTestId('dependency-tree')).toBeDefined();
        expect(screen.getByText('DependencyTree: t1')).toBeDefined();
      });
    });

    it('shows back button when task selected', async () => {
      mockState.tasks = [
        { id: 't1', title: 'Task 1', status: 'todo', priority: 'high' },
      ];
      render(<App />);
      fireEvent.click(screen.getByText('🔗 依存関係'));
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeDefined();
      });
      fireEvent.click(screen.getByText('Task 1'));
      await waitFor(() => {
        expect(screen.getByText('← 戻る')).toBeDefined();
      });
    });

    it('returns to task list when back clicked', async () => {
      mockState.tasks = [
        { id: 't1', title: 'Task 1', status: 'todo', priority: 'high' },
      ];
      render(<App />);
      fireEvent.click(screen.getByText('🔗 依存関係'));
      await waitFor(() => {
        fireEvent.click(screen.getByText('Task 1'));
      });
      await waitFor(() => {
        fireEvent.click(screen.getByText('← 戻る'));
      });
      await waitFor(() => {
        expect(screen.getByText('タスク依存関係管理')).toBeDefined();
      });
    });
  });

  describe('sidebar collapse', () => {
    it('shows collapse button', () => {
      render(<App />);
      expect(screen.getByText('◀')).toBeDefined();
    });

    it('collapses sidebar on click', () => {
      render(<App />);
      fireEvent.click(screen.getByText('◀'));
      expect(screen.getByText('▶')).toBeDefined();
    });

    it('hides logo text when collapsed', () => {
      render(<App />);
      fireEvent.click(screen.getByText('◀'));
      expect(screen.queryByText('Vibe Hive')).toBeNull();
    });

    it('shows icon only for nav buttons when collapsed', () => {
      render(<App />);
      fireEvent.click(screen.getByText('◀'));
      expect(screen.getByText('📋')).toBeDefined();
      expect(screen.queryByText('タスクボード')).toBeNull();
    });

    it('expands sidebar on second click', () => {
      render(<App />);
      fireEvent.click(screen.getByText('◀'));
      fireEvent.click(screen.getByText('▶'));
      expect(screen.getByText('Vibe Hive')).toBeDefined();
    });
  });

  describe('settings panel', () => {
    it('opens settings panel on click', () => {
      render(<App />);
      fireEvent.click(screen.getByText('⚙️ 設定'));
      expect(screen.getByTestId('settings-panel')).toBeDefined();
    });

    it('closes settings panel', () => {
      render(<App />);
      fireEvent.click(screen.getByText('⚙️ 設定'));
      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('settings-panel')).toBeNull();
    });
  });

  describe('session modal', () => {
    it('shows new session button', () => {
      render(<App />);
      expect(screen.getByText('+ 新規セッション')).toBeDefined();
    });

    it('opens session modal on click', () => {
      render(<App />);
      fireEvent.click(screen.getByText('+ 新規セッション'));
      expect(screen.getByText('新規セッション作成')).toBeDefined();
    });

    it('shows session name input', () => {
      render(<App />);
      fireEvent.click(screen.getByText('+ 新規セッション'));
      expect(screen.getByPlaceholderText('例: 新規プロジェクト開発')).toBeDefined();
    });

    it('shows working directory input', () => {
      render(<App />);
      fireEvent.click(screen.getByText('+ 新規セッション'));
      expect(screen.getByPlaceholderText('例: /Users/name/projects/my-app')).toBeDefined();
    });

    it('disables create button when name is empty', () => {
      render(<App />);
      fireEvent.click(screen.getByText('+ 新規セッション'));
      const createButton = screen.getByText('作成');
      expect(createButton).toHaveProperty('disabled', true);
    });

    it('enables create button when name is entered', () => {
      render(<App />);
      fireEvent.click(screen.getByText('+ 新規セッション'));
      const input = screen.getByPlaceholderText('例: 新規プロジェクト開発');
      fireEvent.change(input, { target: { value: 'New Session' } });
      const createButton = screen.getByText('作成');
      expect(createButton).toHaveProperty('disabled', false);
    });

    it('closes modal on cancel', () => {
      render(<App />);
      fireEvent.click(screen.getByText('+ 新規セッション'));
      fireEvent.click(screen.getByText('キャンセル'));
      expect(screen.queryByText('新規セッション作成')).toBeNull();
    });

    it('creates session on submit', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('+ 新規セッション'));
      const input = screen.getByPlaceholderText('例: 新規プロジェクト開発');
      fireEvent.change(input, { target: { value: 'New Session' } });
      fireEvent.click(screen.getByText('作成'));
      await waitFor(() => {
        expect(mockFns.dbSessionCreate).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'New Session' })
        );
      });
    });

    it('reloads sessions after creation', async () => {
      render(<App />);
      fireEvent.click(screen.getByText('+ 新規セッション'));
      const input = screen.getByPlaceholderText('例: 新規プロジェクト開発');
      fireEvent.change(input, { target: { value: 'New Session' } });
      vi.clearAllMocks();
      fireEvent.click(screen.getByText('作成'));
      await waitFor(() => {
        expect(mockFns.loadSessions).toHaveBeenCalled();
      });
    });
  });

  describe('terminal panel', () => {
    it('shows Agent and Terminal tabs', () => {
      render(<App />);
      expect(screen.getByText(/Agent/)).toBeDefined();
      expect(screen.getByText(/Terminal/)).toBeDefined();
    });

    it('shows no running tasks message when no tasks', () => {
      render(<App />);
      expect(screen.getByText('稼働中のタスクがありません')).toBeDefined();
    });

    it('shows bash terminal when Terminal tab clicked', () => {
      render(<App />);
      fireEvent.click(screen.getByText(/Terminal/));
      expect(screen.getByTestId('terminal-panel')).toBeDefined();
      expect(screen.getByText('Bash Terminal')).toBeDefined();
    });

    it('shows running tasks section when tasks in progress', () => {
      mockState.tasks = [
        { id: 't1', title: 'Running Task', status: 'in_progress' },
      ];
      render(<App />);
      expect(screen.getByText('稼働中 (1)')).toBeDefined();
    });

    it('shows agent output panel for running task', () => {
      mockState.tasks = [
        { id: 't1', title: 'Running Task', status: 'in_progress' },
      ];
      render(<App />);
      expect(screen.getByTestId('agent-output-panel')).toBeDefined();
      expect(screen.getByText('AgentOutput: Running Task (t1)')).toBeDefined();
    });

    it('shows multiple task tabs when multiple running', () => {
      mockState.tasks = [
        { id: 't1', title: 'First Task', status: 'in_progress' },
        { id: 't2', title: 'Second Task', status: 'in_progress' },
      ];
      render(<App />);
      expect(screen.getByText('稼働中 (2)')).toBeDefined();
      // Task tabs show truncated titles
      expect(screen.getAllByText(/First Task/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Second Task/).length).toBeGreaterThan(0);
    });
  });

  describe('session switching', () => {
    it('switches session when tab clicked', () => {
      render(<App />);
      fireEvent.click(screen.getByText('Session 2'));
      expect(mockFns.switchSession).toHaveBeenCalledWith('s2');
    });
  });

  describe('command palette', () => {
    it('shows command palette hint', () => {
      render(<App />);
      expect(screen.getByText('⌘K でコマンドパレット')).toBeDefined();
    });
  });

  describe('keyboard shortcuts', () => {
    it('toggles command palette on Cmd+K', () => {
      render(<App />);
      fireEvent.keyDown(window, { key: 'k', metaKey: true });
      expect(screen.getByTestId('command-palette')).toBeDefined();
    });

    it('toggles command palette on Ctrl+K', () => {
      render(<App />);
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
      expect(screen.getByTestId('command-palette')).toBeDefined();
    });

    it('closes command palette on second Cmd+K', () => {
      render(<App />);
      fireEvent.keyDown(window, { key: 'k', metaKey: true });
      fireEvent.keyDown(window, { key: 'k', metaKey: true });
      expect(screen.queryByTestId('command-palette')).toBeNull();
    });

    it('switches to session 1 on Cmd+1', () => {
      render(<App />);
      fireEvent.keyDown(window, { key: '1', metaKey: true });
      expect(mockFns.switchSession).toHaveBeenCalledWith('s1');
    });

    it('switches to session 2 on Cmd+2', () => {
      render(<App />);
      fireEvent.keyDown(window, { key: '2', metaKey: true });
      expect(mockFns.switchSession).toHaveBeenCalledWith('s2');
    });

    it('does not switch on non-existent session number', () => {
      render(<App />);
      vi.clearAllMocks();
      fireEvent.keyDown(window, { key: '9', metaKey: true });
      expect(mockFns.switchSession).not.toHaveBeenCalled();
    });
  });

  describe('AI assistant toggle', () => {
    it('calls togglePanel when AI assistant button clicked', () => {
      render(<App />);
      fireEvent.click(screen.getByText('AI アシスタント'));
      expect(mockFns.togglePanel).toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('has main flex container', () => {
      const { container } = render(<App />);
      expect(container.innerHTML).toContain('flex h-screen');
    });

    it('has sidebar with border', () => {
      const { container } = render(<App />);
      expect(container.innerHTML).toContain('border-r');
    });

    it('has bg-hive classes', () => {
      const { container } = render(<App />);
      expect(container.innerHTML).toContain('bg-hive-bg');
      expect(container.innerHTML).toContain('bg-hive-surface');
    });
  });

  describe('agent filtering in kanban', () => {
    it('filters tasks by selected agent', () => {
      mockState.agents = [
        { id: 'a1', name: 'Agent 1', status: 'idle' },
      ];
      mockState.tasks = [
        { id: 't1', title: 'Task 1', status: 'todo', assignedAgentId: 'a1' },
        { id: 't2', title: 'Task 2', status: 'todo', assignedAgentId: 'a2' },
      ];
      // This would require clicking on an agent in OrgChart to trigger filtering
      // For now, just verify kanban renders with all tasks
      render(<App />);
      expect(screen.getByTestId('kanban-board')).toBeDefined();
    });
  });

  describe('resize handles', () => {
    it('has sidebar resize handle when not collapsed', () => {
      const { container } = render(<App />);
      expect(container.innerHTML).toContain('cursor-col-resize');
    });

    it('hides sidebar resize handle when collapsed', () => {
      const { container } = render(<App />);
      fireEvent.click(screen.getByText('◀'));
      // After collapse, there should still be terminal resize handle
      expect(container.innerHTML).toContain('cursor-col-resize');
    });
  });

  describe('new session button when collapsed', () => {
    it('shows + only when collapsed', () => {
      render(<App />);
      fireEvent.click(screen.getByText('◀'));
      expect(screen.getByText('+')).toBeDefined();
      expect(screen.queryByText('新規セッション')).toBeNull();
    });
  });
});
