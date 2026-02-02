// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DelayNodeSettings } from './DelayNodeSettings';

describe('DelayNodeSettings', () => {
  it('renders delay input and presets', () => {
    render(<DelayNodeSettings data={{ delayMs: 5000 } as any} onChange={vi.fn()} />);
    expect(screen.getByText('Delay Duration (milliseconds)')).toBeDefined();
    expect(screen.getByText('Quick Presets')).toBeDefined();
    expect(screen.getByText('1 second')).toBeDefined();
    expect(screen.getByText('5 seconds')).toBeDefined();
  });

  it('calls onChange when preset clicked', () => {
    const onChange = vi.fn();
    render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={onChange} />);
    fireEvent.click(screen.getByText('5 minutes'));
    expect(onChange).toHaveBeenCalledWith({ delayMs: 300000 });
  });

  it('calls onChange when input changed with valid number', () => {
    const onChange = vi.fn();
    render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={onChange} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '2000' } });
    expect(onChange).toHaveBeenCalledWith({ delayMs: 2000 });
  });

  it('does not call onChange for invalid input', () => {
    const onChange = vi.fn();
    render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={onChange} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders info section', () => {
    render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={vi.fn()} />);
    expect(screen.getByText('Info')).toBeDefined();
    expect(screen.getByText(/workflow will pause/)).toBeDefined();
  });

  it('displays time in seconds format', () => {
    render(<DelayNodeSettings data={{ delayMs: 5000 } as any} onChange={vi.fn()} />);
    expect(screen.getByText('5.0s')).toBeDefined();
  });

  it('displays time in minutes format', () => {
    render(<DelayNodeSettings data={{ delayMs: 120000 } as any} onChange={vi.fn()} />);
    expect(screen.getByText('2.0min')).toBeDefined();
  });

  it('displays time in ms format for sub-second', () => {
    render(<DelayNodeSettings data={{ delayMs: 500 } as any} onChange={vi.fn()} />);
    expect(screen.getByText('500ms')).toBeDefined();
  });

  it('renders all presets', () => {
    render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={vi.fn()} />);
    expect(screen.getByText('1 second')).toBeDefined();
    expect(screen.getByText('5 seconds')).toBeDefined();
    expect(screen.getByText('10 seconds')).toBeDefined();
    expect(screen.getByText('30 seconds')).toBeDefined();
    expect(screen.getByText('1 minute')).toBeDefined();
    expect(screen.getByText('5 minutes')).toBeDefined();
  });
});
