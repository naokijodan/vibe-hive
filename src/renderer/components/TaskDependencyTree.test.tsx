// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TaskDependencyTree } from './TaskDependencyTree';

vi.mock('../bridge/ipcBridge', () => ({
  default: {
    task: {
      get: vi.fn().mockResolvedValue({ id: 't1', title: 'Root Task', status: 'todo', dependencies: [] }),
      getDependencyTree: vi.fn().mockResolvedValue({ task: { id: 't1', title: 'Root Task' }, dependencies: [] }),
      getDependentTasks: vi.fn().mockResolvedValue([]),
      getAll: vi.fn().mockResolvedValue([]),
      addDependency: vi.fn(),
      removeDependency: vi.fn(),
    },
  },
}));

describe('TaskDependencyTree', () => {
  it('loads and renders task info', async () => {
    render(<TaskDependencyTree taskId="t1" />);
    await waitFor(() => {
      expect(screen.getByText(/Root Task/)).toBeDefined();
    });
  });
});
