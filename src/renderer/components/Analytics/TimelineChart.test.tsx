// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TimelineChart } from './TimelineChart';

describe('TimelineChart', () => {
  it('renders header with day count', () => {
    render(<TimelineChart tasks={[]} executions={[]} days={7} />);
    expect(screen.getByText('Activity Timeline (7 days)')).toBeDefined();
  });

  it('shows Today label', () => {
    render(<TimelineChart tasks={[]} executions={[]} />);
    expect(screen.getByText('Today')).toBeDefined();
  });

  it('renders legend items', () => {
    render(<TimelineChart tasks={[]} executions={[]} />);
    expect(screen.getByText('Created')).toBeDefined();
    expect(screen.getByText('Completed')).toBeDefined();
    expect(screen.getByText('Executions')).toBeDefined();
  });
});
