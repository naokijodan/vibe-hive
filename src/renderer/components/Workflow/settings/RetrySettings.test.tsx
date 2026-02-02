// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
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
});
