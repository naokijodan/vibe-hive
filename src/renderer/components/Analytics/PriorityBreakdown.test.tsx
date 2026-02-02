// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PriorityBreakdown } from './PriorityBreakdown';

const makeTasks = (overrides: Record<string, unknown>[] = []) =>
  overrides.map((o, i) => ({
    id: `t${i}`,
    sessionId: 's1',
    title: `Task ${i}`,
    description: '',
    status: 'todo' as const,
    priority: 'medium' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...o,
  }));

describe('PriorityBreakdown', () => {
  it('shows no active tasks message when empty', () => {
    render(<PriorityBreakdown tasks={[]} />);
    expect(screen.getByText('No active tasks')).toBeDefined();
  });

  it('excludes done tasks', () => {
    const tasks = makeTasks([
      { status: 'done', priority: 'high' },
      { status: 'todo', priority: 'medium' },
    ]);
    render(<PriorityBreakdown tasks={tasks} />);
    expect(screen.getByText('Total active')).toBeDefined();
    expect(screen.queryByText('No active tasks')).toBeNull();
  });

  it('shows priority labels', () => {
    const tasks = makeTasks([{ priority: 'urgent' }, { priority: 'high' }]);
    render(<PriorityBreakdown tasks={tasks} />);
    expect(screen.getByText('Urgent')).toBeDefined();
    expect(screen.getByText('High')).toBeDefined();
  });

  it('shows total active count', () => {
    const tasks = makeTasks([{}, {}, {}]);
    const { container } = render(<PriorityBreakdown tasks={tasks} />);
    expect(container.textContent).toContain('Total active');
    expect(container.textContent).toContain('3');
  });
});
