// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConditionalNodeSettings } from './ConditionalNodeSettings';

describe('ConditionalNodeSettings', () => {
  it('renders in simple mode by default', () => {
    render(<ConditionalNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getAllByText(/Simple|Condition|Field/i).length).toBeGreaterThan(0);
  });

  it('renders operator options', () => {
    render(<ConditionalNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getAllByText(/Equals|Contains/i).length).toBeGreaterThan(0);
  });

  it('switches to advanced mode', () => {
    render(<ConditionalNodeSettings data={{} as any} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Advanced'));
    expect(screen.getAllByText(/AND|OR/i).length).toBeGreaterThan(0);
  });

  it('switches to expert mode', () => {
    render(<ConditionalNodeSettings data={{} as any} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Expert'));
    expect(screen.getAllByText(/Group/i).length).toBeGreaterThan(0);
  });

  it('renders with existing condition data', () => {
    const data = {
      condition: { field: 'status', operator: 'equals', value: 'done' },
    };
    render(<ConditionalNodeSettings data={data as any} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('status')).toBeDefined();
    expect(screen.getByDisplayValue('done')).toBeDefined();
  });

  it('calls onChange when field changed', () => {
    const onChange = vi.fn();
    render(<ConditionalNodeSettings data={{} as any} onChange={onChange} />);
    const inputs = screen.getAllByRole('textbox');
    if (inputs.length > 0) {
      fireEvent.change(inputs[0], { target: { value: 'myfield' } });
      expect(onChange).toHaveBeenCalled();
    }
  });
});
