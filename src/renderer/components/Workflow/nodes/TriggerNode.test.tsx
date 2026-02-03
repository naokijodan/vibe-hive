// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TriggerNode } from './TriggerNode';

vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position, id, className }: any) => (
    <div data-testid={`handle-${type}-${id || 'default'}`} className={className} />
  ),
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

const mockNodeProps = {
  id: 'node-1',
  data: { label: 'Test Trigger', triggerType: 'manual' },
  selected: false,
  type: 'trigger',
  zIndex: 1,
  isConnectable: true,
  xPos: 0,
  yPos: 0,
  dragging: false,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
};

describe('TriggerNode', () => {
  it('renders trigger label', () => {
    render(<TriggerNode {...mockNodeProps as any} />);
    expect(screen.getByText('Test Trigger')).toBeDefined();
  });

  it('renders node type header', () => {
    render(<TriggerNode {...mockNodeProps as any} />);
    expect(screen.getByText('Trigger')).toBeDefined();
  });

  it('renders trigger type when provided', () => {
    render(<TriggerNode {...mockNodeProps as any} />);
    expect(screen.getByText('Type: manual')).toBeDefined();
  });

  it('does not render trigger type when not provided', () => {
    const props = { ...mockNodeProps, data: { label: 'No Type' } };
    render(<TriggerNode {...props as any} />);
    expect(screen.queryByText(/Type:/)).toBeNull();
  });

  it('renders source handle', () => {
    render(<TriggerNode {...mockNodeProps as any} />);
    expect(screen.getByTestId('handle-source-default')).toBeDefined();
  });

  it('applies selected styles when selected', () => {
    const props = { ...mockNodeProps, selected: true };
    const { container } = render(<TriggerNode {...props as any} />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain('border-green-500');
  });

  it('applies default styles when not selected', () => {
    const { container } = render(<TriggerNode {...mockNodeProps as any} />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain('border-gray-600');
  });
});
