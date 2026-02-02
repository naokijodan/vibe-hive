// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CoordinationPanel } from './CoordinationPanel';

vi.mock('../../bridge/ipcBridge', () => ({
  ipcBridge: {
    coordination: {
      getMessages: vi.fn().mockResolvedValue([]),
      getDelegations: vi.fn().mockResolvedValue([]),
      sendMessage: vi.fn(),
      delegateTask: vi.fn(),
      onMessage: vi.fn(() => vi.fn()),
      onDelegation: vi.fn(() => vi.fn()),
      clearMessages: vi.fn(),
      respondDelegation: vi.fn(),
    },
  },
}));

vi.mock('../../stores/agentStore', () => ({
  useAgentStore: () => ({
    agents: [
      { id: 'a1', name: 'Agent 1', status: 'idle' },
      { id: 'a2', name: 'Agent 2', status: 'idle' },
    ],
    loadAgents: vi.fn(),
  }),
}));

vi.mock('../../stores/taskStore', () => ({
  useTaskStore: () => ({
    tasks: [
      { id: 't1', title: 'Test Task', status: 'todo' },
    ],
    loadTasks: vi.fn(),
  }),
}));

describe('CoordinationPanel', () => {
  it('renders tab buttons', () => {
    render(<CoordinationPanel />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders panel header', () => {
    render(<CoordinationPanel />);
    expect(screen.getByText('Agent Coordination')).toBeDefined();
  });

  it('shows messages tab by default', () => {
    render(<CoordinationPanel />);
    const msgs = screen.getAllByText(/メッセージ/);
    expect(msgs.length).toBeGreaterThan(0);
  });

  it('switches to delegations tab', () => {
    render(<CoordinationPanel />);
    const delegTabs = screen.getAllByText(/タスク委譲/);
    fireEvent.click(delegTabs[0]);
    expect(delegTabs.length).toBeGreaterThan(0);
  });

  it('switches to send tab', () => {
    render(<CoordinationPanel />);
    const sendTabs = screen.getAllByText(/送信/);
    fireEvent.click(sendTabs[0]);
    expect(sendTabs.length).toBeGreaterThan(0);
  });
});
