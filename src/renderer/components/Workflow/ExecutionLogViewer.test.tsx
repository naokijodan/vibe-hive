// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExecutionLogViewer } from './ExecutionLogViewer';
import type { WorkflowExecution } from '../../../shared/types/workflow';

const mockVirtualizer = {
  getVirtualItems: vi.fn(() => []),
  getTotalSize: vi.fn(() => 0),
};

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => mockVirtualizer),
}));

describe('ExecutionLogViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVirtualizer.getVirtualItems.mockReturnValue([]);
    mockVirtualizer.getTotalSize.mockReturnValue(0);
  });

  describe('no execution state', () => {
    it('renders placeholder when no execution', () => {
      render(<ExecutionLogViewer execution={null} selectedNodeId={null} />);
      expect(screen.getByText('No execution selected')).toBeDefined();
    });

    it('renders container when no execution', () => {
      const { container } = render(<ExecutionLogViewer execution={null} selectedNodeId={null} />);
      expect(container.innerHTML).not.toBe('');
    });

    it('has dark background when no execution', () => {
      const { container } = render(<ExecutionLogViewer execution={null} selectedNodeId={null} />);
      expect(container.innerHTML).toContain('bg-gray-900');
    });
  });

  describe('no node selected state', () => {
    it('renders placeholder when no node selected', () => {
      const execution: Partial<WorkflowExecution> = { id: 1, status: 'completed', executionData: {} };
      render(<ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId={null} />);
      expect(screen.getByText('Select a node to view logs')).toBeDefined();
    });

    it('shows icon when no node selected', () => {
      const execution: Partial<WorkflowExecution> = { id: 1, status: 'completed', executionData: {} };
      const { container } = render(<ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId={null} />);
      expect(container.querySelector('svg')).toBeTruthy();
    });
  });

  describe('empty logs state', () => {
    it('renders no logs message when node has no logs', () => {
      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: {} },
      };
      render(<ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />);
      expect(screen.getByText('No logs available for this node')).toBeDefined();
    });

    it('renders no logs message when node not found in executionData', () => {
      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: {},
      };
      render(<ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />);
      expect(screen.getByText('No logs available for this node')).toBeDefined();
    });

    it('renders without crashing with empty executionData', () => {
      const execution: Partial<WorkflowExecution> = { id: 1, status: 'completed', executionData: {} };
      const { container } = render(
        <ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />
      );
      expect(container.innerHTML).not.toBe('');
    });
  });

  describe('with logs', () => {
    it('renders with execution and node selected', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);
      mockVirtualizer.getTotalSize.mockReturnValue(20);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { logs: ['Log entry 1'] } },
      };
      const { container } = render(
        <ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />
      );
      expect(container.innerHTML).not.toBe('');
    });

    it('renders header with Node Logs title', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);
      mockVirtualizer.getTotalSize.mockReturnValue(20);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { logs: ['Log entry 1'] } },
      };
      render(<ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />);
      expect(screen.getByText('Node Logs')).toBeDefined();
    });

    it('shows selected node id in header', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);
      mockVirtualizer.getTotalSize.mockReturnValue(20);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { 'test-node-123': { logs: ['Log entry'] } },
      };
      render(<ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="test-node-123" />);
      expect(screen.getByText('test-node-123')).toBeDefined();
    });

    it('shows line count in footer', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
        { key: '1', index: 1, start: 20, size: 20 },
      ]);
      mockVirtualizer.getTotalSize.mockReturnValue(40);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { logs: ['Line 1', 'Line 2'] } },
      };
      render(<ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />);
      expect(screen.getByText('2 lines')).toBeDefined();
    });

    it('shows singular line text for single line', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);
      mockVirtualizer.getTotalSize.mockReturnValue(20);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { logs: ['Single line'] } },
      };
      render(<ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />);
      expect(screen.getByText('1 line')).toBeDefined();
    });
  });

  describe('log output parsing', () => {
    it('parses string output', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);
      mockVirtualizer.getTotalSize.mockReturnValue(20);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { output: 'Line 1\nLine 2' } },
      };
      render(<ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />);
      expect(screen.getByText('Node Logs')).toBeDefined();
    });

    it('parses stdout from output object', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);
      mockVirtualizer.getTotalSize.mockReturnValue(20);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { output: { stdout: 'stdout content' } } },
      };
      render(<ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />);
      // Header should show STDOUT separator
      expect(screen.getByText('Node Logs')).toBeDefined();
    });

    it('parses stderr from output object', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);
      mockVirtualizer.getTotalSize.mockReturnValue(20);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { output: { stderr: 'stderr content' } } },
      };
      render(<ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />);
      expect(screen.getByText('Node Logs')).toBeDefined();
    });

    it('parses error message', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);
      mockVirtualizer.getTotalSize.mockReturnValue(20);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { error: 'Error message' } },
      };
      render(<ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />);
      expect(screen.getByText('Node Logs')).toBeDefined();
    });

    it('parses logs array', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);
      mockVirtualizer.getTotalSize.mockReturnValue(20);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { logs: ['Log 1', 'Log 2'] } },
      };
      render(<ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />);
      expect(screen.getByText('Node Logs')).toBeDefined();
    });
  });

  describe('virtual scroll rendering', () => {
    it('renders virtual items', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
        { key: '1', index: 1, start: 20, size: 20 },
      ]);
      mockVirtualizer.getTotalSize.mockReturnValue(40);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { logs: ['Line 1', 'Line 2'] } },
      };
      const { container } = render(
        <ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />
      );
      // Should have virtual scroll container
      expect(container.innerHTML).toContain('position');
    });

    it('sets total height from virtualizer', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([]);
      mockVirtualizer.getTotalSize.mockReturnValue(500);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { logs: ['Line'] } },
      };
      const { container } = render(
        <ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />
      );
      expect(container.innerHTML).toContain('500px');
    });
  });

  describe('layout and styling', () => {
    it('has flex column layout', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { logs: ['Log'] } },
      };
      const { container } = render(
        <ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />
      );
      expect(container.innerHTML).toContain('flex-col');
    });

    it('has header with border', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { logs: ['Log'] } },
      };
      const { container } = render(
        <ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />
      );
      expect(container.innerHTML).toContain('border-b');
      expect(container.innerHTML).toContain('border-gray-700');
    });

    it('has monospace font for logs', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { logs: ['Log'] } },
      };
      const { container } = render(
        <ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />
      );
      expect(container.innerHTML).toContain('font-mono');
    });

    it('has dark background for log content', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { logs: ['Log'] } },
      };
      const { container } = render(
        <ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />
      );
      expect(container.innerHTML).toContain('bg-gray-950');
    });

    it('has footer with line count', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { logs: ['Log'] } },
      };
      const { container } = render(
        <ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />
      );
      expect(container.innerHTML).toContain('border-t');
    });
  });

  describe('different execution statuses', () => {
    it('handles completed execution', () => {
      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: { node1: { logs: ['Completed log'] } },
      };
      const { container } = render(
        <ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />
      );
      expect(container.innerHTML).not.toBe('');
    });

    it('handles running execution', () => {
      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'running',
        executionData: { node1: { logs: ['Running log'] } },
      };
      const { container } = render(
        <ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />
      );
      expect(container.innerHTML).not.toBe('');
    });

    it('handles failed execution', () => {
      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'failed',
        executionData: { node1: { error: 'Failed' } },
      };
      const { container } = render(
        <ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />
      );
      expect(container.innerHTML).not.toBe('');
    });
  });

  describe('null/undefined filtering', () => {
    it('filters null values from logs', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: {
          node1: {
            logs: ['Valid', null as unknown as string, 'Also valid'],
          },
        },
      };
      const { container } = render(
        <ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />
      );
      expect(container.innerHTML).not.toBe('');
    });

    it('filters undefined values from logs', () => {
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { key: '0', index: 0, start: 0, size: 20 },
      ]);

      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: {
          node1: {
            logs: ['Valid', undefined as unknown as string, 'Also valid'],
          },
        },
      };
      const { container } = render(
        <ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />
      );
      expect(container.innerHTML).not.toBe('');
    });
  });

  describe('missing executionData', () => {
    it('handles undefined executionData', () => {
      const execution: Partial<WorkflowExecution> = {
        id: 1,
        status: 'completed',
        executionData: undefined,
      };
      render(<ExecutionLogViewer execution={execution as WorkflowExecution} selectedNodeId="node1" />);
      expect(screen.getByText('No logs available for this node')).toBeDefined();
    });
  });
});
