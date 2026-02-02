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
});
