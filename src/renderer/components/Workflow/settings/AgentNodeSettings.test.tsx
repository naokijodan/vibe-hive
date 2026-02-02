// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AgentNodeSettings } from './AgentNodeSettings';

describe('AgentNodeSettings', () => {
  it('renders agent type selector', () => {
    render(<AgentNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Agent Type')).toBeDefined();
  });

  it('renders timeout options', () => {
    render(<AgentNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getAllByText(/Timeout/i).length).toBeGreaterThan(0);
  });
});
