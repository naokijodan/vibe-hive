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

  it('shows workflow settings header', () => {
    render(<WorkflowSettingsModal isOpen={true} onClose={vi.fn()} workflow={mockWorkflow as any} />);
    expect(screen.getByText(/Workflow Settings|ワークフロー設定/i)).toBeDefined();
  });

  it('shows description field', () => {
    render(<WorkflowSettingsModal isOpen={true} onClose={vi.fn()} workflow={mockWorkflow as any} />);
    expect(screen.getByDisplayValue('Desc')).toBeDefined();
  });

  it('shows save button', () => {
    render(<WorkflowSettingsModal isOpen={true} onClose={vi.fn()} workflow={mockWorkflow as any} />);
    expect(screen.getByText(/Save|保存/i)).toBeDefined();
  });

  it('shows cancel button', () => {
    render(<WorkflowSettingsModal isOpen={true} onClose={vi.fn()} workflow={mockWorkflow as any} />);
    expect(screen.getByText(/Cancel|キャンセル/i)).toBeDefined();
  });

  it('shows close button', () => {
    const { container } = render(<WorkflowSettingsModal isOpen={true} onClose={vi.fn()} workflow={mockWorkflow as any} />);
    const closeButton = container.querySelector('button svg');
    expect(closeButton).toBeDefined();
  });
});
