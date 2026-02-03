// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MergeNode } from './MergeNode';

vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position, id, className }: any) => (
    <div data-testid={`handle-${type}-${id || 'default'}`} className={className} />
  ),
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

const mockNodeProps = {
  id: 'node-1',
  data: { label: 'Merge Results' },
  selected: false,
  type: 'merge',
  zIndex: 1,
  isConnectable: true,
  xPos: 0,
  yPos: 0,
  dragging: false,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
};

describe('MergeNode', () => {
  it('renders merge label', () => {
    render(<MergeNode {...mockNodeProps as any} />);
    expect(screen.getByText('Merge Results')).toBeDefined();
  });

  it('renders node type header', () => {
    render(<MergeNode {...mockNodeProps as any} />);
    expect(screen.getByText('Merge')).toBeDefined();
  });

  it('renders merge icon', () => {
    render(<MergeNode {...mockNodeProps as any} />);
    expect(screen.getByText('🔗')).toBeDefined();
  });

  it('renders description text', () => {
    render(<MergeNode {...mockNodeProps as any} />);
    expect(screen.getByText('Combines multiple inputs')).toBeDefined();
  });

  it('renders three target handles', () => {
    render(<MergeNode {...mockNodeProps as any} />);
    expect(screen.getByTestId('handle-target-input-1')).toBeDefined();
    expect(screen.getByTestId('handle-target-input-2')).toBeDefined();
    expect(screen.getByTestId('handle-target-input-3')).toBeDefined();
  });

  it('renders source handle', () => {
    render(<MergeNode {...mockNodeProps as any} />);
    expect(screen.getByTestId('handle-source-default')).toBeDefined();
  });

  it('applies selected styles when selected', () => {
    const props = { ...mockNodeProps, selected: true };
    const { container } = render(<MergeNode {...props as any} />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain('border-cyan-500');
  });

  it('applies default styles when not selected', () => {
    const { container } = render(<MergeNode {...mockNodeProps as any} />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain('border-gray-600');
  });
});
