// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

const mockAssignTaskToAgent = vi.fn();
const mockUpdateTask = vi.fn();
const mockUpdateTaskStatus = vi.fn();
const mockDeleteTask = vi.fn().mockResolvedValue(true);
const mockSetReviewFeedback = vi.fn();
const mockCreateSubtasks = vi.fn();
const mockSetDependencies = vi.fn();
const mockCheckDependencies = vi.fn().mockResolvedValue({ met: true, completed: 2, total: 2, blocking: [] });
const mockStartExecution = vi.fn();
const mockCreateTemplate = vi.fn();

vi.mock('../../stores/agentStore', () => ({
  useAgentStore: () => ({
    agents: [
      { id: 'a1', name: 'Claude', status: 'idle' },
      { id: 'a2', name: 'Agent-2', status: 'executing' },
      { id: 'a3', name: 'Error Agent', status: 'error' },
    ],
    assignTaskToAgent: mockAssignTaskToAgent,
  }),
}));

vi.mock('../../stores/taskStore', () => ({
  useTaskStore: () => ({
    tasks: [
      { id: 't2', title: 'Other Task', status: 'done' },
      { id: 't3', title: 'Another Task', status: 'todo' },
    ],
    updateTask: mockUpdateTask,
    updateTaskStatus: mockUpdateTaskStatus,
    deleteTask: mockDeleteTask,
    checkDependencies: mockCheckDependencies,
    setReviewFeedback: mockSetReviewFeedback,
    createSubtasks: mockCreateSubtasks,
    setDependencies: mockSetDependencies,
  }),
}));

vi.mock('../../stores/executionStore', () => ({
  useExecutionStore: () => ({
    executions: [],
    runningExecutions: [],
    startExecution: mockStartExecution,
  }),
}));

