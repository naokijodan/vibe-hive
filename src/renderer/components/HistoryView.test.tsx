// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { HistoryView } from './HistoryView';

vi.mock('../bridge/ipcBridge', () => ({
  default: {
    task: {
      getAll: vi.fn().mockResolvedValue([
        { id: 't1', title: 'Task 1', status: 'done', priority: 'high', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-02'), completedAt: new Date('2025-01-02') },
      ]),
      getBySession: vi.fn().mockResolvedValue([]),
    },
  },
}));

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: {
    dbAgentGetAll: vi.fn().mockResolvedValue([]),
    dbSessionGetAll: vi.fn().mockResolvedValue([]),
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
});
