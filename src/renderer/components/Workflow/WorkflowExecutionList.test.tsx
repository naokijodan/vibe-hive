// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { WorkflowExecutionList } from './WorkflowExecutionList';

const mockExecutions = [
  { id: 1, workflowId: 1, status: 'success', startedAt: Date.now() - 10000, completedAt: Date.now(), executionData: {} },
];

vi.mock('../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({
    loadExecutions: vi.fn().mockResolvedValue(mockExecutions),
  }),
}));

describe('WorkflowExecutionList', () => {
  it('renders execution history after loading', async () => {
    render(<WorkflowExecutionList workflowId={1} />);
    await waitFor(() => {
      expect(screen.getByText('Execution History')).toBeDefined();
    });
  });

  it('shows execution items', async () => {
    render(<WorkflowExecutionList workflowId={1} />);
    await waitFor(() => {
      expect(screen.getByText('Execution #1')).toBeDefined();
      expect(screen.getByText('success')).toBeDefined();
    });
  });

  it('shows history header', async () => {
    render(<WorkflowExecutionList workflowId={1} />);
    await waitFor(() => {
      expect(screen.getByText('Execution History')).toBeDefined();
    });
  });

  it('renders execution status', async () => {
    render(<WorkflowExecutionList workflowId={1} />);
    await waitFor(() => {
      expect(screen.getByText('success')).toBeDefined();
    });
  });

  it('renders container with workflow id', async () => {
    const { container } = render(<WorkflowExecutionList workflowId={1} />);
    await waitFor(() => {
      expect(container.innerHTML).not.toBe('');
    });
  });
});
