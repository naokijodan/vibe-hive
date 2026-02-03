// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoopNode } from './LoopNode';

vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position, id, className }: any) => (
    <div data-testid={`handle-${type}-${id || 'default'}`} className={className} />
  ),
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

const mockNodeProps = {
  id: 'node-1',
  data: {
    label: 'Process Items',
    loopConfig: { type: 'forEach', arrayPath: 'data.items', maxIterations: 50 },
  },
  selected: false,
  type: 'loop',
  zIndex: 1,
  isConnectable: true,
  xPos: 0,
  yPos: 0,
  dragging: false,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
};

describe('LoopNode', () => {
  it('renders loop label', () => {
    render(<LoopNode {...mockNodeProps as any} />);
    expect(screen.getByText('Process Items')).toBeDefined();
  });

  it('renders node type header', () => {
    render(<LoopNode {...mockNodeProps as any} />);
    expect(screen.getByText('Loop')).toBeDefined();
  });

  it('renders loop icon', () => {
    render(<LoopNode {...mockNodeProps as any} />);
    expect(screen.getByText('🔄')).toBeDefined();
  });

  it('shows For Each type label', () => {
    render(<LoopNode {...mockNodeProps as any} />);
    expect(screen.getByText('For Each')).toBeDefined();
  });

  it('shows Count type label', () => {
    const props = {
      ...mockNodeProps,
      data: { label: 'Loop', loopConfig: { type: 'count', count: 10 } },
    };
    render(<LoopNode {...props as any} />);
    expect(screen.getByText('Count')).toBeDefined();
  });

  it('shows While type label', () => {
    const props = {
      ...mockNodeProps,
      data: { label: 'Loop', loopConfig: { type: 'while' } },
    };
    render(<LoopNode {...props as any} />);
    expect(screen.getByText('While')).toBeDefined();
  });

  it('shows forEach details with array path', () => {
    render(<LoopNode {...mockNodeProps as any} />);
    expect(screen.getByText('data.items')).toBeDefined();
  });

  it('shows count details', () => {
    const props = {
      ...mockNodeProps,
      data: { label: 'Loop', loopConfig: { type: 'count', count: 5 } },
    };
    render(<LoopNode {...props as any} />);
    expect(screen.getByText('5 times')).toBeDefined();
  });

  it('shows Conditional for while type', () => {
    const props = {
      ...mockNodeProps,
      data: { label: 'Loop', loopConfig: { type: 'while' } },
    };
    render(<LoopNode {...props as any} />);
    expect(screen.getByText('Conditional')).toBeDefined();
  });

  it('shows max iterations', () => {
    render(<LoopNode {...mockNodeProps as any} />);
    expect(screen.getByText('Max iterations: 50')).toBeDefined();
  });

  it('uses default max iterations of 100', () => {
    const props = {
      ...mockNodeProps,
      data: { label: 'Loop', loopConfig: { type: 'forEach' } },
    };
    render(<LoopNode {...props as any} />);
    expect(screen.getByText('Max iterations: 100')).toBeDefined();
  });

  it('shows Not configured when no loopConfig', () => {
    const props = { ...mockNodeProps, data: { label: 'Loop' } };
    render(<LoopNode {...props as any} />);
    expect(screen.getByText('Not configured')).toBeDefined();
  });

  it('renders target and source handles', () => {
    render(<LoopNode {...mockNodeProps as any} />);
    expect(screen.getByTestId('handle-target-default')).toBeDefined();
    expect(screen.getByTestId('handle-source-default')).toBeDefined();
  });

  it('applies selected styles when selected', () => {
    const props = { ...mockNodeProps, selected: true };
    const { container } = render(<LoopNode {...props as any} />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain('border-orange-400');
  });
});
