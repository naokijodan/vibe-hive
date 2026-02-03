// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const {
  mockToastSuccess,
  mockToastError,
  mockLoadWorkflows,
  mockDeleteWorkflow,
  mockExecuteWorkflow,
} = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockLoadWorkflows: vi.fn(),
  mockDeleteWorkflow: vi.fn(),
  mockExecuteWorkflow: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

type Workflow = {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'draft';
  nodes: unknown[];
  updatedAt: number;
};

let mockStoreState = {
  workflows: [] as Workflow[],
  loadWorkflows: mockLoadWorkflows,
  deleteWorkflow: mockDeleteWorkflow,
  executeWorkflow: mockExecuteWorkflow,
  isExecuting: false,
};

vi.mock('../../stores/workflowStore', () => ({
  useWorkflowStore: () => mockStoreState,
}));

import { WorkflowList } from './WorkflowList';

describe('WorkflowList', () => {
  const mockOnSelectWorkflow = vi.fn();
  const mockOnCreateNew = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState = {
      workflows: [],
      loadWorkflows: mockLoadWorkflows,
      deleteWorkflow: mockDeleteWorkflow,
      executeWorkflow: mockExecuteWorkflow,
      isExecuting: false,
    };
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  describe('empty state', () => {
    it('renders empty state when no workflows', () => {
      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByText('No workflows yet')).toBeTruthy();
      expect(screen.getByText('Click "New" to create your first workflow')).toBeTruthy();
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
  });

  describe('New button', () => {
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

  describe('workflow list', () => {
    beforeEach(() => {
      mockStoreState.workflows = [
        {
          id: 1,
          name: 'Test Workflow',
          description: 'Test description',
          status: 'active',
          nodes: [{ id: 'n1' }, { id: 'n2' }],
          updatedAt: Date.now(),
        },
        {
          id: 2,
          name: 'Draft Workflow',
          status: 'draft',
          nodes: [],
          updatedAt: Date.now() - 1000,
        },
        {
          id: 3,
          name: 'Paused Workflow',
          status: 'paused',
          nodes: [{ id: 'n1' }],
          updatedAt: Date.now() - 2000,
        },
      ];
    });

    it('renders workflow names', () => {
      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByText('Test Workflow')).toBeTruthy();
      expect(screen.getByText('Draft Workflow')).toBeTruthy();
      expect(screen.getByText('Paused Workflow')).toBeTruthy();
    });

    it('renders workflow count correctly for multiple workflows', () => {
      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByText('3 workflows')).toBeTruthy();
    });

    it('renders singular workflow count for single workflow', () => {
      mockStoreState.workflows = [
        { id: 1, name: 'Single', status: 'active', nodes: [], updatedAt: Date.now() },
      ];
      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByText('1 workflow')).toBeTruthy();
    });

    it('renders workflow description', () => {
      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByText('Test description')).toBeTruthy();
    });

    it('renders node count', () => {
      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByText('2 nodes')).toBeTruthy();
      expect(screen.getByText('0 nodes')).toBeTruthy();
      expect(screen.getByText('1 nodes')).toBeTruthy();
    });

    it('renders status badges', () => {
      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByText('active')).toBeTruthy();
      expect(screen.getByText('draft')).toBeTruthy();
      expect(screen.getByText('paused')).toBeTruthy();
    });

    it('highlights selected workflow', () => {
      const { container } = render(
        <WorkflowList
          selectedWorkflowId={1}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(container.innerHTML).toContain('border-blue-500');
    });

    it('calls onSelectWorkflow when workflow clicked', () => {
      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );
      fireEvent.click(screen.getByText('Test Workflow'));
      expect(mockOnSelectWorkflow).toHaveBeenCalledWith(mockStoreState.workflows[0]);
    });

    it('loads workflows on mount', () => {
      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(mockLoadWorkflows).toHaveBeenCalled();
    });
  });

  describe('execute workflow', () => {
    beforeEach(() => {
      mockStoreState.workflows = [
        { id: 1, name: 'Test WF', status: 'active', nodes: [], updatedAt: Date.now() },
      ];
    });

    it('executes workflow successfully', async () => {
      mockExecuteWorkflow.mockResolvedValue({ status: 'success' });
      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );

      fireEvent.click(screen.getByText('Execute'));

      await waitFor(() => {
        expect(mockExecuteWorkflow).toHaveBeenCalledWith(1);
        expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining('Test WF'));
      });
    });

    it('handles execution failure', async () => {
      mockExecuteWorkflow.mockResolvedValue({ status: 'failed', error: 'Test error' });
      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );

      fireEvent.click(screen.getByText('Execute'));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('Test error'));
      });
    });

    it('disables Execute button when already executing', () => {
      mockStoreState.isExecuting = true;
      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );

      const executeButton = screen.getByText('Running...');
      expect(executeButton).toHaveProperty('disabled', true);
    });

    it('shows Running state when isExecuting is true', () => {
      mockStoreState.isExecuting = true;
      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByText('Running...')).toBeTruthy();
    });
  });

  describe('delete workflow', () => {
    beforeEach(() => {
      mockStoreState.workflows = [
        { id: 1, name: 'Test WF', status: 'active', nodes: [], updatedAt: Date.now() },
      ];
    });

    it('deletes workflow when confirmed', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockDeleteWorkflow.mockResolvedValue(undefined);

      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Test WF'));
        expect(mockDeleteWorkflow).toHaveBeenCalledWith(1);
      });
    });

    it('does not delete workflow when cancelled', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
        expect(mockDeleteWorkflow).not.toHaveBeenCalled();
      });
    });

    it('shows Deleting state during deletion', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      let resolveDelete: () => void;
      mockDeleteWorkflow.mockReturnValue(new Promise(resolve => {
        resolveDelete = resolve;
      }));

      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(screen.getByText('Deleting...')).toBeTruthy();
      });

      // Resolve deletion
      resolveDelete!();

      await waitFor(() => {
        expect(screen.queryByText('Deleting...')).toBeNull();
      });
    });

    it('stops event propagation on delete click', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockDeleteWorkflow.mockResolvedValue(undefined);

      render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        // onSelectWorkflow should not be called because event propagation is stopped
        expect(mockOnSelectWorkflow).not.toHaveBeenCalled();
      });
    });
  });

  describe('status colors', () => {
    it('applies green color for active status', () => {
      mockStoreState.workflows = [
        { id: 1, name: 'Active WF', status: 'active', nodes: [], updatedAt: Date.now() },
      ];
      const { container } = render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(container.innerHTML).toContain('text-green-400');
    });

    it('applies yellow color for paused status', () => {
      mockStoreState.workflows = [
        { id: 1, name: 'Paused WF', status: 'paused', nodes: [], updatedAt: Date.now() },
      ];
      const { container } = render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(container.innerHTML).toContain('text-yellow-400');
    });

    it('applies gray color for draft status', () => {
      mockStoreState.workflows = [
        { id: 1, name: 'Draft WF', status: 'draft', nodes: [], updatedAt: Date.now() },
      ];
      const { container } = render(
        <WorkflowList
          selectedWorkflowId={null}
          onSelectWorkflow={mockOnSelectWorkflow}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(container.innerHTML).toContain('text-gray-400');
    });
  });
});

