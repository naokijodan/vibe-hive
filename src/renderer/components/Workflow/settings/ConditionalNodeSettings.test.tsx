// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConditionalNodeSettings } from './ConditionalNodeSettings';

describe('ConditionalNodeSettings', () => {
  const defaultOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders in simple mode by default', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getAllByText(/Simple|Condition|Field/i).length).toBeGreaterThan(0);
    });

    it('renders mode toggle buttons', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Simple')).toBeDefined();
      expect(screen.getByText('Advanced')).toBeDefined();
      expect(screen.getByText('Expert')).toBeDefined();
    });

    it('renders operator options', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getAllByText(/Equals|Contains/i).length).toBeGreaterThan(0);
    });

    it('shows mode description for simple mode', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Single condition')).toBeDefined();
    });

    it('renders condition preview section', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Condition Preview')).toBeDefined();
    });
  });

  describe('simple mode', () => {
    it('renders field path input', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Field Path')).toBeDefined();
      expect(screen.getByPlaceholderText('e.g., status, output.exitCode')).toBeDefined();
    });

    it('renders operator select', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Operator')).toBeDefined();
    });

    it('renders value input', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Value')).toBeDefined();
      expect(screen.getByPlaceholderText('comparison value')).toBeDefined();
    });

    it('renders with existing condition data', () => {
      const data = {
        condition: { field: 'status', operator: 'equals', value: 'done' },
      };
      render(<ConditionalNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('status')).toBeDefined();
      expect(screen.getByDisplayValue('done')).toBeDefined();
    });

    it('calls onChange when field changed', () => {
      const onChange = vi.fn();
      render(<ConditionalNodeSettings data={{} as any} onChange={onChange} />);
      const fieldInput = screen.getByPlaceholderText('e.g., status, output.exitCode');
      fireEvent.change(fieldInput, { target: { value: 'myfield' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        condition: expect.objectContaining({ field: 'myfield' }),
      }));
    });

    it('calls onChange when operator changed', () => {
      const onChange = vi.fn();
      render(<ConditionalNodeSettings data={{} as any} onChange={onChange} />);
      const select = screen.getAllByRole('combobox')[0];
      fireEvent.change(select, { target: { value: 'greater_than' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        condition: expect.objectContaining({ operator: 'greater_than' }),
      }));
    });

    it('calls onChange when value changed', () => {
      const onChange = vi.fn();
      render(<ConditionalNodeSettings data={{} as any} onChange={onChange} />);
      const valueInput = screen.getByPlaceholderText('comparison value');
      fireEvent.change(valueInput, { target: { value: 'test' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        condition: expect.objectContaining({ value: 'test' }),
      }));
    });

    it('shows all operator options', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Equals (==)')).toBeDefined();
      expect(screen.getByText('Not Equals (!=)')).toBeDefined();
      expect(screen.getByText('Greater Than (>)')).toBeDefined();
      expect(screen.getByText('Less Than (<)')).toBeDefined();
      expect(screen.getByText('Contains')).toBeDefined();
      expect(screen.getByText('Not Contains')).toBeDefined();
    });

    it('shows simple preview', () => {
      const data = {
        condition: { field: 'status', operator: 'equals', value: 'done' },
      };
      const { container } = render(<ConditionalNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('status');
      expect(container.innerHTML).toContain('done');
    });
  });

  describe('advanced mode', () => {
    it('switches to advanced mode', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Advanced'));
      expect(screen.getAllByText(/AND|OR/i).length).toBeGreaterThan(0);
    });

    it('shows mode description for advanced mode', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Advanced'));
      expect(screen.getByText('Multiple conditions with AND/OR')).toBeDefined();
    });

    it('shows logical operator buttons', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Advanced'));
      expect(screen.getByText('AND (All must match)')).toBeDefined();
      expect(screen.getByText('OR (Any can match)')).toBeDefined();
    });

    it('shows Add Condition button', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Advanced'));
      expect(screen.getByText('+ Add Condition')).toBeDefined();
    });

    it('adds new condition when Add Condition clicked', () => {
      const onChange = vi.fn();
      render(<ConditionalNodeSettings data={{} as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('Advanced'));
      fireEvent.click(screen.getByText('+ Add Condition'));
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        conditionGroup: expect.objectContaining({
          conditions: expect.any(Array),
        }),
      }));
    });

    it('changes logical operator to OR', () => {
      const onChange = vi.fn();
      render(<ConditionalNodeSettings data={{} as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('Advanced'));
      fireEvent.click(screen.getByText('OR (Any can match)'));
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        conditionGroup: expect.objectContaining({ operator: 'OR' }),
      }));
    });

    it('shows conditions label', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Advanced'));
      expect(screen.getByText('Conditions')).toBeDefined();
    });

    it('shows condition field inputs', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Advanced'));
      expect(screen.getByPlaceholderText('Field path')).toBeDefined();
      expect(screen.getByPlaceholderText('Value')).toBeDefined();
    });

    it('renders with existing condition group', () => {
      const data = {
        conditionGroup: {
          operator: 'AND',
          conditions: [
            { field: 'status', operator: 'equals', value: 'active' },
            { field: 'count', operator: 'greater_than', value: '0' },
          ],
        },
      };
      render(<ConditionalNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('status')).toBeDefined();
      expect(screen.getByDisplayValue('active')).toBeDefined();
    });

    it('updates condition field value', () => {
      const onChange = vi.fn();
      render(<ConditionalNodeSettings data={{} as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('Advanced'));
      const fieldInput = screen.getByPlaceholderText('Field path');
      fireEvent.change(fieldInput, { target: { value: 'myfield' } });
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('expert mode', () => {
    it('switches to expert mode', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Expert'));
      expect(screen.getAllByText(/Group/i).length).toBeGreaterThan(0);
    });

    it('shows mode description for expert mode', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Expert'));
      expect(screen.getByText('Nested groups with complex logic')).toBeDefined();
    });

    it('shows top-level logical operator label', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Expert'));
      expect(screen.getByText('Top-Level Logical Operator')).toBeDefined();
    });

    it('shows Add Group button', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Expert'));
      expect(screen.getByText('+ Add Group')).toBeDefined();
    });

    it('shows Condition Groups label', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Expert'));
      expect(screen.getByText('Condition Groups')).toBeDefined();
    });

    it('shows operator between groups description', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Expert'));
      expect(screen.getByText('Operator between groups')).toBeDefined();
    });

    it('shows Group Operator label in group', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Expert'));
      expect(screen.getByText('Group Operator')).toBeDefined();
    });

    it('adds new group when Add Group clicked', () => {
      const onChange = vi.fn();
      render(<ConditionalNodeSettings data={{} as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('Expert'));
      fireEvent.click(screen.getByText('+ Add Group'));
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        conditionGroup: expect.objectContaining({
          groups: expect.any(Array),
        }),
      }));
    });

    it('renders with existing expert group data', () => {
      const data = {
        conditionGroup: {
          operator: 'OR',
          conditions: [],
          groups: [
            {
              operator: 'AND',
              conditions: [{ field: 'a', operator: 'equals', value: '1' }],
            },
            {
              operator: 'AND',
              conditions: [{ field: 'b', operator: 'equals', value: '2' }],
            },
          ],
        },
      };
      render(<ConditionalNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('a')).toBeDefined();
      expect(screen.getByDisplayValue('1')).toBeDefined();
    });

    it('shows + Add button for group conditions', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Expert'));
      expect(screen.getByText('+ Add')).toBeDefined();
    });

    it('changes top-level operator', () => {
      const onChange = vi.fn();
      render(<ConditionalNodeSettings data={{} as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('Expert'));
      const andButtons = screen.getAllByText('AND');
      fireEvent.click(andButtons[0]); // Top-level AND button
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('mode transitions', () => {
    it('switches from simple to advanced and back', () => {
      const onChange = vi.fn();
      render(<ConditionalNodeSettings data={{} as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('Advanced'));
      expect(screen.getByText('+ Add Condition')).toBeDefined();
      fireEvent.click(screen.getByText('Simple'));
      expect(screen.getByText('Field Path')).toBeDefined();
    });

    it('switches from simple to expert', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Expert'));
      expect(screen.getByText('Condition Groups')).toBeDefined();
    });

    it('switches from expert to simple', () => {
      const onChange = vi.fn();
      render(<ConditionalNodeSettings data={{} as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('Expert'));
      fireEvent.click(screen.getByText('Simple'));
      expect(screen.getByText('Field Path')).toBeDefined();
    });

    it('switches from expert to advanced', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Expert'));
      fireEvent.click(screen.getByText('Advanced'));
      expect(screen.getByText('+ Add Condition')).toBeDefined();
    });

    it('switches from advanced to expert', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      fireEvent.click(screen.getByText('Advanced'));
      fireEvent.click(screen.getByText('Expert'));
      expect(screen.getByText('Condition Groups')).toBeDefined();
    });
  });

  describe('preview', () => {
    it('shows preview in simple mode with placeholders', () => {
      const { container } = render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('(field)');
      expect(container.innerHTML).toContain('(value)');
    });

    it('shows preview in advanced mode', () => {
      const data = {
        conditionGroup: {
          operator: 'AND',
          conditions: [{ field: 'status', operator: 'equals', value: 'done' }],
        },
      };
      render(<ConditionalNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('status')).toBeDefined();
    });
  });

  describe('styling', () => {
    it('has space-y-4 layout', () => {
      const { container } = render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('space-y-4');
    });

    it('has grid layout for mode buttons', () => {
      const { container } = render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('grid-cols-3');
    });

    it('has proper background colors', () => {
      const { container } = render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('bg-gray-700');
    });
  });

  describe('initial mode detection', () => {
    it('starts in simple mode when no data', () => {
      render(<ConditionalNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Single condition')).toBeDefined();
    });

    it('starts in advanced mode when conditionGroup exists', () => {
      const data = {
        conditionGroup: {
          operator: 'AND',
          conditions: [{ field: 'a', operator: 'equals', value: '1' }],
        },
      };
      render(<ConditionalNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Multiple conditions with AND/OR')).toBeDefined();
    });

    it('starts in expert mode when conditionGroup has groups', () => {
      const data = {
        conditionGroup: {
          operator: 'OR',
          conditions: [],
          groups: [{ operator: 'AND', conditions: [{ field: '', operator: 'equals', value: '' }] }],
        },
      };
      render(<ConditionalNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Nested groups with complex logic')).toBeDefined();
    });
  });
});
