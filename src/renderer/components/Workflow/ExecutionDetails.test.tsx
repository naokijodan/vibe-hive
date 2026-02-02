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
});
