// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoopNodeSettings } from './LoopNodeSettings';

describe('LoopNodeSettings', () => {
  const defaultOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders loop type options', () => {
      render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getAllByText(/Loop|forEach|while|count/i).length).toBeGreaterThan(0);
    });

    it('renders with loop data without crash', () => {
      const data = { loopType: 'count', maxIterations: 10 };
      const { container } = render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).not.toBe('');
    });

    it('shows loop type label', () => {
      render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Loop Type')).toBeDefined();
    });

    it('shows max iterations label', () => {
      render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Max Iterations (Safety Limit)')).toBeDefined();
    });

    it('shows loop summary', () => {
      render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Loop Summary')).toBeDefined();
    });

    it('shows loop node usage info', () => {
      render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Loop Node Usage')).toBeDefined();
    });
  });

  describe('loop type options', () => {
    it('renders forEach option', () => {
      render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('For Each (Array)')).toBeDefined();
    });

    it('renders count option', () => {
      render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Count (Fixed Number)')).toBeDefined();
    });

    it('renders while option', () => {
      render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('While (Conditional)')).toBeDefined();
    });

    it('shows forEach description by default', () => {
      render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Iterate over array elements')).toBeDefined();
    });

    it('shows count description when count selected', () => {
      const data = { loopConfig: { type: 'count', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Repeat a fixed number of times')).toBeDefined();
    });

    it('shows while description when while selected', () => {
      const data = { loopConfig: { type: 'while', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Loop while condition is true')).toBeDefined();
    });
  });

  describe('forEach configuration', () => {
    it('shows forEach configuration when forEach type selected', () => {
      const data = { loopConfig: { type: 'forEach', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Array Path')).toBeDefined();
    });

    it('shows array path placeholder', () => {
      const data = { loopConfig: { type: 'forEach', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByPlaceholderText('e.g., items, data.results')).toBeDefined();
    });

    it('calls onChange when array path changes', () => {
      const onChange = vi.fn();
      const data = { loopConfig: { type: 'forEach', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={onChange} />);
      const input = screen.getByPlaceholderText('e.g., items, data.results');
      fireEvent.change(input, { target: { value: 'items' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        loopConfig: expect.objectContaining({ arrayPath: 'items' }),
      }));
    });

    it('shows array path in summary', () => {
      const data = { loopConfig: { type: 'forEach', maxIterations: 100, arrayPath: 'data.items' } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('data.items')).toBeDefined();
    });

    it('shows (not set) when array path is empty', () => {
      const data = { loopConfig: { type: 'forEach', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('(not set)')).toBeDefined();
    });
  });

  describe('count configuration', () => {
    it('shows count configuration when count type selected', () => {
      const data = { loopConfig: { type: 'count', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Iteration Count')).toBeDefined();
    });

    it('calls onChange when count changes', () => {
      const onChange = vi.fn();
      const data = { loopConfig: { type: 'count', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={onChange} />);
      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '5' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        loopConfig: expect.objectContaining({ count: 5 }),
      }));
    });

    it('shows count in summary', () => {
      const data = { loopConfig: { type: 'count', maxIterations: 100, count: 10 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('10')).toBeDefined();
    });

    it('shows description about iteration range', () => {
      const data = { loopConfig: { type: 'count', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Number of times to repeat (1-1000)')).toBeDefined();
    });
  });

  describe('while configuration', () => {
    it('shows while configuration when while type selected', () => {
      const data = { loopConfig: { type: 'while', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('While Condition')).toBeDefined();
    });

    it('shows field path input', () => {
      const data = { loopConfig: { type: 'while', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Field Path')).toBeDefined();
    });

    it('shows operator select', () => {
      const data = { loopConfig: { type: 'while', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Operator')).toBeDefined();
    });

    it('shows value input', () => {
      const data = { loopConfig: { type: 'while', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Value')).toBeDefined();
    });

    it('shows all operator options', () => {
      const data = { loopConfig: { type: 'while', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Equals (==)')).toBeDefined();
      expect(screen.getByText('Not Equals (!=)')).toBeDefined();
      expect(screen.getByText('Greater Than (>)')).toBeDefined();
      expect(screen.getByText('Less Than (<)')).toBeDefined();
      expect(screen.getByText('Contains')).toBeDefined();
      expect(screen.getByText('Not Contains')).toBeDefined();
    });

    it('calls onChange when field path changes', () => {
      const onChange = vi.fn();
      const data = { loopConfig: { type: 'while', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={onChange} />);
      const input = screen.getByPlaceholderText('e.g., status, iteration.count');
      fireEvent.change(input, { target: { value: 'status' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        loopConfig: expect.objectContaining({
          condition: expect.objectContaining({
            conditions: expect.arrayContaining([
              expect.objectContaining({ field: 'status' }),
            ]),
          }),
        }),
      }));
    });

    it('calls onChange when operator changes', () => {
      const onChange = vi.fn();
      const data = { loopConfig: { type: 'while', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={onChange} />);
      const selects = screen.getAllByRole('combobox');
      const operatorSelect = selects[1]; // Second select is operator
      fireEvent.change(operatorSelect, { target: { value: 'greater_than' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        loopConfig: expect.objectContaining({
          condition: expect.objectContaining({
            conditions: expect.arrayContaining([
              expect.objectContaining({ operator: 'greater_than' }),
            ]),
          }),
        }),
      }));
    });

    it('calls onChange when value changes', () => {
      const onChange = vi.fn();
      const data = { loopConfig: { type: 'while', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={onChange} />);
      const input = screen.getByPlaceholderText('comparison value');
      fireEvent.change(input, { target: { value: 'active' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        loopConfig: expect.objectContaining({
          condition: expect.objectContaining({
            conditions: expect.arrayContaining([
              expect.objectContaining({ value: 'active' }),
            ]),
          }),
        }),
      }));
    });

    it('shows condition preview when condition is set', () => {
      const data = {
        loopConfig: {
          type: 'while',
          maxIterations: 100,
          condition: {
            operator: 'AND',
            conditions: [{ field: 'status', operator: 'equals', value: 'running' }],
          },
        },
      };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getAllByText('Preview:').length).toBeGreaterThan(0);
    });

    it('shows note about loop exit conditions', () => {
      const data = { loopConfig: { type: 'while', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText(/Loop will exit when condition becomes false/)).toBeDefined();
    });

    it('shows (not set) in summary when condition is not set', () => {
      const data = { loopConfig: { type: 'while', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getAllByText('(not set)').length).toBeGreaterThan(0);
    });
  });

  describe('max iterations', () => {
    it('shows max iterations input', () => {
      const data = { loopConfig: { type: 'forEach', maxIterations: 50 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('calls onChange when max iterations changes', () => {
      const onChange = vi.fn();
      render(<LoopNodeSettings data={{} as any} onChange={onChange} />);
      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '200' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        loopConfig: expect.objectContaining({ maxIterations: 200 }),
      }));
    });

    it('shows max iterations in summary', () => {
      const data = { loopConfig: { type: 'forEach', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('100')).toBeDefined();
    });

    it('shows description about safety limit', () => {
      render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Maximum iterations to prevent infinite loops (default: 100)')).toBeDefined();
    });
  });

  describe('loop type change', () => {
    it('calls onChange when loop type changes', () => {
      const onChange = vi.fn();
      render(<LoopNodeSettings data={{} as any} onChange={onChange} />);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'count' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        loopConfig: expect.objectContaining({ type: 'count' }),
      }));
    });

    it('defaults to forEach type', () => {
      render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByDisplayValue('For Each (Array)')).toBeDefined();
    });
  });

  describe('summary section', () => {
    it('shows Type label in summary', () => {
      render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Type:')).toBeDefined();
    });

    it('shows Max label in summary', () => {
      render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Max:')).toBeDefined();
    });

    it('shows For Each in summary for forEach type', () => {
      render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText('For Each')).toBeDefined();
    });

    it('shows Count in summary for count type', () => {
      const data = { loopConfig: { type: 'count', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Count')).toBeDefined();
    });

    it('shows While in summary for while type', () => {
      const data = { loopConfig: { type: 'while', maxIterations: 100 } };
      render(<LoopNodeSettings data={data as any} onChange={defaultOnChange} />);
      expect(screen.getByText('While')).toBeDefined();
    });
  });

  describe('usage info', () => {
    it('shows usage description', () => {
      render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByText(/loop node will execute all connected child nodes/)).toBeDefined();
    });
  });

  describe('styling', () => {
    it('has space-y-4 layout', () => {
      const { container } = render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('space-y-4');
    });

    it('has proper background colors', () => {
      const { container } = render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('bg-gray-700');
    });

    it('has orange accent for loop node', () => {
      const { container } = render(<LoopNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('orange');
    });
  });
});
