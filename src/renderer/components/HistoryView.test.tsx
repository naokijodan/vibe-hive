// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { HistoryView } from './HistoryView';

vi.mock('../bridge/ipcBridge', () => ({
  default: {
    task: {
      getAll: vi.fn().mockResolvedValue([
        { id: 't1', title: 'Task 1', status: 'done', priority: 'high', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-02'), completedAt: new Date('2025-01-02') },
        { id: 't2', title: 'Task 2', status: 'in-progress', priority: 'medium', createdAt: new Date('2025-01-03'), updatedAt: new Date('2025-01-04') },
      ]),
      getBySession: vi.fn().mockResolvedValue([]),
    },
  },
}));

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: {
    dbAgentGetAll: vi.fn().mockResolvedValue([
      { id: 'a1', name: 'Agent 1', type: 'claude-code', status: 'ready', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
    ]),
    dbSessionGetAll: vi.fn().mockResolvedValue([
      { id: 's1', name: 'Session 1', workingDirectory: '/home', status: 'active', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
    ]),
    dbTaskCountBySession: vi.fn().mockResolvedValue(0),
  },
  writable: true,
});

describe('HistoryView', () => {
  it('renders tab buttons', async () => {
    render(<HistoryView />);
    await waitFor(() => {
      expect(screen.getByText(/タスク|Tasks/i)).toBeDefined();
    });
  });

  it('loads and displays task history', async () => {
    render(<HistoryView />);
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeDefined();
    });
  });

  it('shows multiple tasks', async () => {
    render(<HistoryView />);
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeDefined();
      expect(screen.getByText('Task 2')).toBeDefined();
    });
  });

  it('shows task status', async () => {
    render(<HistoryView />);
    await waitFor(() => {
      expect(screen.getAllByText(/done|完了|in-progress/i).length).toBeGreaterThan(0);
    });
  });

  it('renders agent tab', async () => {
    render(<HistoryView />);
    await waitFor(() => {
      const agentTab = screen.getAllByText(/エージェント|Agents/i);
      expect(agentTab.length).toBeGreaterThan(0);
    });
  });

  it('renders session tab', async () => {
    render(<HistoryView />);
    await waitFor(() => {
      const sessionTab = screen.getAllByText(/セッション|Sessions/i);
      expect(sessionTab.length).toBeGreaterThan(0);
    });
  });
});
