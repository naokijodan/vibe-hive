// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExecutionDetails } from './ExecutionDetails';

vi.mock('./ExecutionLogViewer', () => ({
  ExecutionLogViewer: () => <div>ExecutionLogViewer</div>,
}));

describe('ExecutionDetails', () => {
  it('shows placeholder when no execution', () => {
    render(<ExecutionDetails execution={null} />);
    expect(screen.getByText(/Select an execution/i)).toBeDefined();
  });

  it('renders execution info', () => {
    const execution = {
      id: 1, workflowId: 1, status: 'success', startedAt: Date.now(), completedAt: Date.now(),
      executionData: { node1: { status: 'completed' } },
    } as any;
    render(<ExecutionDetails execution={execution} />);
    expect(screen.getByText('ExecutionLogViewer')).toBeDefined();
  });

  it('renders success status', () => {
    const execution = {
      id: 1, workflowId: 1, status: 'success', startedAt: Date.now(), completedAt: Date.now(),
      executionData: { node1: { status: 'success' } },
    } as any;
    const { container } = render(<ExecutionDetails execution={execution} />);
    expect(container.querySelector('.text-green-500')).toBeDefined();
  });

  it('renders failed status', () => {
    const execution = {
      id: 1, workflowId: 1, status: 'failed', startedAt: Date.now(), completedAt: Date.now(),
      executionData: { node1: { status: 'failed', error: 'Something went wrong' } },
    } as any;
    const { container } = render(<ExecutionDetails execution={execution} />);
    expect(container.querySelector('.text-red-500')).toBeDefined();
  });

  it('renders skipped status', () => {
    const execution = {
      id: 1, workflowId: 1, status: 'completed', startedAt: Date.now(), completedAt: Date.now(),
      executionData: { node1: { status: 'skipped' } },
    } as any;
    const { container } = render(<ExecutionDetails execution={execution} />);
    expect(container.querySelector('.text-yellow-500')).toBeDefined();
  });

  it('renders with empty executionData', () => {
    const execution = {
      id: 1, workflowId: 1, status: 'running', startedAt: Date.now(),
    } as any;
    render(<ExecutionDetails execution={execution} />);
    expect(screen.getByText('ExecutionLogViewer')).toBeDefined();
  });

  it('shows details instruction text', () => {
    render(<ExecutionDetails execution={null} />);
    expect(screen.getByText(/Select an execution to view details/i)).toBeDefined();
  });
});
