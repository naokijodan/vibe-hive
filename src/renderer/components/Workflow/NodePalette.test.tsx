// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NodePalette } from './NodePalette';

describe('NodePalette', () => {
  const mockOnAddNode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders node palette header', () => {
    render(<NodePalette onAddNode={mockOnAddNode} />);
    expect(screen.getByText('Node Palette')).toBeTruthy();
  });

  it('renders all node types', () => {
    render(<NodePalette onAddNode={mockOnAddNode} />);
    expect(screen.getByText('Trigger')).toBeTruthy();
    expect(screen.getByText('Task')).toBeTruthy();
    expect(screen.getByText('Conditional')).toBeTruthy();
    expect(screen.getByText('Delay')).toBeTruthy();
    expect(screen.getByText('Notification')).toBeTruthy();
    expect(screen.getByText('Merge')).toBeTruthy();
    expect(screen.getByText('Loop')).toBeTruthy();
    expect(screen.getByText('Subworkflow')).toBeTruthy();
    expect(screen.getByText('AI Agent')).toBeTruthy();
  });

  it('renders tips section', () => {
    render(<NodePalette onAddNode={mockOnAddNode} />);
    expect(screen.getByText('Tips')).toBeTruthy();
  });

  it('calls onAddNode when node clicked', () => {
    render(<NodePalette onAddNode={mockOnAddNode} />);
    fireEvent.click(screen.getByText('Trigger'));
    expect(mockOnAddNode).toHaveBeenCalledWith('trigger');
  });

  it('handles drag start', () => {
    render(<NodePalette onAddNode={mockOnAddNode} />);
    const triggerNode = screen.getByText('Trigger').closest('[draggable="true"]');
    const dataTransfer = {
      setData: vi.fn(),
      effectAllowed: '',
    };
    fireEvent.dragStart(triggerNode!, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith('application/reactflow', 'trigger');
  });
});
