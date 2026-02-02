// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SubworkflowNodeSettings } from './SubworkflowNodeSettings';

vi.mock('../../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({
    workflows: [{ id: 1, name: 'Sub WF' }],
    loadWorkflows: vi.fn(),
  }),
}));

describe('SubworkflowNodeSettings', () => {
  it('renders workflow selector', () => {
    render(<SubworkflowNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getAllByText(/Workflow|Subworkflow/i).length).toBeGreaterThan(0);
  });
});
