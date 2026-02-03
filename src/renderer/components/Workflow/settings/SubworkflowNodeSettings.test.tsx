// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubworkflowNodeSettings } from './SubworkflowNodeSettings';

const { mockLoadWorkflows } = vi.hoisted(() => ({
  mockLoadWorkflows: vi.fn(),
}));

vi.mock('../../../stores/workflowStore', () => ({
  useWorkflowStore: () => ({
    workflows: [
      { id: 1, name: 'Sub WF', description: 'A sub workflow' },
      { id: 2, name: 'Other WF', description: 'Another one' },
      { id: 3, name: 'Third WF' },
    ],
    loadWorkflows: mockLoadWorkflows,
  }),
}));

describe('SubworkflowNodeSettings', () => {
  const defaultOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders workflow selector', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Target Workflow')).toBeDefined();
      expect(screen.getByText('Select workflow...')).toBeDefined();
    });

    it('shows available workflows in dropdown', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Sub WF')).toBeDefined();
      expect(screen.getByText('Other WF')).toBeDefined();
      expect(screen.getByText('Third WF')).toBeDefined();
    });

    it('renders input mapping section', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Input Mapping')).toBeDefined();
      expect(screen.getByText('No input mappings')).toBeDefined();
    });

    it('renders output mapping section', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Output Mapping')).toBeDefined();
      expect(screen.getByText('No output mappings')).toBeDefined();
    });

    it('renders info section', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Subworkflow Execution')).toBeDefined();
    });

    it('shows info bullets', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('• The selected workflow will be executed as a child')).toBeDefined();
      expect(screen.getByText('• Input mapping passes data from parent to child')).toBeDefined();
      expect(screen.getByText('• Output mapping returns data from child to parent')).toBeDefined();
      expect(screen.getByText('• Recursive calls are detected and prevented')).toBeDefined();
    });

    it('renders two Add buttons', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getAllByText('+ Add').length).toBe(2);
    });
  });

  describe('workflow selection', () => {
    it('calls onChange when workflow selected', () => {
      const onChange = vi.fn();
      render(<SubworkflowNodeSettings data={{} as any} onChange={onChange} />);
      const select = screen.getAllByRole('combobox')[0];
      fireEvent.change(select, { target: { value: '1' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        subworkflowConfig: expect.objectContaining({ workflowId: 1 }),
      }));
    });

    it('shows workflow description when selected', () => {
      const data = {
        subworkflowConfig: {
          workflowId: 1,
          inputMapping: {},
          outputMapping: {},
        },
      };
      render(<SubworkflowNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('A sub workflow')).toBeDefined();
    });

    it('does not show description for workflow without it', () => {
      const data = {
        subworkflowConfig: {
          workflowId: 3,
          inputMapping: {},
          outputMapping: {},
        },
      };
      render(<SubworkflowNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.queryByText('A sub workflow')).toBeNull();
    });

    it('loads workflows on mount', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(mockLoadWorkflows).toHaveBeenCalled();
    });
  });

  describe('input mapping', () => {
    it('adds input mapping entry when + Add clicked', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      const addButtons = screen.getAllByText('+ Add');
      fireEvent.click(addButtons[0]);
      expect(screen.getByPlaceholderText('Child input field')).toBeDefined();
      expect(screen.getByPlaceholderText('Parent field')).toBeDefined();
    });

    it('hides No input mappings when entry added', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      const addButtons = screen.getAllByText('+ Add');
      fireEvent.click(addButtons[0]);
      expect(screen.queryByText('No input mappings')).toBeNull();
    });

    it('shows arrow between input fields', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      const addButtons = screen.getAllByText('+ Add');
      fireEvent.click(addButtons[0]);
      expect(screen.getAllByText('←').length).toBeGreaterThan(0);
    });

    it('renders with existing input mapping', () => {
      const data = {
        subworkflowConfig: {
          workflowId: 1,
          inputMapping: { key1: 'val1' },
          outputMapping: {},
        },
      };
      render(<SubworkflowNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('key1')).toBeDefined();
      expect(screen.getByDisplayValue('val1')).toBeDefined();
    });

    it('calls onChange when input mapping key changed', () => {
      const onChange = vi.fn();
      const data = {
        subworkflowConfig: {
          workflowId: 1,
          inputMapping: { key1: 'val1' },
          outputMapping: {},
        },
      };
      render(<SubworkflowNodeSettings data={data as any} onChange={onChange} />);
      const keyInput = screen.getByDisplayValue('key1');
      fireEvent.change(keyInput, { target: { value: 'newkey' } });
      expect(onChange).toHaveBeenCalled();
    });

    it('calls onChange when input mapping value changed', () => {
      const onChange = vi.fn();
      const data = {
        subworkflowConfig: {
          workflowId: 1,
          inputMapping: { key1: 'val1' },
          outputMapping: {},
        },
      };
      render(<SubworkflowNodeSettings data={data as any} onChange={onChange} />);
      const valueInput = screen.getByDisplayValue('val1');
      fireEvent.change(valueInput, { target: { value: 'newval' } });
      expect(onChange).toHaveBeenCalled();
    });

    it('shows remove button for input mapping entry', () => {
      const data = {
        subworkflowConfig: {
          workflowId: 1,
          inputMapping: { key1: 'val1' },
          outputMapping: {},
        },
      };
      render(<SubworkflowNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getAllByText('✕').length).toBeGreaterThan(0);
    });

    it('removes input mapping entry when ✕ clicked', () => {
      const onChange = vi.fn();
      const data = {
        subworkflowConfig: {
          workflowId: 1,
          inputMapping: { key1: 'val1' },
          outputMapping: {},
        },
      };
      render(<SubworkflowNodeSettings data={data as any} onChange={onChange} />);
      const removeButtons = screen.getAllByText('✕');
      fireEvent.click(removeButtons[0]);
      expect(onChange).toHaveBeenCalled();
    });

    it('shows input mapping description', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Map parent workflow data to child workflow input')).toBeDefined();
    });
  });

  describe('output mapping', () => {
    it('adds output mapping entry when + Add clicked', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      const addButtons = screen.getAllByText('+ Add');
      fireEvent.click(addButtons[1]); // Second Add button is for output
      expect(screen.getByPlaceholderText('Parent field')).toBeDefined();
      expect(screen.getByPlaceholderText('Child output field')).toBeDefined();
    });

    it('hides No output mappings when entry added', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      const addButtons = screen.getAllByText('+ Add');
      fireEvent.click(addButtons[1]);
      expect(screen.queryByText('No output mappings')).toBeNull();
    });

    it('renders with existing output mapping', () => {
      const data = {
        subworkflowConfig: {
          workflowId: 1,
          inputMapping: {},
          outputMapping: { out1: 'res1' },
        },
      };
      render(<SubworkflowNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('out1')).toBeDefined();
      expect(screen.getByDisplayValue('res1')).toBeDefined();
    });

    it('calls onChange when output mapping key changed', () => {
      const onChange = vi.fn();
      const data = {
        subworkflowConfig: {
          workflowId: 1,
          inputMapping: {},
          outputMapping: { out1: 'res1' },
        },
      };
      render(<SubworkflowNodeSettings data={data as any} onChange={onChange} />);
      const keyInput = screen.getByDisplayValue('out1');
      fireEvent.change(keyInput, { target: { value: 'newout' } });
      expect(onChange).toHaveBeenCalled();
    });

    it('calls onChange when output mapping value changed', () => {
      const onChange = vi.fn();
      const data = {
        subworkflowConfig: {
          workflowId: 1,
          inputMapping: {},
          outputMapping: { out1: 'res1' },
        },
      };
      render(<SubworkflowNodeSettings data={data as any} onChange={onChange} />);
      const valueInput = screen.getByDisplayValue('res1');
      fireEvent.change(valueInput, { target: { value: 'newres' } });
      expect(onChange).toHaveBeenCalled();
    });

    it('removes output mapping entry when ✕ clicked', () => {
      const onChange = vi.fn();
      const data = {
        subworkflowConfig: {
          workflowId: 1,
          inputMapping: {},
          outputMapping: { out1: 'res1' },
        },
      };
      render(<SubworkflowNodeSettings data={data as any} onChange={onChange} />);
      const removeButtons = screen.getAllByText('✕');
      fireEvent.click(removeButtons[0]);
      expect(onChange).toHaveBeenCalled();
    });

    it('shows output mapping description', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Map child workflow output to parent workflow data')).toBeDefined();
    });
  });

  describe('existing config', () => {
    it('renders with existing subworkflow config', () => {
      const data = {
        subworkflowConfig: {
          workflowId: 1,
          inputMapping: { key1: 'val1' },
          outputMapping: { out1: 'res1' },
        },
      };
      render(<SubworkflowNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('key1')).toBeDefined();
      expect(screen.getByDisplayValue('val1')).toBeDefined();
      expect(screen.getByDisplayValue('out1')).toBeDefined();
      expect(screen.getByDisplayValue('res1')).toBeDefined();
    });

    it('renders with multiple input mappings', () => {
      const data = {
        subworkflowConfig: {
          workflowId: 1,
          inputMapping: { a: '1', b: '2' },
          outputMapping: {},
        },
      };
      render(<SubworkflowNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('a')).toBeDefined();
      expect(screen.getByDisplayValue('1')).toBeDefined();
      expect(screen.getByDisplayValue('b')).toBeDefined();
      expect(screen.getByDisplayValue('2')).toBeDefined();
    });

    it('renders with multiple output mappings', () => {
      const data = {
        subworkflowConfig: {
          workflowId: 1,
          inputMapping: {},
          outputMapping: { x: 'y', z: 'w' },
        },
      };
      render(<SubworkflowNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('x')).toBeDefined();
      expect(screen.getByDisplayValue('y')).toBeDefined();
      expect(screen.getByDisplayValue('z')).toBeDefined();
      expect(screen.getByDisplayValue('w')).toBeDefined();
    });
  });

  describe('default values', () => {
    it('uses default config when subworkflowConfig is undefined', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('No input mappings')).toBeDefined();
      expect(screen.getByText('No output mappings')).toBeDefined();
    });

    it('shows empty select when no workflow selected', () => {
      render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      const select = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
      expect(select.value).toBe('');
    });
  });

  describe('styling', () => {
    it('has space-y-4 layout', () => {
      const { container } = render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('space-y-4');
    });

    it('has proper background colors', () => {
      const { container } = render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('bg-gray-700');
    });

    it('has indigo accent for subworkflow', () => {
      const { container } = render(<SubworkflowNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('indigo');
    });
  });
});
