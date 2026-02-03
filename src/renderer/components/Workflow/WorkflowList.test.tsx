// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({
    workflows: [],
    loadWorkflows: vi.fn(),
    deleteWorkflow: vi.fn(),
    executeWorkflow: vi.fn(),
    isExecuting: false,
  }),
}));

import { WorkflowList } from './WorkflowList';

describe('WorkflowList', () => {
  const mockOnSelectWorkflow = vi.fn();
  const mockOnCreateNew = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no workflows', () => {
    render(
      <WorkflowList
        selectedWorkflowId={null}
        onSelectWorkflow={mockOnSelectWorkflow}
        onCreateNew={mockOnCreateNew}
      />
    );
    expect(screen.getByText('No workflows yet')).toBeTruthy();
  });

  it('renders header with workflow count', () => {
    render(
      <WorkflowList
        selectedWorkflowId={null}
        onSelectWorkflow={mockOnSelectWorkflow}
        onCreateNew={mockOnCreateNew}
      />
    );
    expect(screen.getByText('Workflows')).toBeTruthy();
    expect(screen.getByText('0 workflows')).toBeTruthy();
  });

  it('renders New button', () => {
    render(
      <WorkflowList
        selectedWorkflowId={null}
        onSelectWorkflow={mockOnSelectWorkflow}
        onCreateNew={mockOnCreateNew}
      />
    );
    const newButton = screen.getByRole('button', { name: /\+ New/i });
    expect(newButton).toBeTruthy();
  });

  it('calls onCreateNew when New button clicked', () => {
    render(
      <WorkflowList
        selectedWorkflowId={null}
        onSelectWorkflow={mockOnSelectWorkflow}
        onCreateNew={mockOnCreateNew}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /\+ New/i }));
    expect(mockOnCreateNew).toHaveBeenCalled();
  });
});

