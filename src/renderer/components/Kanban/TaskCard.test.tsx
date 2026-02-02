// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TaskCard } from './TaskCard';

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  CSS: { Transform: { toString: vi.fn(() => '') } },
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}));

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

vi.mock('../../stores/agentStore', () => ({
  useAgentStore: () => ({ agents: [] }),
}));

vi.mock('../../stores/taskStore', () => ({
  useTaskStore: () => ({
    tasks: [],
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  }),
}));

vi.mock('../../stores/executionStore', () => ({
  useExecutionStore: () => ({ executions: [], runningExecutions: [] }),
}));

vi.mock('../../stores/templateStore', () => ({
  useTemplateStore: () => ({ createTemplate: vi.fn() }),
}));

vi.mock('../../bridge/ipcBridge', () => ({
  default: {
    task: {
      getDependencies: vi.fn().mockResolvedValue([]),
      addDependency: vi.fn().mockResolvedValue(true),
      removeDependency: vi.fn().mockResolvedValue(true),
      checkDependenciesReady: vi.fn().mockResolvedValue(true),
      isReadyToExecute: vi.fn().mockResolvedValue(true),
    },
    execution: {
      start: vi.fn().mockResolvedValue({ executionId: 'e1' }),
    },
  },
}));

vi.mock('./TaskCardModals', () => ({
  FeedbackModal: () => null,
  SubtaskModal: () => null,
  DependencyModal: () => null,
  RoleModal: () => null,
  SaveTemplateModal: () => null,
}));

const mockTask = {
  id: 't1',
  sessionId: 's1',
  title: 'Test Task',
  description: 'Description',
  status: 'todo' as const,
  priority: 'medium' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TaskCard', () => {
  it('renders task title', () => {
    render(<TaskCard task={mockTask as any} />);
    expect(screen.getByText('Test Task')).toBeDefined();
  });

  it('renders priority indicator', () => {
    render(<TaskCard task={mockTask as any} />);
    expect(screen.getByText('medium')).toBeDefined();
  });
});
