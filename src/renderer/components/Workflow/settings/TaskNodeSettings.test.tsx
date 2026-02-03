// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskNodeSettings } from './TaskNodeSettings';

const { mockFns, mockState } = vi.hoisted(() => ({
  mockFns: {
    loadTasks: vi.fn(),
    onChange: vi.fn(),
  },
  mockState: {
    tasks: [
      { id: 't1', title: 'My Task', status: 'todo' },
      { id: 't2', title: 'Other Task', status: 'in-progress' },
    ] as any[],
  },
}));

vi.mock('../../../stores/taskStore', () => ({
  useTaskStore: () => ({
    ...mockState,
    loadTasks: mockFns.loadTasks,
  }),
}));

vi.mock('./RetrySettings', () => ({
  RetrySettings: ({ retryConfig, timeoutConfig, errorHandlingConfig, onChange }: any) => (
    <div data-testid="retry-settings">
      RetrySettings
      <span data-testid="retry-config">{JSON.stringify(retryConfig)}</span>
      <span data-testid="timeout-config">{JSON.stringify(timeoutConfig)}</span>
      <span data-testid="error-handling-config">{JSON.stringify(errorHandlingConfig)}</span>
    </div>
  ),
}));

describe('TaskNodeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.tasks = [
      { id: 't1', title: 'My Task', status: 'todo' },
      { id: 't2', title: 'Other Task', status: 'in-progress' },
    ];
  });

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

  describe('loadTasks', () => {
    it('calls loadTasks on mount', () => {
      render(<TaskNodeSettings data={{} as any} onChange={vi.fn()} />);
      expect(mockFns.loadTasks).toHaveBeenCalled();
    });
  });

  describe('task options', () => {
    it('shows task title and status in options', () => {
      const { container } = render(<TaskNodeSettings data={{} as any} onChange={vi.fn()} />);
      expect(container.innerHTML).toContain('My Task (todo)');
      expect(container.innerHTML).toContain('Other Task (in-progress)');
    });

    it('shows default option', () => {
      render(<TaskNodeSettings data={{} as any} onChange={vi.fn()} />);
      expect(screen.getByText('-- Select a task --')).toBeDefined();
    });
  });

  describe('task count text', () => {
    it('shows singular when 1 task', () => {
      mockState.tasks = [{ id: 't1', title: 'Single Task', status: 'todo' }];
      render(<TaskNodeSettings data={{} as any} onChange={vi.fn()} />);
      expect(screen.getByText('1 task available')).toBeDefined();
    });

    it('shows plural when multiple tasks', () => {
      render(<TaskNodeSettings data={{} as any} onChange={vi.fn()} />);
      expect(screen.getByText('2 tasks available')).toBeDefined();
    });

    it('shows 0 tasks when empty', () => {
      mockState.tasks = [];
      render(<TaskNodeSettings data={{} as any} onChange={vi.fn()} />);
      expect(screen.getByText('0 tasks available')).toBeDefined();
    });
  });

  describe('labels and descriptions', () => {
    it('shows command description', () => {
      render(<TaskNodeSettings data={{} as any} onChange={vi.fn()} />);
      expect(screen.getByText('Override task command')).toBeDefined();
    });

    it('shows working directory description', () => {
      render(<TaskNodeSettings data={{} as any} onChange={vi.fn()} />);
      expect(screen.getByText('Override working directory')).toBeDefined();
    });
  });

  describe('task selection with label update', () => {
    it('updates label when task selected', () => {
      const onChange = vi.fn();
      render(<TaskNodeSettings data={{ label: 'Old Label' } as any} onChange={onChange} />);
      const select = screen.getAllByRole('combobox')[0];
      fireEvent.change(select, { target: { value: 't1' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        label: 'My Task',
      }));
    });

    it('keeps existing label when task not found', () => {
      const onChange = vi.fn();
      render(<TaskNodeSettings data={{ label: 'Existing Label' } as any} onChange={onChange} />);
      const select = screen.getAllByRole('combobox')[0];
      fireEvent.change(select, { target: { value: 'non-existent' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        label: 'Existing Label',
      }));
    });
  });

  describe('existing config merge', () => {
    it('merges command with existing config', () => {
      const onChange = vi.fn();
      const data = { config: { workingDirectory: '/existing', otherProp: 'value' } };
      render(<TaskNodeSettings data={data as any} onChange={onChange} />);
      const commandInput = screen.getByPlaceholderText("echo 'Hello World'");
      fireEvent.change(commandInput, { target: { value: 'new command' } });
      expect(onChange).toHaveBeenCalledWith({
        config: {
          workingDirectory: '/existing',
          otherProp: 'value',
          command: 'new command',
        },
      });
    });

    it('merges working directory with existing config', () => {
      const onChange = vi.fn();
      const data = { config: { command: 'existing command', otherProp: 'value' } };
      render(<TaskNodeSettings data={data as any} onChange={onChange} />);
      const dirInput = screen.getByPlaceholderText('/path/to/directory');
      fireEvent.change(dirInput, { target: { value: '/new/dir' } });
      expect(onChange).toHaveBeenCalledWith({
        config: {
          command: 'existing command',
          otherProp: 'value',
          workingDirectory: '/new/dir',
        },
      });
    });
  });

  describe('RetrySettings props', () => {
    it('passes retryConfig to RetrySettings', () => {
      const data = { retryConfig: { maxRetries: 3 } };
      render(<TaskNodeSettings data={data as any} onChange={vi.fn()} />);
      expect(screen.getByTestId('retry-config').textContent).toContain('maxRetries');
    });

    it('passes timeoutConfig to RetrySettings', () => {
      const data = { timeoutConfig: { timeout: 5000 } };
      render(<TaskNodeSettings data={data as any} onChange={vi.fn()} />);
      expect(screen.getByTestId('timeout-config').textContent).toContain('timeout');
    });

    it('passes errorHandlingConfig to RetrySettings', () => {
      const data = { errorHandlingConfig: { onError: 'stop' } };
      render(<TaskNodeSettings data={data as any} onChange={vi.fn()} />);
      expect(screen.getByTestId('error-handling-config').textContent).toContain('onError');
    });
  });

  describe('styling', () => {
    it('has space-y layout', () => {
      const { container } = render(<TaskNodeSettings data={{} as any} onChange={vi.fn()} />);
      expect(container.innerHTML).toContain('space-y-4');
    });

    it('has input styling', () => {
      const { container } = render(<TaskNodeSettings data={{} as any} onChange={vi.fn()} />);
      expect(container.innerHTML).toContain('bg-gray-700');
      expect(container.innerHTML).toContain('border-gray-600');
      expect(container.innerHTML).toContain('rounded-lg');
    });

    it('has label styling', () => {
      const { container } = render(<TaskNodeSettings data={{} as any} onChange={vi.fn()} />);
      expect(container.innerHTML).toContain('font-medium');
      expect(container.innerHTML).toContain('text-gray-300');
    });

    it('has description text styling', () => {
      const { container } = render(<TaskNodeSettings data={{} as any} onChange={vi.fn()} />);
      expect(container.innerHTML).toContain('text-xs');
      expect(container.innerHTML).toContain('text-gray-500');
    });
  });

  describe('selected task value', () => {
    it('shows selected task in dropdown', () => {
      const data = { taskId: 't1' };
      render(<TaskNodeSettings data={data as any} onChange={vi.fn()} />);
      const select = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
      expect(select.value).toBe('t1');
    });

    it('shows empty when no task selected', () => {
      render(<TaskNodeSettings data={{} as any} onChange={vi.fn()} />);
      const select = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
      expect(select.value).toBe('');
    });
  });
});
