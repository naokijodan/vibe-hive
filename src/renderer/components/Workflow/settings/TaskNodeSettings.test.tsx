// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskNodeSettings } from './TaskNodeSettings';

vi.mock('../../../stores/taskStore', () => ({
  useTaskStore: () => ({
    tasks: [
      { id: 't1', title: 'My Task', status: 'todo' },
      { id: 't2', title: 'Other Task', status: 'in-progress' },
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
    expect(screen.getByText('2 tasks available')).toBeDefined();
  });

  it('calls onChange when command entered', () => {
    const onChange = vi.fn();
    render(<TaskNodeSettings data={{} as any} onChange={onChange} />);
    const commandInput = screen.getByPlaceholderText("echo 'Hello World'");
    fireEvent.change(commandInput, { target: { value: 'npm test' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      config: expect.objectContaining({ command: 'npm test' }),
    }));
  });

  it('calls onChange when working directory entered', () => {
    const onChange = vi.fn();
    render(<TaskNodeSettings data={{} as any} onChange={onChange} />);
    const dirInput = screen.getByPlaceholderText('/path/to/directory');
    fireEvent.change(dirInput, { target: { value: '/tmp' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      config: expect.objectContaining({ workingDirectory: '/tmp' }),
    }));
  });

  it('calls onChange when task selected', () => {
    const onChange = vi.fn();
    render(<TaskNodeSettings data={{} as any} onChange={onChange} />);
    const select = screen.getAllByRole('combobox')[0];
    fireEvent.change(select, { target: { value: 't1' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('renders with existing config data', () => {
    const data = { config: { command: 'npm run build', workingDirectory: '/home' } };
    render(<TaskNodeSettings data={data as any} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('npm run build')).toBeDefined();
    expect(screen.getByDisplayValue('/home')).toBeDefined();
  });
});
