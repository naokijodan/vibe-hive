// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExecutionLogViewer } from './ExecutionLogViewer';

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
  })),
}));

describe('ExecutionLogViewer', () => {
  it('renders placeholder when no execution', () => {
    render(<ExecutionLogViewer execution={null} selectedNodeId={null} />);
    expect(screen.getAllByText(/ノード|ログ|select|node/i).length).toBeGreaterThan(0);
  });

  it('renders placeholder when no node selected', () => {
    const execution = { id: 1, status: 'completed', executionData: {} };
    render(<ExecutionLogViewer execution={execution as any} selectedNodeId={null} />);
    expect(screen.getAllByText(/ノード|ログ|select|node/i).length).toBeGreaterThan(0);
  });

  it('renders container', () => {
    const { container } = render(<ExecutionLogViewer execution={null} selectedNodeId={null} />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders with execution and node selected', () => {
    const execution = {
      id: 1,
      status: 'completed',
      executionData: { node1: { logs: ['Log entry 1'] } },
    };
    const { container } = render(
      <ExecutionLogViewer execution={execution as any} selectedNodeId="node1" />
    );
    expect(container.innerHTML).not.toBe('');
  });

  it('renders without crashing with empty executionData', () => {
    const execution = { id: 1, status: 'completed', executionData: {} };
    const { container } = render(
      <ExecutionLogViewer execution={execution as any} selectedNodeId="node1" />
    );
    expect(container.innerHTML).not.toBe('');
  });
});
