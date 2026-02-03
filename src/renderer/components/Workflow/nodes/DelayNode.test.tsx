// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DelayNode } from './DelayNode';

vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position, id, className }: any) => (
    <div data-testid={`handle-${type}-${id || 'default'}`} className={className} />
  ),
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

const mockNodeProps = {
  id: 'node-1',
  data: { label: 'Wait 5 seconds', delayMs: 5000 },
  selected: false,
  type: 'delay',
  zIndex: 1,
  isConnectable: true,
  xPos: 0,
  yPos: 0,
  dragging: false,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
};

describe('DelayNode', () => {
  it('renders delay label', () => {
    render(<DelayNode {...mockNodeProps as any} />);
    expect(screen.getByText('Wait 5 seconds')).toBeDefined();
  });

  it('renders node type header', () => {
    render(<DelayNode {...mockNodeProps as any} />);
    expect(screen.getByText('Delay')).toBeDefined();
  });

  it('formats delay in seconds', () => {
    render(<DelayNode {...mockNodeProps as any} />);
    expect(screen.getByText('5.0s')).toBeDefined();
  });

  it('formats delay in milliseconds for small values', () => {
    const props = { ...mockNodeProps, data: { label: 'Quick', delayMs: 500 } };
    render(<DelayNode {...props as any} />);
    expect(screen.getByText('500ms')).toBeDefined();
  });

  it('formats delay in minutes for large values', () => {
    const props = { ...mockNodeProps, data: { label: 'Long', delayMs: 120000 } };
    render(<DelayNode {...props as any} />);
    expect(screen.getByText('2.0min')).toBeDefined();
  });

  it('uses default delay of 1000ms', () => {
    const props = { ...mockNodeProps, data: { label: 'Default' } };
    render(<DelayNode {...props as any} />);
    expect(screen.getByText('1.0s')).toBeDefined();
  });

  it('renders duration label', () => {
    render(<DelayNode {...mockNodeProps as any} />);
    expect(screen.getByText('Duration:')).toBeDefined();
  });

  it('renders description text', () => {
    render(<DelayNode {...mockNodeProps as any} />);
    expect(screen.getByText('Pauses workflow execution')).toBeDefined();
  });

  it('renders target and source handles', () => {
    render(<DelayNode {...mockNodeProps as any} />);
    expect(screen.getByTestId('handle-target-default')).toBeDefined();
    expect(screen.getByTestId('handle-source-default')).toBeDefined();
  });

  it('applies selected styles when selected', () => {
    const props = { ...mockNodeProps, selected: true };
    const { container } = render(<DelayNode {...props as any} />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain('border-gray-400');
  });
});
