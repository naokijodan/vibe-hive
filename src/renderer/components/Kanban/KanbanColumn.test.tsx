// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { KanbanColumn } from './KanbanColumn';

vi.mock('@dnd-kit/core', () => ({
  useDroppable: vi.fn(() => ({ setNodeRef: vi.fn(), isOver: false })),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: {},
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

vi.mock('./TaskCard', () => ({
  TaskCard: ({ task }: { task: { title: string } }) => <div>{task.title}</div>,
}));

const mockTask = {
  id: 't1',
  sessionId: 's1',
  title: 'Test Task',
  status: 'todo' as const,
  priority: 'medium' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('KanbanColumn', () => {
  it('renders column title and task count', () => {
    render(<KanbanColumn id="todo" title="To Do" type="waiting" tasks={[mockTask]} />);
    expect(screen.getByText('To Do')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
  });

  it('shows empty state when no tasks', () => {
    render(<KanbanColumn id="todo" title="To Do" type="waiting" tasks={[]} />);
    expect(screen.getByText('ドロップしてタスクを追加')).toBeDefined();
  });

  it('renders task cards', () => {
    render(<KanbanColumn id="todo" title="To Do" type="running" tasks={[mockTask]} />);
    expect(screen.getByText('Test Task')).toBeDefined();
  });
});