vi.mock('../../stores/templateStore', () => ({
  useTemplateStore: () => ({ createTemplate: mockCreateTemplate }),
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
  FeedbackModal: ({ onClose, onSubmit }: any) => (
    <div data-testid="feedback-modal">
      <button onClick={onSubmit}>Submit FB</button>
      <button onClick={onClose}>Close FB</button>
    </div>
  ),
  SubtaskModal: ({ onClose, onSubmit }: any) => (
    <div data-testid="subtask-modal">
      <button onClick={onSubmit}>Submit ST</button>
      <button onClick={onClose}>Close ST</button>
    </div>
  ),
  DependencyModal: ({ onClose, onSubmit }: any) => (
    <div data-testid="dependency-modal">
      <button onClick={onSubmit}>Submit Dep</button>
      <button onClick={onClose}>Close Dep</button>
    </div>
  ),
  RoleModal: ({ onClose, onSubmit }: any) => (
    <div data-testid="role-modal">
      <button onClick={onSubmit}>Submit Role</button>
      <button onClick={onClose}>Close Role</button>
    </div>
  ),
  SaveTemplateModal: ({ onClose, onSubmit }: any) => (
    <div data-testid="save-template-modal">
      <button onClick={onSubmit}>Save Tmpl</button>
      <button onClick={onClose}>Close Tmpl</button>
    </div>
  ),
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task title', () => {
    render(<TaskCard task={mockTask as any} />);
    expect(screen.getByText('Test Task')).toBeDefined();
  });

  it('renders priority indicator', () => {
    render(<TaskCard task={mockTask as any} />);
    expect(screen.getByText('medium')).toBeDefined();
  });

  it('renders task description', () => {
    render(<TaskCard task={mockTask as any} />);
    expect(screen.getByText('Description')).toBeDefined();
  });

  it('renders urgent priority styling', () => {
    const urgentTask = { ...mockTask, priority: 'urgent' as const };
    render(<TaskCard task={urgentTask as any} />);
    expect(screen.getByText('urgent')).toBeDefined();
  });

  it('renders high priority styling', () => {
    const highTask = { ...mockTask, priority: 'high' as const };
    render(<TaskCard task={highTask as any} />);
    expect(screen.getByText('high')).toBeDefined();
  });

  it('renders low priority styling', () => {
    const lowTask = { ...mockTask, priority: 'low' as const };
    render(<TaskCard task={lowTask as any} />);
    expect(screen.getByText('low')).toBeDefined();
  });

  it('renders drag overlay mode', () => {
    const { container } = render(<TaskCard task={mockTask as any} isDragOverlay />);
    expect(container.innerHTML).toContain('Test Task');
  });

  it('shows unassigned agent text by default', () => {
    render(<TaskCard task={mockTask as any} />);
    expect(screen.getByText('未割当')).toBeDefined();
  });

  it('shows assigned agent name', () => {
    const assignedTask = { ...mockTask, assignedAgentId: 'a1' };
    render(<TaskCard task={assignedTask as any} />);
    expect(screen.getByText('🤖 Claude')).toBeDefined();
  });

  it('shows agent status badge', () => {
    const assignedTask = { ...mockTask, assignedAgentId: 'a2' };
    render(<TaskCard task={assignedTask as any} />);
    expect(screen.getByText('Executing')).toBeDefined();
  });

  it('shows error indicator for error agent', () => {
    const errorTask = { ...mockTask, assignedAgentId: 'a3' };
    render(<TaskCard task={errorTask as any} />);
    expect(screen.getByText('⚠')).toBeDefined();
  });

  it('shows subtask indicator', () => {
    const subtaskTask = { ...mockTask, subtasks: ['Sub1', 'Sub2'] };
    render(<TaskCard task={subtaskTask as any} />);
    expect(screen.getByText('📋')).toBeDefined();
  });

  it('shows review feedback indicator', () => {
    const feedbackTask = { ...mockTask, reviewFeedback: 'Some feedback' };
    render(<TaskCard task={feedbackTask as any} />);
    expect(screen.getByText('💬')).toBeDefined();
  });

  it('opens agent dropdown on click', () => {
    render(<TaskCard task={mockTask as any} />);
    fireEvent.click(screen.getByText('未割当'));
    expect(screen.getByText('🤖 Claude')).toBeDefined();
    expect(screen.getByText('🤖 Agent-2')).toBeDefined();
  });

  it('renders execute button for todo task', () => {
    render(<TaskCard task={mockTask as any} />);
    expect(screen.getByText('▶ 実行')).toBeDefined();
  });

  it('renders role button', () => {
    render(<TaskCard task={mockTask as any} />);
    expect(screen.getByText('🎭 役割')).toBeDefined();
  });

  it('renders subtask decompose button', () => {
    render(<TaskCard task={mockTask as any} />);
    expect(screen.getByText('📋 分解')).toBeDefined();
  });

  it('renders dependency button', () => {
    render(<TaskCard task={mockTask as any} />);
    expect(screen.getByText('🔗 依存')).toBeDefined();
  });

  it('renders save template button', () => {
    render(<TaskCard task={mockTask as any} />);
    expect(screen.getByText('💾 保存')).toBeDefined();
  });

  it('renders delete button', () => {
    render(<TaskCard task={mockTask as any} />);
    expect(screen.getByText('🗑')).toBeDefined();
  });

  it('shows delete confirmation on delete click', () => {
    render(<TaskCard task={mockTask as any} />);
    fireEvent.click(screen.getByText('🗑'));
    expect(screen.getByText('削除？')).toBeDefined();
    expect(screen.getByText('はい')).toBeDefined();
    expect(screen.getByText('いいえ')).toBeDefined();
  });

  it('cancels delete on no click', () => {
    render(<TaskCard task={mockTask as any} />);
    fireEvent.click(screen.getByText('🗑'));
    fireEvent.click(screen.getByText('いいえ'));
    expect(screen.queryByText('削除？')).toBeNull();
  });

  it('confirms delete on yes click', async () => {
    render(<TaskCard task={mockTask as any} />);
    fireEvent.click(screen.getByText('🗑'));
    fireEvent.click(screen.getByText('はい'));
    await waitFor(() => {
      expect(mockDeleteTask).toHaveBeenCalledWith('t1');
    });
  });

  it('shows feedback button for review status', () => {
    const reviewTask = { ...mockTask, status: 'review' as const };
    render(<TaskCard task={reviewTask as any} />);
    expect(screen.getByText('💬 FB')).toBeDefined();
  });

  it('opens role modal on role button click', () => {
    render(<TaskCard task={mockTask as any} />);
    fireEvent.click(screen.getByText('🎭 役割'));
    expect(screen.getByTestId('role-modal')).toBeDefined();
  });

  it('opens subtask modal on decompose button click', () => {
    render(<TaskCard task={mockTask as any} />);
    fireEvent.click(screen.getByText('📋 分解'));
    expect(screen.getByTestId('subtask-modal')).toBeDefined();
  });

  it('opens dependency modal on dependency button click', () => {
    render(<TaskCard task={mockTask as any} />);
    fireEvent.click(screen.getByText('🔗 依存'));
    expect(screen.getByTestId('dependency-modal')).toBeDefined();
  });

  it('opens save template modal on save button click', () => {
    render(<TaskCard task={mockTask as any} />);
    fireEvent.click(screen.getByText('💾 保存'));
    expect(screen.getByTestId('save-template-modal')).toBeDefined();
  });

  it('opens feedback modal for review task', () => {
    const reviewTask = { ...mockTask, status: 'review' as const };
    render(<TaskCard task={reviewTask as any} />);
    fireEvent.click(screen.getByText('💬 FB'));
    expect(screen.getByTestId('feedback-modal')).toBeDefined();
  });

  it('handles click callback', () => {
    const onClick = vi.fn();
    render(<TaskCard task={mockTask as any} onClick={onClick} />);
    fireEvent.click(screen.getByText('Test Task'));
    expect(onClick).toHaveBeenCalledWith(mockTask);
  });

  it('shows role badge when role is set', () => {
    const roleTask = { ...mockTask, role: 'Developer' };
    render(<TaskCard task={roleTask as any} />);
    expect(screen.getByText('🎭 役割')).toBeDefined();
  });

  it('shows dependency progress when dependencies exist', async () => {
    const depTask = { ...mockTask, dependsOn: ['t2'] };
    render(<TaskCard task={depTask as any} />);
    await waitFor(() => {
      expect(screen.getByText(/依存: 2\/2/)).toBeDefined();
    });
  });

  it('does not show execute button for in_progress task', () => {
    const inProgressTask = { ...mockTask, status: 'in_progress' as const };
    render(<TaskCard task={inProgressTask as any} />);
    expect(screen.queryByText('▶ 実行')).toBeNull();
  });

  it('shows ready indicator when ready to execute', async () => {
    render(<TaskCard task={mockTask as any} />);
    await waitFor(() => {
      expect(screen.getByTitle('実行準備完了')).toBeDefined();
    });
  });
});
