// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TaskChart } from './TaskChart';
import type { Task } from '../../../shared/types/task';

const makeTasks = (statuses: string[]): Task[] =>
  statuses.map((status, i) => ({
    id: `t${i}`,
    sessionId: 's1',
    title: `Task ${i}`,
    status: status as Task['status'],
    priority: 'medium',
    createdAt: new Date(),
    updatedAt: new Date(),
  })) as Task[];

describe('TaskChart', () => {
  it('shows empty message when no tasks', () => {
    render(<TaskChart tasks={[]} />);
    expect(screen.getByText('No tasks yet')).toBeDefined();
  });

  it('renders distribution bars for tasks', () => {
    const tasks = makeTasks(['done', 'done', 'todo', 'in_progress']);
    render(<TaskChart tasks={tasks} />);
    expect(screen.getByText('Task Distribution')).toBeDefined();
    expect(screen.getByText('4 total tasks')).toBeDefined();
  });

  it('shows correct counts and percentages', () => {
    const tasks = makeTasks(['done', 'done', 'todo']);
    render(<TaskChart tasks={tasks} />);
    expect(screen.getByText('2 (67%)')).toBeDefined();
    expect(screen.getByText('1 (33%)')).toBeDefined();
  });
});
