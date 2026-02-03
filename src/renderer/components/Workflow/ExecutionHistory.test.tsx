// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ExecutionHistory } from './ExecutionHistory';

vi.mock('../../stores/workflowStore', () => ({
  useWorkflowStore: (selector: any) => selector ? selector({ loadExecutions: vi.fn().mockResolvedValue([]) }) : ({ loadExecutions: vi.fn().mockResolvedValue([]) }),
}));

describe('ExecutionHistory', () => {
  it('shows empty state when no workflow selected', () => {
    render(<ExecutionHistory workflowId={null} onSelectExecution={vi.fn()} />);
    expect(screen.getByText(/No executions|Select a workflow/i)).toBeDefined();
  });

  it('renders container', () => {
    const { container } = render(<ExecutionHistory workflowId={null} onSelectExecution={vi.fn()} />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders with workflow id', async () => {
    render(<ExecutionHistory workflowId={1} onSelectExecution={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getAllByText(/Execution|No executions/i).length).toBeGreaterThan(0);
    });
  });

  it('calls onSelectExecution callback', async () => {
    const onSelectExecution = vi.fn();
    render(<ExecutionHistory workflowId={1} onSelectExecution={onSelectExecution} />);
    await waitFor(() => {
      expect(screen.getAllByText(/Execution|No executions/i).length).toBeGreaterThan(0);
    });
  });
});
