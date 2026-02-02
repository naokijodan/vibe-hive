// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
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
});
