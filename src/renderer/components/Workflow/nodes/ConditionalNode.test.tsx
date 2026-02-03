// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConditionalNode } from './ConditionalNode';

vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position, id, className }: any) => (
    <div data-testid={`handle-${type}-${id || 'default'}`} className={className} />
  ),
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

const mockNodeProps = {
  id: 'node-1',
  data: {
    label: 'Test Condition',
    condition: { field: 'status', operator: '==', value: 'active' },
  },
  selected: false,
  type: 'conditional',
  zIndex: 1,
  isConnectable: true,
  xPos: 0,
  yPos: 0,
  dragging: false,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
};

describe('ConditionalNode', () => {
  it('renders conditional label', () => {
    render(<ConditionalNode {...mockNodeProps as any} />);
    expect(screen.getByText('Test Condition')).toBeDefined();
  });

  it('renders node type header', () => {
    render(<ConditionalNode {...mockNodeProps as any} />);
    expect(screen.getByText('Conditional')).toBeDefined();
  });

  it('renders condition expression when provided', () => {
    render(<ConditionalNode {...mockNodeProps as any} />);
    expect(screen.getByText('status == active')).toBeDefined();
  });

  it('does not render condition when not provided', () => {
    const props = { ...mockNodeProps, data: { label: 'No Condition' } };
    render(<ConditionalNode {...props as any} />);
    expect(screen.queryByText(/==/)).toBeNull();
  });

  it('renders True and False branch labels', () => {
    render(<ConditionalNode {...mockNodeProps as any} />);
    expect(screen.getByText('True')).toBeDefined();
    expect(screen.getByText('False')).toBeDefined();
  });

  it('renders target handle and two source handles', () => {
    render(<ConditionalNode {...mockNodeProps as any} />);
    expect(screen.getByTestId('handle-target-default')).toBeDefined();
    expect(screen.getByTestId('handle-source-true')).toBeDefined();
    expect(screen.getByTestId('handle-source-false')).toBeDefined();
  });

  it('applies selected styles when selected', () => {
    const props = { ...mockNodeProps, selected: true };
    const { container } = render(<ConditionalNode {...props as any} />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain('border-yellow-500');
  });

  it('applies default styles when not selected', () => {
    const { container } = render(<ConditionalNode {...mockNodeProps as any} />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain('border-gray-600');
  });
});
