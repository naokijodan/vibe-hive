// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  } as any;
});

// Mock all lazy-loaded components
vi.mock('./components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('./components/ViewLoadingFallback', () => ({
  ViewLoadingFallback: () => <div>Loading...</div>,
}));

vi.mock('./components/Kanban', () => ({
  KanbanBoard: () => <div>KanbanBoard</div>,
}));

vi.mock('./components/Terminal', () => ({
  TerminalPanel: () => null,
  TerminalTabs: () => null,
  AgentOutputPanel: () => null,
}));

vi.mock('./components/Session', () => ({
  SessionTabs: () => <div>SessionTabs</div>,
}));

vi.mock('./components/CommandPalette', () => ({
  CommandPalette: () => null,
}));

vi.mock('./components/Git/GitPanel', () => ({
  GitPanel: () => null,
}));

vi.mock('./components/Settings/SettingsPanel', () => ({
  SettingsPanel: () => null,
}));

vi.mock('./components/Execution/ExecutionPanel', () => ({
  ExecutionPanel: () => null,
}));

vi.mock('./components/Execution/ExecutionLog', () => ({
  ExecutionLog: () => null,
}));

vi.mock('./components/AI/AIChatPanel', () => ({
  AIChatPanel: () => null,
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('./stores/taskStore', () => ({
  useTaskStore: () => ({
    tasks: [],
    loadTasks: vi.fn(),
    updateTaskStatus: vi.fn(),
  }),
}));

vi.mock('./stores/agentStore', () => ({
  useAgentStore: () => ({
    agents: [],
    loadAgents: vi.fn(),
  }),
}));

vi.mock('./stores/sessionStore', () => ({
  useSessionStore: () => ({
    sessions: [],
    activeSessionId: 's1',
    loadSessions: vi.fn(),
    loadActiveSession: vi.fn(),
    switchSession: vi.fn(),
  }),
}));

vi.mock('./stores/executionStore', () => ({
  useExecutionStore: () => ({
    loadExecutions: vi.fn(),
  }),
}));

vi.mock('./stores/aiAssistantStore', () => ({
  useAIAssistantStore: () => ({
    isOpen: false,
    toggle: vi.fn(),
  }),
}));

vi.mock('./hooks/useCommandPalette', () => ({
  useCommandPalette: () => ({
    isOpen: false,
    toggle: vi.fn(),
  }),
}));

vi.mock('./bridge/ipcBridge', () => ({
  ipcBridge: {
    session: {
      create: vi.fn().mockResolvedValue({ id: 's1' }),
    },
    execution: {
      onStatusChange: vi.fn(() => vi.fn()),
    },
    theme: {
      getActiveColors: vi.fn().mockResolvedValue(null),
    },
  },
}));

import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container.innerHTML).not.toBe('');
  });
});
