// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorkflowSettingsModal } from './WorkflowSettingsModal';

vi.mock('../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({ updateWorkflow: vi.fn() }),
}));

const mockWorkflow = {
  id: 1, name: 'Test WF', description: 'Desc', status: 'draft' as const,
  nodes: [], edges: [], createdAt: Date.now(), updatedAt: Date.now(),
};

describe('WorkflowSettingsModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <WorkflowSettingsModal isOpen={false} onClose={vi.fn()} workflow={mockWorkflow as any} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders form when open', () => {
    render(<WorkflowSettingsModal isOpen={true} onClose={vi.fn()} workflow={mockWorkflow as any} />);
    expect(screen.getByDisplayValue('Test WF')).toBeDefined();
  });
});
