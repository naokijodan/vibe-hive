// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockLoadExecutions } = vi.hoisted(() => ({
  mockLoadExecutions: vi.fn(),
}));

vi.mock('../../stores/workflowStore', () => ({
  useWorkflowStore: (selector: (state: { loadExecutions: typeof mockLoadExecutions }) => typeof mockLoadExecutions) =>
    selector({ loadExecutions: mockLoadExecutions }),
}));

import { ExecutionHistory } from './ExecutionHistory';
import type { WorkflowExecution } from '../../../shared/types/workflow';

const createMockExecution = (overrides: Partial<WorkflowExecution> = {}): WorkflowExecution => ({
  id: 1,
  workflowId: 1,
  status: 'success',
  startedAt: Date.now() - 60000, // 1 minute ago
  completedAt: Date.now(),
  nodeResults: {},
  ...overrides,
});

describe('ExecutionHistory', () => {
  const mockOnSelectExecution = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadExecutions.mockResolvedValue([]);
  });

  describe('no workflow selected', () => {
    it('shows prompt to select workflow', () => {
      render(
        <ExecutionHistory workflowId={null} onSelectExecution={mockOnSelectExecution} />
      );
      expect(screen.getByText('Select a workflow to view execution history')).toBeTruthy();
    });

    it('does not call loadExecutions', () => {
      render(
        <ExecutionHistory workflowId={null} onSelectExecution={mockOnSelectExecution} />
      );
      expect(mockLoadExecutions).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator', async () => {
      let resolveLoad: (value: WorkflowExecution[]) => void;
      mockLoadExecutions.mockReturnValue(
        new Promise((resolve) => {
          resolveLoad = resolve;
        })
      );

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      expect(screen.getByText('Loading execution history...')).toBeTruthy();

      resolveLoad!([]);

      await waitFor(() => {
        expect(screen.queryByText('Loading execution history...')).toBeNull();
      });
    });
  });

  describe('empty state', () => {
    it('shows empty message when no executions', async () => {
      mockLoadExecutions.mockResolvedValue([]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText('No execution history yet')).toBeTruthy();
      });
    });

    it('shows hint to execute workflow', async () => {
      mockLoadExecutions.mockResolvedValue([]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText('Execute the workflow to see results here')).toBeTruthy();
      });
    });
  });

  describe('execution list', () => {
    it('renders execution items', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ id: 1 }),
        createMockExecution({ id: 2 }),
      ]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText('Execution #1')).toBeTruthy();
        expect(screen.getByText('Execution #2')).toBeTruthy();
      });
    });

    it('renders header', async () => {
      mockLoadExecutions.mockResolvedValue([createMockExecution()]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText('Execution History')).toBeTruthy();
      });
    });

    it('renders refresh button', async () => {
      mockLoadExecutions.mockResolvedValue([createMockExecution()]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeTruthy();
      });
    });

    it('calls loadExecutions on refresh', async () => {
      mockLoadExecutions.mockResolvedValue([createMockExecution()]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeTruthy();
      });

      // Initial load
      expect(mockLoadExecutions).toHaveBeenCalledWith(1);
      mockLoadExecutions.mockClear();

      fireEvent.click(screen.getByText('Refresh'));

      await waitFor(() => {
        expect(mockLoadExecutions).toHaveBeenCalledWith(1);
      });
    });

    it('calls onSelectExecution when execution clicked', async () => {
      const execution = createMockExecution({ id: 1 });
      mockLoadExecutions.mockResolvedValue([execution]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText('Execution #1')).toBeTruthy();
      });

      fireEvent.click(screen.getByText('Execution #1'));

      expect(mockOnSelectExecution).toHaveBeenCalledWith(execution);
    });

    it('highlights selected execution', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ id: 1 }),
        createMockExecution({ id: 2 }),
      ]);

      const { container } = render(
        <ExecutionHistory
          workflowId={1}
          onSelectExecution={mockOnSelectExecution}
          selectedExecutionId={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Execution #1')).toBeTruthy();
      });

      expect(container.innerHTML).toContain('border-blue-500');
    });
  });

  describe('status badges', () => {
    it('shows success status', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ status: 'success' }),
      ]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText('success')).toBeTruthy();
      });
    });

    it('shows failed status', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ status: 'failed' }),
      ]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText('failed')).toBeTruthy();
      });
    });

    it('shows running status', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ status: 'running', completedAt: undefined }),
      ]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText('running')).toBeTruthy();
      });
    });

    it('shows cancelled status', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ status: 'cancelled' }),
      ]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText('cancelled')).toBeTruthy();
      });
    });
  });

  describe('status colors', () => {
    it('applies green color for success', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ status: 'success' }),
      ]);

      const { container } = render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('text-green-400');
      });
    });

    it('applies red color for failed', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ status: 'failed' }),
      ]);

      const { container } = render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('text-red-400');
      });
    });

    it('applies blue color for running', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ status: 'running' }),
      ]);

      const { container } = render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('text-blue-400');
      });
    });

    it('applies gray color for cancelled', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ status: 'cancelled' }),
      ]);

      const { container } = render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('text-gray-400');
      });
    });
  });

  describe('duration display', () => {
    it('shows Running... for incomplete executions', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({
          status: 'running',
          startedAt: Date.now() - 30000,
          completedAt: undefined,
        }),
      ]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Duration: Running\.\.\./)).toBeTruthy();
      });
    });

    it('shows duration in seconds for short executions', async () => {
      const startedAt = Date.now() - 30000;
      const completedAt = Date.now() - 15000; // 15 seconds duration
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ startedAt, completedAt }),
      ]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Duration: 15s/)).toBeTruthy();
      });
    });

    it('shows duration in minutes for longer executions', async () => {
      const startedAt = Date.now() - 120000;
      const completedAt = Date.now() - 30000; // 90 seconds = 1m 30s
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ startedAt, completedAt }),
      ]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Duration: 1m 30s/)).toBeTruthy();
      });
    });

    it('shows duration in hours for very long executions', async () => {
      const startedAt = Date.now() - 7200000; // 2 hours ago
      const completedAt = Date.now() - 3600000; // 1 hour duration
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ startedAt, completedAt }),
      ]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Duration: 1h 0m/)).toBeTruthy();
      });
    });
  });

  describe('time display', () => {
    it('shows seconds ago for recent executions', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({
          startedAt: Date.now() - 30000, // 30 seconds ago
        }),
      ]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Started 30s ago/)).toBeTruthy();
      });
    });

    it('shows minutes ago for executions few minutes ago', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({
          startedAt: Date.now() - 180000, // 3 minutes ago
        }),
      ]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Started 3m ago/)).toBeTruthy();
      });
    });

    it('shows hours ago for executions hours ago', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({
          startedAt: Date.now() - 7200000, // 2 hours ago
        }),
      ]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Started 2h ago/)).toBeTruthy();
      });
    });

    it('shows days ago for executions days ago', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({
          startedAt: Date.now() - 86400000 * 3, // 3 days ago
        }),
      ]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Started 3d ago/)).toBeTruthy();
      });
    });
  });

  describe('error display', () => {
    it('shows error message when execution has error', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({
          status: 'failed',
          error: 'Something went wrong',
        }),
      ]);

      render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeTruthy();
      });
    });

    it('does not show error box when no error', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ status: 'success' }),
      ]);

      const { container } = render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText('success')).toBeTruthy();
      });

      expect(container.innerHTML).not.toContain('bg-red-900/20');
    });
  });

  describe('workflow change', () => {
    it('clears executions when workflowId becomes null', async () => {
      mockLoadExecutions.mockResolvedValue([createMockExecution()]);

      const { rerender } = render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText('Execution #1')).toBeTruthy();
      });

      rerender(
        <ExecutionHistory workflowId={null} onSelectExecution={mockOnSelectExecution} />
      );

      expect(screen.getByText('Select a workflow to view execution history')).toBeTruthy();
    });

    it('loads new executions when workflowId changes', async () => {
      mockLoadExecutions.mockResolvedValue([createMockExecution({ id: 1 })]);

      const { rerender } = render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(mockLoadExecutions).toHaveBeenCalledWith(1);
      });

      mockLoadExecutions.mockClear();
      mockLoadExecutions.mockResolvedValue([createMockExecution({ id: 2 })]);

      rerender(
        <ExecutionHistory workflowId={2} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(mockLoadExecutions).toHaveBeenCalledWith(2);
      });
    });
  });

  describe('status icons', () => {
    it('renders running icon with animation', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ status: 'running' }),
      ]);

      const { container } = render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('animate-spin');
      });
    });

    it('renders success icon (green checkmark)', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ status: 'success' }),
      ]);

      const { container } = render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('text-green-500');
        // Check for SVG element
        const svgs = container.querySelectorAll('svg');
        expect(svgs.length).toBeGreaterThan(0);
      });
    });

    it('renders failed icon (red X)', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ status: 'failed' }),
      ]);

      const { container } = render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(container.innerHTML).toContain('text-red-500');
      });
    });

    it('renders cancelled icon (gray dash)', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ status: 'cancelled' }),
      ]);

      const { container } = render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        // Check for the grey status icon
        const statusIcons = container.querySelectorAll('.text-gray-500');
        expect(statusIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('unknown status', () => {
    it('handles unknown status gracefully', async () => {
      mockLoadExecutions.mockResolvedValue([
        createMockExecution({ status: 'unknown' as any }),
      ]);

      const { container } = render(
        <ExecutionHistory workflowId={1} onSelectExecution={mockOnSelectExecution} />
      );

      await waitFor(() => {
        expect(screen.getByText('unknown')).toBeTruthy();
        // Should use default gray color
        expect(container.innerHTML).toContain('text-gray-400');
      });
    });
  });
});
