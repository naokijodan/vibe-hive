// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SubworkflowNode } from './SubworkflowNode';

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom' },
}));

vi.mock('../../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({
    workflows: [],
    loadWorkflows: vi.fn(),
  }),
}));

describe('SubworkflowNode', () => {
  it('renders not configured when no workflow selected', () => {
    render(<SubworkflowNode data={{ label: 'Sub' } as any} selected={false} id="n1" type="subworkflow" />);
    expect(screen.getByText('Not configured')).toBeDefined();
    expect(screen.getByText('Sub')).toBeDefined();
  });

  it('renders Subworkflow label', () => {
    render(<SubworkflowNode data={{ label: 'My Sub' } as any} selected={false} id="n1" type="subworkflow" />);
    expect(screen.getByText('Subworkflow')).toBeDefined();
  });
});
