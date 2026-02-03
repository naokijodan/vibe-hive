// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KanbanBoard } from './KanbanBoard';

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: () => null,
  PointerSensor: class {},
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
  pointerWithin: vi.fn(),
  rectIntersection: vi.fn(),
}));

vi.mock('./KanbanColumn', () => ({
  KanbanColumn: ({ title, tasks }: { title: string; tasks: any[] }) => (
    <div data-testid={`column-${title}`}>
      <span>{title}</span>
      <span data-testid={`count-${title}`}>{tasks.length}</span>
    </div>
  ),
}));

vi.mock('./TaskCard', () => ({
  TaskCard: ({ task }: { task: any }) => <div data-testid={`task-${task.id}`}>{task.title}</div>,
}));

vi.mock('../Template', () => ({
  TemplateBrowser: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="template-browser">
      <button onClick={onClose}>Close Browser</button>
    </div>
  ),
}));

vi.mock('../../stores/taskStore', () => ({
  useTaskStore: () => ({ createTask: vi.fn() }),
}));

vi.mock('../../bridge/ipcBridge', () => ({
  default: {
    task: {
      checkDependenciesReady: vi.fn().mockResolvedValue(true),
      getReadyTasks: vi.fn().mockResolvedValue([{ id: 't1' }]),
    },
  },
}));

const mockTasks = [
  {
    id: 't1',
    sessionId: 's1',
    title: 'Task 1',
    description: 'Description 1',
    status: 'todo' as const,
    priority: 'medium' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 't2',
    sessionId: 's1',
    title: 'Task 2',
    description: 'Description 2',
    status: 'in_progress' as const,
    priority: 'high' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 't3',
    sessionId: 's1',
    title: 'Task 3',
    description: 'Description 3',
    status: 'done' as const,
    priority: 'low' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all columns', () => {
    render(<KanbanBoard tasks={[]} />);
    expect(screen.getByText('TODO')).toBeDefined();
    expect(screen.getByText('稼働中')).toBeDefined();
    expect(screen.getByText('確認待ち')).toBeDefined();
    expect(screen.getByText('終了')).toBeDefined();
  });

  it('renders board header', () => {
    render(<KanbanBoard tasks={[]} />);
    expect(screen.getByText('タスクボード')).toBeDefined();
  });

  it('renders add task button', () => {
    render(<KanbanBoard tasks={[]} />);
    expect(screen.getByText('+ 新規タスク')).toBeDefined();
  });

  it('renders template button', () => {
    render(<KanbanBoard tasks={[]} />);
    expect(screen.getByText(/テンプレート/)).toBeDefined();
  });

  it('renders show all button', () => {
    render(<KanbanBoard tasks={[]} />);
    expect(screen.getByText('すべて表示')).toBeDefined();
  });

  it('opens add task form on button click', () => {
    render(<KanbanBoard tasks={[]} />);
    fireEvent.click(screen.getByText('+ 新規タスク'));
    expect(screen.getByPlaceholderText('タスク名を入力...')).toBeDefined();
  });

  it('shows description input in add task form', () => {
    render(<KanbanBoard tasks={[]} />);
    fireEvent.click(screen.getByText('+ 新規タスク'));
    expect(screen.getByPlaceholderText('説明を入力...')).toBeDefined();
  });

  it('shows priority selector in add task form', () => {
    render(<KanbanBoard tasks={[]} />);
    fireEvent.click(screen.getByText('+ 新規タスク'));
    expect(screen.getByDisplayValue('中')).toBeDefined();
  });

  it('shows create button in add task form', () => {
    render(<KanbanBoard tasks={[]} />);
    fireEvent.click(screen.getByText('+ 新規タスク'));
    expect(screen.getByText('作成')).toBeDefined();
  });

  it('shows cancel button in add task form', () => {
    render(<KanbanBoard tasks={[]} />);
    fireEvent.click(screen.getByText('+ 新規タスク'));
    expect(screen.getByText('キャンセル')).toBeDefined();
  });

  it('closes add task form on cancel', () => {
    render(<KanbanBoard tasks={[]} />);
    fireEvent.click(screen.getByText('+ 新規タスク'));
    fireEvent.click(screen.getByText('キャンセル'));
    expect(screen.queryByPlaceholderText('タスク名を入力...')).toBeNull();
  });

  it('creates task on form submit', async () => {
    render(<KanbanBoard tasks={mockTasks} />);
    fireEvent.click(screen.getByText('+ 新規タスク'));
    fireEvent.change(screen.getByPlaceholderText('タスク名を入力...'), {
      target: { value: 'New Task' },
    });
    fireEvent.click(screen.getByText('作成'));
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('タスク名を入力...')).toBeNull();
    });
  });

  it('does not create task with empty title', () => {
    render(<KanbanBoard tasks={mockTasks} />);
    fireEvent.click(screen.getByText('+ 新規タスク'));
    const createButton = screen.getByText('作成');
    expect(createButton).toHaveProperty('disabled', true);
  });

  it('toggles filter button', () => {
    render(<KanbanBoard tasks={mockTasks} />);
    const filterButton = screen.getByText('すべて表示');
    fireEvent.click(filterButton);
    expect(screen.getByText('✓ Ready のみ')).toBeDefined();
  });

  it('opens template browser on button click', () => {
    render(<KanbanBoard tasks={[]} />);
    fireEvent.click(screen.getByText(/テンプレート/));
    expect(screen.getByTestId('template-browser')).toBeDefined();
  });

  it('shows close button in template browser', () => {
    render(<KanbanBoard tasks={[]} />);
    fireEvent.click(screen.getByText(/テンプレート/));
    expect(screen.getByText('Close Browser')).toBeDefined();
  });

  it('loads ready tasks on mount', async () => {
    render(<KanbanBoard tasks={mockTasks} />);
    await waitFor(() => {
      expect(screen.getByText('タスクボード')).toBeDefined();
    });
  });

  it('handles task click callback', () => {
    const onTaskClick = vi.fn();
    render(<KanbanBoard tasks={mockTasks} onTaskClick={onTaskClick} />);
    expect(screen.getByTestId('column-TODO')).toBeDefined();
  });

  it('handles task move callback', () => {
    const onTaskMove = vi.fn();
    render(<KanbanBoard tasks={mockTasks} onTaskMove={onTaskMove} />);
    expect(screen.getByTestId('column-稼働中')).toBeDefined();
  });

  it('renders columns with correct task counts', () => {
    render(<KanbanBoard tasks={mockTasks} />);
    expect(screen.getByTestId('count-TODO').textContent).toBe('1');
    expect(screen.getByTestId('count-稼働中').textContent).toBe('1');
    expect(screen.getByTestId('count-終了').textContent).toBe('1');
  });

  it('shows new task form title', () => {
    render(<KanbanBoard tasks={[]} />);
    fireEvent.click(screen.getByText('+ 新規タスク'));
    expect(screen.getByText('新規タスク作成')).toBeDefined();
  });

  it('shows priority options', () => {
    render(<KanbanBoard tasks={[]} />);
    fireEvent.click(screen.getByText('+ 新規タスク'));
    expect(screen.getByText('優先度')).toBeDefined();
  });
});
