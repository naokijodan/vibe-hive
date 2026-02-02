// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TaskNodeSettings } from './TaskNodeSettings';

vi.mock('../../../stores/taskStore', () => ({
  useTaskStore: () => ({
    tasks: [
      { id: 't1', title: 'My Task', status: 'todo' },
    ],
    loadTasks: vi.fn(),
  }),
}));

vi.mock('./RetrySettings', () => ({
  RetrySettings: () => <div>RetrySettings</div>,
}));

describe('TaskNodeSettings', () => {
  it('renders task selection and fields', () => {
    render(<TaskNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('Select Task')).toBeDefined();
    expect(screen.getByText(/Command/)).toBeDefined();
    expect(screen.getByText(/Working Directory/)).toBeDefined();
    expect(screen.getByText('RetrySettings')).toBeDefined();
  });

  it('shows available tasks count', () => {
    render(<TaskNodeSettings data={{} as any} onChange={vi.fn()} />);
    expect(screen.getByText('1 task available')).toBeDefined();
  });
});
