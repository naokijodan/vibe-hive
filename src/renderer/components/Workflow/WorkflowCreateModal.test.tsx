// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorkflowCreateModal } from './WorkflowCreateModal';

vi.mock('../../stores/sessionStore', () => ({
  useSessionStore: () => ({ activeSessionId: 's1' }),
}));

vi.mock('../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({ createWorkflow: vi.fn() }),
}));

describe('WorkflowCreateModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(<WorkflowCreateModal isOpen={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders form when open', () => {
    render(<WorkflowCreateModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getAllByText(/Create/i).length).toBeGreaterThan(0);
  });
});
