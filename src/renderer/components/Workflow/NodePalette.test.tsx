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

  it('calls onAddNode with task type', () => {
    const onAddNode = vi.fn();
    render(<NodePalette onAddNode={onAddNode} />);
    fireEvent.click(screen.getByText('Task'));
    expect(onAddNode).toHaveBeenCalledWith('task');
  });

  it('calls onAddNode with conditional type', () => {
    const onAddNode = vi.fn();
    render(<NodePalette onAddNode={onAddNode} />);
    fireEvent.click(screen.getByText('Conditional'));
    expect(onAddNode).toHaveBeenCalledWith('conditional');
  });

  it('calls onAddNode with delay type', () => {
    const onAddNode = vi.fn();
    render(<NodePalette onAddNode={onAddNode} />);
    fireEvent.click(screen.getByText('Delay'));
    expect(onAddNode).toHaveBeenCalledWith('delay');
  });

  it('calls onAddNode with notification type', () => {
    const onAddNode = vi.fn();
    render(<NodePalette onAddNode={onAddNode} />);
    fireEvent.click(screen.getByText('Notification'));
    expect(onAddNode).toHaveBeenCalledWith('notification');
  });

  it('calls onAddNode with loop type', () => {
    const onAddNode = vi.fn();
    render(<NodePalette onAddNode={onAddNode} />);
    fireEvent.click(screen.getByText('Loop'));
    expect(onAddNode).toHaveBeenCalledWith('loop');
  });

  it('calls onAddNode with subworkflow type', () => {
    const onAddNode = vi.fn();
    render(<NodePalette onAddNode={onAddNode} />);
    fireEvent.click(screen.getByText('Subworkflow'));
    expect(onAddNode).toHaveBeenCalledWith('subworkflow');
  });

  it('calls onAddNode with agent type', () => {
    const onAddNode = vi.fn();
    render(<NodePalette onAddNode={onAddNode} />);
    fireEvent.click(screen.getByText('AI Agent'));
    expect(onAddNode).toHaveBeenCalledWith('agent');
  });
});
