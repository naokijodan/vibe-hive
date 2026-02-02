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
});
