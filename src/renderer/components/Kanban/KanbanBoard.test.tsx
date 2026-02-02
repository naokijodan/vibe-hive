// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
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
  KanbanColumn: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('./TaskCard', () => ({
  TaskCard: () => <div>TaskCard</div>,
}));

vi.mock('../Template', () => ({
  TemplateBrowser: () => null,
}));

vi.mock('../../stores/taskStore', () => ({
  useTaskStore: () => ({ createTask: vi.fn() }),
}));

vi.mock('../../bridge/ipcBridge', () => ({
  default: {
    task: {
      checkDependenciesReady: vi.fn().mockResolvedValue(true),
      getReadyTasks: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe('KanbanBoard', () => {
  it('renders all columns', () => {
    render(<KanbanBoard tasks={[]} />);
    expect(screen.getByText('TODO')).toBeDefined();
    expect(screen.getByText('稼働中')).toBeDefined();
    expect(screen.getByText('確認待ち')).toBeDefined();
    expect(screen.getByText('終了')).toBeDefined();
  });
});
