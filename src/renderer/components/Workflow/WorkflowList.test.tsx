// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorkflowList } from './WorkflowList';

const mockWorkflows = [
  { id: 1, name: 'WF 1', description: 'Desc', status: 'active', nodes: [{}, {}], edges: [], updatedAt: Date.now(), createdAt: Date.now() },
];

vi.mock('../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({
    workflows: mockWorkflows,
    loadWorkflows: vi.fn(),
    deleteWorkflow: vi.fn(),
    executeWorkflow: vi.fn(),
    isExecuting: false,
  }),
}));

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

describe('WorkflowList', () => {
  it('renders workflows header', () => {
    render(<WorkflowList selectedWorkflowId={null} onSelectWorkflow={vi.fn()} onCreateNew={vi.fn()} />);
    expect(screen.getByText('Workflows')).toBeDefined();
    expect(screen.getByText('+ New')).toBeDefined();
  });

  it('renders workflow items', () => {
    render(<WorkflowList selectedWorkflowId={null} onSelectWorkflow={vi.fn()} onCreateNew={vi.fn()} />);
    expect(screen.getByText('WF 1')).toBeDefined();
    expect(screen.getByText('active')).toBeDefined();
    expect(screen.getByText('2 nodes')).toBeDefined();
  });

  it('shows execute and delete buttons', () => {
    render(<WorkflowList selectedWorkflowId={null} onSelectWorkflow={vi.fn()} onCreateNew={vi.fn()} />);
    expect(screen.getByText('Execute')).toBeDefined();
    expect(screen.getByText('Delete')).toBeDefined();
  });
});
