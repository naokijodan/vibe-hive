// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DelayNodeSettings } from './DelayNodeSettings';

describe('DelayNodeSettings', () => {
  const defaultOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders delay input and presets', () => {
      render(<DelayNodeSettings data={{ delayMs: 5000 } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Delay Duration (milliseconds)')).toBeDefined();
      expect(screen.getByText('Quick Presets')).toBeDefined();
      expect(screen.getByText('1 second')).toBeDefined();
      expect(screen.getByText('5 seconds')).toBeDefined();
    });

    it('renders info section', () => {
      render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('Info')).toBeDefined();
      expect(screen.getByText(/workflow will pause/)).toBeDefined();
    });

    it('renders all presets', () => {
      render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('1 second')).toBeDefined();
      expect(screen.getByText('5 seconds')).toBeDefined();
      expect(screen.getByText('10 seconds')).toBeDefined();
      expect(screen.getByText('30 seconds')).toBeDefined();
      expect(screen.getByText('1 minute')).toBeDefined();
      expect(screen.getByText('5 minutes')).toBeDefined();
    });

    it('renders input with spinbutton role', () => {
      render(<DelayNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(screen.getByRole('spinbutton')).toBeDefined();
    });
  });

  describe('default values', () => {
    it('uses 1000ms default when delayMs not provided', () => {
      render(<DelayNodeSettings data={{} as any} onChange={defaultOnChange} />);
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('1000');
    });

    it('uses provided delayMs value', () => {
      render(<DelayNodeSettings data={{ delayMs: 5000 } as any} onChange={defaultOnChange} />);
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('5000');
    });
  });

  describe('time display format', () => {
    it('displays time in ms format for sub-second', () => {
      render(<DelayNodeSettings data={{ delayMs: 500 } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('500ms')).toBeDefined();
    });

    it('displays time in seconds format for 1-60 seconds', () => {
      render(<DelayNodeSettings data={{ delayMs: 5000 } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('5.0s')).toBeDefined();
    });

    it('displays time in seconds format for edge case', () => {
      render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('1.0s')).toBeDefined();
    });

    it('displays time in minutes format for 60+ seconds', () => {
      render(<DelayNodeSettings data={{ delayMs: 120000 } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('2.0min')).toBeDefined();
    });

    it('displays time in minutes format for exact 1 minute', () => {
      render(<DelayNodeSettings data={{ delayMs: 60000 } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('1.0min')).toBeDefined();
    });

    it('displays default for zero (falsy value falls back to 1000ms)', () => {
      // Note: Component uses `data.delayMs || 1000` so 0 is treated as falsy
      render(<DelayNodeSettings data={{ delayMs: 0 } as any} onChange={defaultOnChange} />);
      expect(screen.getByText('1.0s')).toBeDefined();
    });
  });

  describe('preset clicks', () => {
    it('calls onChange when preset clicked', () => {
      const onChange = vi.fn();
      render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('5 minutes'));
      expect(onChange).toHaveBeenCalledWith({ delayMs: 300000 });
    });

    it('calls onChange when 1 second clicked', () => {
      const onChange = vi.fn();
      render(<DelayNodeSettings data={{ delayMs: 5000 } as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('1 second'));
      expect(onChange).toHaveBeenCalledWith({ delayMs: 1000 });
    });

    it('calls onChange when 5 seconds clicked', () => {
      const onChange = vi.fn();
      render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('5 seconds'));
      expect(onChange).toHaveBeenCalledWith({ delayMs: 5000 });
    });

    it('calls onChange when 10 seconds clicked', () => {
      const onChange = vi.fn();
      render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('10 seconds'));
      expect(onChange).toHaveBeenCalledWith({ delayMs: 10000 });
    });

    it('calls onChange when 30 seconds clicked', () => {
      const onChange = vi.fn();
      render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('30 seconds'));
      expect(onChange).toHaveBeenCalledWith({ delayMs: 30000 });
    });

    it('calls onChange when 1 minute clicked', () => {
      const onChange = vi.fn();
      render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={onChange} />);
      fireEvent.click(screen.getByText('1 minute'));
      expect(onChange).toHaveBeenCalledWith({ delayMs: 60000 });
    });
  });

  describe('input handling', () => {
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

    it('does not call onChange for negative number', () => {
      const onChange = vi.fn();
      render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={onChange} />);
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '-500' } });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('accepts zero as valid input', () => {
      const onChange = vi.fn();
      render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={onChange} />);
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '0' } });
      expect(onChange).toHaveBeenCalledWith({ delayMs: 0 });
    });

    it('accepts large values', () => {
      const onChange = vi.fn();
      render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={onChange} />);
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '999999' } });
      expect(onChange).toHaveBeenCalledWith({ delayMs: 999999 });
    });
  });

  describe('preset styling', () => {
    it('shows active preset with different style', () => {
      const { container } = render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('bg-blue-600');
    });

    it('shows inactive presets with gray style', () => {
      const { container } = render(<DelayNodeSettings data={{ delayMs: 1000 } as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('bg-gray-700');
    });
  });

  describe('styling', () => {
    it('has space-y-4 layout', () => {
      const { container } = render(<DelayNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('space-y-4');
    });

    it('has grid layout for presets', () => {
      const { container } = render(<DelayNodeSettings data={{} as any} onChange={defaultOnChange} />);
      expect(container.innerHTML).toContain('grid-cols-2');
    });
  });
});
