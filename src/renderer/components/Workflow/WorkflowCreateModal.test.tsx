// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../stores/sessionStore', () => ({
  useSessionStore: () => ({
    activeSessionId: '1',
  }),
}));

vi.mock('../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({
    createWorkflow: vi.fn().mockResolvedValue({ id: 1 }),
  }),
}));

import { WorkflowCreateModal } from './WorkflowCreateModal';

describe('WorkflowCreateModal', () => {
  const mockOnClose = vi.fn();
  const mockOnCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    const { container } = render(
      <WorkflowCreateModal isOpen={false} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when open', () => {
    render(
      <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
    );
    expect(screen.getByText('Create New Workflow')).toBeTruthy();
  });

  it('renders form fields', () => {
    render(
      <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
    );
    expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
  });

  it('renders buttons', () => {
    render(
      <WorkflowCreateModal isOpen={true} onClose={mockOnClose} />
    );
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });
});
