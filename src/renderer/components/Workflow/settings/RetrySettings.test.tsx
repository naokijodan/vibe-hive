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
});
