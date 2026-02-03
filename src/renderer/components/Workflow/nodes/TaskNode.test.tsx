// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TaskNode } from './TaskNode';

vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position, id, className }: any) => (
    <div data-testid={`handle-${type}-${id || 'default'}`} className={className} />
  ),
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

const mockNodeProps = {
  id: 'node-1',
  data: { label: 'Test Task', taskId: 'task-123' },
  selected: false,
  type: 'task',
  zIndex: 1,
  isConnectable: true,
  xPos: 0,
  yPos: 0,
  dragging: false,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
};

describe('TaskNode', () => {
  it('renders task label', () => {
    render(<TaskNode {...mockNodeProps as any} />);
    expect(screen.getByText('Test Task')).toBeDefined();
  });

  it('renders node type header', () => {
    render(<TaskNode {...mockNodeProps as any} />);
    expect(screen.getByText('Task')).toBeDefined();
  });

  it('renders task ID when provided', () => {
    render(<TaskNode {...mockNodeProps as any} />);
    expect(screen.getByText('Task ID: task-123')).toBeDefined();
  });

  it('does not render task ID when not provided', () => {
    const props = { ...mockNodeProps, data: { label: 'No ID' } };
    render(<TaskNode {...props as any} />);
    expect(screen.queryByText(/Task ID:/)).toBeNull();
  });

  it('renders target and source handles', () => {
    render(<TaskNode {...mockNodeProps as any} />);
    expect(screen.getByTestId('handle-target-default')).toBeDefined();
    expect(screen.getByTestId('handle-source-default')).toBeDefined();
  });

  it('applies selected styles when selected', () => {
    const props = { ...mockNodeProps, selected: true };
    const { container } = render(<TaskNode {...props as any} />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain('border-blue-500');
  });

  it('applies default styles when not selected', () => {
    const { container } = render(<TaskNode {...mockNodeProps as any} />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain('border-gray-600');
  });
});
