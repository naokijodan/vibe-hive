// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NodePalette } from './NodePalette';

describe('NodePalette', () => {
  it('renders all node types', () => {
    render(<NodePalette onAddNode={vi.fn()} />);
    expect(screen.getByText('Node Palette')).toBeDefined();
    expect(screen.getByText('Trigger')).toBeDefined();
    expect(screen.getByText('Task')).toBeDefined();
    expect(screen.getByText('Conditional')).toBeDefined();
    expect(screen.getByText('Delay')).toBeDefined();
    expect(screen.getByText('Notification')).toBeDefined();
    expect(screen.getByText('Merge')).toBeDefined();
    expect(screen.getByText('Loop')).toBeDefined();
    expect(screen.getByText('Subworkflow')).toBeDefined();
    expect(screen.getByText('AI Agent')).toBeDefined();
  });

  it('calls onAddNode when clicked', () => {
    const onAddNode = vi.fn();
    render(<NodePalette onAddNode={onAddNode} />);
    fireEvent.click(screen.getByText('Trigger'));
    expect(onAddNode).toHaveBeenCalledWith('trigger');
  });

  it('renders tips section', () => {
    render(<NodePalette onAddNode={vi.fn()} />);
    expect(screen.getByText('Tips')).toBeDefined();
  });
});
