// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoopNodeSettings } from './LoopNodeSettings';

describe('LoopNodeSettings', () => {
  it('renders loop type options', () => {
    render(<LoopNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getAllByText(/Loop|forEach|while|count/i).length).toBeGreaterThan(0);
  });

  it('renders with loop data without crash', () => {
    const data = { loopType: 'count', maxIterations: 10 };
    const { container } = render(<LoopNodeSettings data={data as any} onChange={vi.fn()} />);
    expect(container.innerHTML).not.toBe('');
  });

  it('shows loop type label', () => {
    render(<LoopNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Loop Type')).toBeDefined();
  });

  it('shows max iterations label', () => {
    render(<LoopNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Max Iterations (Safety Limit)')).toBeDefined();
  });

  it('shows loop summary', () => {
    render(<LoopNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Loop Summary')).toBeDefined();
  });

  it('shows loop node usage info', () => {
    render(<LoopNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Loop Node Usage')).toBeDefined();
  });

  it('renders forEach option', () => {
    render(<LoopNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('For Each (Array)')).toBeDefined();
  });

  it('renders count option', () => {
    render(<LoopNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Count (Fixed Number)')).toBeDefined();
  });

  it('renders while option', () => {
    render(<LoopNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('While (Conditional)')).toBeDefined();
  });

  it('shows forEach description by default', () => {
    render(<LoopNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Iterate over array elements')).toBeDefined();
  });

  it('shows count configuration when count type selected', () => {
    const data = { loopConfig: { type: 'count', maxIterations: 100 } };
    render(<LoopNodeSettings data={data as any} onChange={vi.fn()} />);
    expect(screen.getByText('Iteration Count')).toBeDefined();
  });

  it('shows forEach configuration when forEach type selected', () => {
    const data = { loopConfig: { type: 'forEach', maxIterations: 100 } };
    render(<LoopNodeSettings data={data as any} onChange={vi.fn()} />);
    expect(screen.getByText('Array Path')).toBeDefined();
  });

  it('shows while configuration when while type selected', () => {
    const data = { loopConfig: { type: 'while', maxIterations: 100 } };
    render(<LoopNodeSettings data={data as any} onChange={vi.fn()} />);
    expect(screen.getByText('While Condition')).toBeDefined();
  });

  it('calls onChange when loop type changes', () => {
    const onChange = vi.fn();
    render(<LoopNodeSettings data={{} as any} onChange={onChange} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'count' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('shows max iterations input', () => {
    const data = { loopConfig: { type: 'forEach', maxIterations: 50 } };
    render(<LoopNodeSettings data={data as any} onChange={vi.fn()} />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs.length).toBeGreaterThan(0);
  });
});
