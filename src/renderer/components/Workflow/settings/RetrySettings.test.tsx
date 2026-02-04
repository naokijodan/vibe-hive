// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RetrySettings } from './RetrySettings';

describe('RetrySettings', () => {
  it('renders retry toggle', () => {
    render(<RetrySettings onChange={vi.fn()} />);
    expect(screen.getByText(/Retry/i)).toBeDefined();
  });

  it('renders with config', () => {
    const retryConfig = { enabled: true, maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2 };
    render(<RetrySettings retryConfig={retryConfig} onChange={vi.fn()} />);
    expect(screen.getByText(/Retry/i)).toBeDefined();
  });

  it('shows Show/Hide toggle button', () => {
    render(<RetrySettings onChange={vi.fn()} />);
    expect(screen.getByText('Show')).toBeDefined();
  });

  it('expands advanced section when Show clicked', () => {
    render(<RetrySettings onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Show'));
    expect(screen.getByText('Hide')).toBeDefined();
    expect(screen.getByText('Enable Retry')).toBeDefined();
    expect(screen.getByText('Enable Timeout')).toBeDefined();
    expect(screen.getByText('Continue on Error')).toBeDefined();
  });

  it('calls onChange when retry toggled on', () => {
    const onChange = vi.fn();
    render(<RetrySettings onChange={onChange} />);
    fireEvent.click(screen.getByText('Show'));
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // Enable Retry
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      retryConfig: expect.objectContaining({ enabled: true, maxAttempts: 3 }),
    }));
  });

  it('calls onChange when timeout toggled on', () => {
    const onChange = vi.fn();
    render(<RetrySettings onChange={onChange} />);
    fireEvent.click(screen.getByText('Show'));
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Enable Timeout
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      timeoutConfig: expect.objectContaining({ enabled: true, timeoutMs: 30000 }),
    }));
  });

  it('calls onChange when continue on error toggled', () => {
    const onChange = vi.fn();
    render(<RetrySettings onChange={onChange} />);
    fireEvent.click(screen.getByText('Show'));
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[2]); // Continue on Error
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      errorHandlingConfig: expect.objectContaining({ continueOnError: true }),
    }));
  });

  it('shows retry config fields when retry enabled', () => {
    const retryConfig = { enabled: true, maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2 };
    render(<RetrySettings retryConfig={retryConfig} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Show'));
    expect(screen.getByText('Max Attempts')).toBeDefined();
    expect(screen.getByText(/Delay/)).toBeDefined();
    expect(screen.getByText('Backoff Multiplier')).toBeDefined();
  });

  it('shows summary when retry enabled', () => {
    const retryConfig = { enabled: true, maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2 };
    render(<RetrySettings retryConfig={retryConfig} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Show'));
    expect(screen.getByText(/Retry up to 3 times/)).toBeDefined();
  });

  it('shows timeout config when timeout enabled', () => {
    const timeoutConfig = { enabled: true, timeoutMs: 30000 };
    render(<RetrySettings timeoutConfig={timeoutConfig} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Show'));
    expect(screen.getByText(/Timeout after 30000ms/)).toBeDefined();
  });

  describe('retry config changes', () => {
    it('changes max attempts', () => {
      const onChange = vi.fn();
      const retryConfig = { enabled: true, maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2 };
      render(<RetrySettings retryConfig={retryConfig} onChange={onChange} />);
      fireEvent.click(screen.getByText('Show'));
      const maxAttemptsInput = screen.getByDisplayValue('3');
      fireEvent.change(maxAttemptsInput, { target: { value: '5' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        retryConfig: expect.objectContaining({ maxAttempts: 5 }),
      }));
    });

    it('changes delay', () => {
      const onChange = vi.fn();
      const retryConfig = { enabled: true, maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2 };
      render(<RetrySettings retryConfig={retryConfig} onChange={onChange} />);
      fireEvent.click(screen.getByText('Show'));
      const delayInput = screen.getByDisplayValue('1000');
      fireEvent.change(delayInput, { target: { value: '2000' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        retryConfig: expect.objectContaining({ delayMs: 2000 }),
      }));
    });

    it('changes backoff multiplier', () => {
      const onChange = vi.fn();
      const retryConfig = { enabled: true, maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2 };
      render(<RetrySettings retryConfig={retryConfig} onChange={onChange} />);
      fireEvent.click(screen.getByText('Show'));
      const backoffInput = screen.getByDisplayValue('2');
      fireEvent.change(backoffInput, { target: { value: '3' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        retryConfig: expect.objectContaining({ backoffMultiplier: 3 }),
      }));
    });

    it('changes retry on error types', () => {
      const onChange = vi.fn();
      const retryConfig = { enabled: true, maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2 };
      render(<RetrySettings retryConfig={retryConfig} onChange={onChange} />);
      fireEvent.click(screen.getByText('Show'));
      const errorTypesInput = screen.getByPlaceholderText('ECONNREFUSED, ETIMEDOUT');
      fireEvent.change(errorTypesInput, { target: { value: 'ECONNREFUSED, TIMEOUT' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        retryConfig: expect.objectContaining({ retryOnErrorTypes: ['ECONNREFUSED', 'TIMEOUT'] }),
      }));
    });

    it('clears retry on error types when empty', () => {
      const onChange = vi.fn();
      const retryConfig = {
        enabled: true,
        maxAttempts: 3,
        delayMs: 1000,
        backoffMultiplier: 2,
        retryOnErrorTypes: ['ECONNREFUSED'],
      };
      render(<RetrySettings retryConfig={retryConfig} onChange={onChange} />);
      fireEvent.click(screen.getByText('Show'));
      const errorTypesInput = screen.getByDisplayValue('ECONNREFUSED');
      fireEvent.change(errorTypesInput, { target: { value: '' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        retryConfig: expect.objectContaining({ retryOnErrorTypes: undefined }),
      }));
    });
  });

  describe('timeout config changes', () => {
    it('changes timeout value', () => {
      const onChange = vi.fn();
      const timeoutConfig = { enabled: true, timeoutMs: 30000 };
      render(<RetrySettings timeoutConfig={timeoutConfig} onChange={onChange} />);
      fireEvent.click(screen.getByText('Show'));
      const timeoutInput = screen.getByDisplayValue('30000');
      fireEvent.change(timeoutInput, { target: { value: '60000' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        timeoutConfig: expect.objectContaining({ timeoutMs: 60000 }),
      }));
    });
  });

  describe('error handling config', () => {
    it('shows error output field when continue on error enabled', () => {
      const errorHandlingConfig = { continueOnError: true };
      render(<RetrySettings errorHandlingConfig={errorHandlingConfig} onChange={vi.fn()} />);
      fireEvent.click(screen.getByText('Show'));
      expect(screen.getByText('Fallback Output (JSON, optional)')).toBeDefined();
    });

    it('changes error output with valid JSON', () => {
      const onChange = vi.fn();
      const errorHandlingConfig = { continueOnError: true };
      render(<RetrySettings errorHandlingConfig={errorHandlingConfig} onChange={onChange} />);
      fireEvent.click(screen.getByText('Show'));
      const errorOutputTextarea = screen.getByPlaceholderText('{"status": "error", "data": null}');
      fireEvent.change(errorOutputTextarea, { target: { value: '{"error": true}' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        errorHandlingConfig: expect.objectContaining({ errorOutput: { error: true } }),
      }));
    });

    it('ignores invalid JSON in error output', () => {
      const onChange = vi.fn();
      const errorHandlingConfig = { continueOnError: true };
      render(<RetrySettings errorHandlingConfig={errorHandlingConfig} onChange={onChange} />);
      fireEvent.click(screen.getByText('Show'));
      const errorOutputTextarea = screen.getByPlaceholderText('{"status": "error", "data": null}');
      fireEvent.change(errorOutputTextarea, { target: { value: 'invalid json' } });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('clears error output when empty string', () => {
      const onChange = vi.fn();
      const errorHandlingConfig = { continueOnError: true, errorOutput: { status: 'error' } };
      render(<RetrySettings errorHandlingConfig={errorHandlingConfig} onChange={onChange} />);
      fireEvent.click(screen.getByText('Show'));
      // Find the textarea by placeholder
      const errorOutputTextarea = screen.getByPlaceholderText('{"status": "error", "data": null}');
      fireEvent.change(errorOutputTextarea, { target: { value: '' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        errorHandlingConfig: expect.objectContaining({ errorOutput: undefined }),
      }));
    });

    it('shows continue on error summary', () => {
      const errorHandlingConfig = { continueOnError: true };
      render(<RetrySettings errorHandlingConfig={errorHandlingConfig} onChange={vi.fn()} />);
      fireEvent.click(screen.getByText('Show'));
      expect(screen.getByText(/Continue workflow on error/)).toBeDefined();
    });
  });

  describe('toggle interactions', () => {
    it('disables retry when toggled off', () => {
      const onChange = vi.fn();
      const retryConfig = { enabled: true, maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2 };
      render(<RetrySettings retryConfig={retryConfig} onChange={onChange} />);
      fireEvent.click(screen.getByText('Show'));
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Disable Retry
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        retryConfig: expect.objectContaining({ enabled: false }),
      }));
    });

    it('hides retry config fields when toggled off', () => {
      const { rerender } = render(
        <RetrySettings retryConfig={{ enabled: true, maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2 }} onChange={vi.fn()} />
      );
      fireEvent.click(screen.getByText('Show'));
      expect(screen.getByText('Max Attempts')).toBeDefined();

      rerender(
        <RetrySettings retryConfig={{ enabled: false, maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2 }} onChange={vi.fn()} />
      );
      expect(screen.queryByText('Max Attempts')).toBeNull();
    });
  });

  describe('section visibility toggle', () => {
    it('hides advanced section when Hide clicked', () => {
      render(<RetrySettings onChange={vi.fn()} />);
      fireEvent.click(screen.getByText('Show'));
      expect(screen.getByText('Enable Retry')).toBeDefined();
      fireEvent.click(screen.getByText('Hide'));
      expect(screen.queryByText('Enable Retry')).toBeNull();
    });
  });

  describe('styling', () => {
    it('has border top class', () => {
      const { container } = render(<RetrySettings onChange={vi.fn()} />);
      expect(container.innerHTML).toContain('border-t');
    });

    it('has spacing class', () => {
      const { container } = render(<RetrySettings onChange={vi.fn()} />);
      expect(container.innerHTML).toContain('space-y-4');
    });
  });
});
