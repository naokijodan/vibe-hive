// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubworkflowNodeSettings } from './SubworkflowNodeSettings';

vi.mock('../../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({
    workflows: [
      { id: 1, name: 'Sub WF', description: 'A sub workflow' },
      { id: 2, name: 'Other WF', description: 'Another one' },
    ],
    loadWorkflows: vi.fn(),
  }),
}));

describe('SubworkflowNodeSettings', () => {
  it('renders workflow selector', () => {
    render(<SubworkflowNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Target Workflow')).toBeDefined();
    expect(screen.getByText('Select workflow...')).toBeDefined();
  });

  it('shows available workflows in dropdown', () => {
    render(<SubworkflowNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Sub WF')).toBeDefined();
    expect(screen.getByText('Other WF')).toBeDefined();
  });

  it('renders input mapping section', () => {
    render(<SubworkflowNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Input Mapping')).toBeDefined();
    expect(screen.getByText('No input mappings')).toBeDefined();
  });

  it('renders output mapping section', () => {
    render(<SubworkflowNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Output Mapping')).toBeDefined();
    expect(screen.getByText('No output mappings')).toBeDefined();
  });

  it('calls onChange when workflow selected', () => {
    const onChange = vi.fn();
    render(<SubworkflowNodeSettings data={{} as any} onChange={onChange} />);
    const select = screen.getAllByRole('combobox')[0];
    fireEvent.change(select, { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      subworkflowConfig: expect.objectContaining({ workflowId: 1 }),
    }));
  });

  it('adds input mapping entry when + Add clicked', () => {
    render(<SubworkflowNodeSettings data={{} as any} onChange={vi.fn()} />);
    const addButtons = screen.getAllByText('+ Add');
    fireEvent.click(addButtons[0]);
    expect(screen.getByPlaceholderText('Child input field')).toBeDefined();
    expect(screen.getByPlaceholderText('Parent field')).toBeDefined();
  });

  it('renders with existing subworkflow config', () => {
    const data = {
      subworkflowConfig: {
        workflowId: 1,
        inputMapping: { key1: 'val1' },
        outputMapping: { out1: 'res1' },
      },
    };
    render(<SubworkflowNodeSettings data={data as any} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('key1')).toBeDefined();
    expect(screen.getByDisplayValue('val1')).toBeDefined();
    expect(screen.getByDisplayValue('out1')).toBeDefined();
    expect(screen.getByDisplayValue('res1')).toBeDefined();
  });
});
