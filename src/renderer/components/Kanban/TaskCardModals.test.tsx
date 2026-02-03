// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedbackModal, SubtaskModal, DependencyModal, RoleModal, SaveTemplateModal } from './TaskCardModals';

describe('FeedbackModal', () => {
  const defaultProps = {
    feedbackText: '',
    setFeedbackText: vi.fn(),
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header and buttons', () => {
    render(<FeedbackModal {...defaultProps} />);
    expect(screen.getByText('レビューフィードバック')).toBeDefined();
    expect(screen.getByText('保存')).toBeDefined();
    expect(screen.getByText('キャンセル')).toBeDefined();
  });

  it('renders textarea', () => {
    render(<FeedbackModal {...defaultProps} />);
    expect(screen.getByPlaceholderText(/フィードバック/i)).toBeDefined();
  });

  it('displays current feedback text', () => {
    render(<FeedbackModal {...defaultProps} feedbackText="Test feedback" />);
    expect(screen.getByDisplayValue('Test feedback')).toBeDefined();
  });

  it('calls setFeedbackText on input change', () => {
    render(<FeedbackModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/フィードバック/i), {
      target: { value: 'New feedback' },
    });
    expect(defaultProps.setFeedbackText).toHaveBeenCalledWith('New feedback');
  });

  it('calls onSubmit on save button click', () => {
    render(<FeedbackModal {...defaultProps} />);
    fireEvent.click(screen.getByText('保存'));
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('calls onClose on cancel button click', () => {
    render(<FeedbackModal {...defaultProps} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

describe('SubtaskModal', () => {
  const defaultProps = {
    subtaskText: '',
    setSubtaskText: vi.fn(),
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header', () => {
    render(<SubtaskModal {...defaultProps} />);
    expect(screen.getByText('サブタスク作成')).toBeDefined();
  });

  it('renders textarea', () => {
    render(<SubtaskModal {...defaultProps} />);
    expect(screen.getByPlaceholderText(/サブタスク/i)).toBeDefined();
  });

  it('displays current subtask text', () => {
    render(<SubtaskModal {...defaultProps} subtaskText="Task 1" />);
    expect(screen.getByDisplayValue('Task 1')).toBeDefined();
  });

  it('calls setSubtaskText on input change', () => {
    render(<SubtaskModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/サブタスク/i), {
      target: { value: 'New subtask' },
    });
    expect(defaultProps.setSubtaskText).toHaveBeenCalledWith('New subtask');
  });

  it('calls onSubmit on create button click', () => {
    render(<SubtaskModal {...defaultProps} />);
    fireEvent.click(screen.getByText('作成'));
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('calls onClose on cancel button click', () => {
    render(<SubtaskModal {...defaultProps} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows instructions for multiple subtasks', () => {
    render(<SubtaskModal {...defaultProps} />);
    expect(screen.getByText(/1行に1つ/i)).toBeDefined();
  });
});

describe('DependencyModal', () => {
  const defaultProps = {
    availableTasks: [],
    selectedDependencies: [],
    setSelectedDependencies: vi.fn(),
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header', () => {
    render(<DependencyModal {...defaultProps} />);
    expect(screen.getByText('依存関係設定')).toBeDefined();
  });

  it('renders empty state when no tasks', () => {
    render(<DependencyModal {...defaultProps} />);
    expect(screen.getByText('他のタスクがありません')).toBeDefined();
  });

  it('renders task list when tasks exist', () => {
    const tasks = [
      { id: 't1', title: 'Task 1', status: 'todo' as const },
      { id: 't2', title: 'Task 2', status: 'done' as const },
    ];
    render(<DependencyModal {...defaultProps} availableTasks={tasks} />);
    expect(screen.getByText('Task 1')).toBeDefined();
    expect(screen.getByText('Task 2')).toBeDefined();
  });

  it('shows checkboxes for tasks', () => {
    const tasks = [{ id: 't1', title: 'Task 1', status: 'todo' as const }];
    render(<DependencyModal {...defaultProps} availableTasks={tasks} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('pre-selects dependencies', () => {
    const tasks = [{ id: 't1', title: 'Task 1', status: 'todo' as const }];
    render(
      <DependencyModal {...defaultProps} availableTasks={tasks} selectedDependencies={['t1']} />
    );
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('calls setSelectedDependencies on checkbox change', () => {
    const tasks = [{ id: 't1', title: 'Task 1', status: 'todo' as const }];
    render(<DependencyModal {...defaultProps} availableTasks={tasks} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(defaultProps.setSelectedDependencies).toHaveBeenCalled();
  });

  it('calls onSubmit on save button click', () => {
    render(<DependencyModal {...defaultProps} />);
    fireEvent.click(screen.getByText('保存'));
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('calls onClose on cancel button click', () => {
    render(<DependencyModal {...defaultProps} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

describe('RoleModal', () => {
  const defaultProps = {
    roleText: '',
    setRoleText: vi.fn(),
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header', () => {
    render(<RoleModal {...defaultProps} />);
    expect(screen.getAllByText(/エージェントの役割設定/i).length).toBeGreaterThan(0);
  });

  it('renders textarea', () => {
    render(<RoleModal {...defaultProps} />);
    expect(screen.getByPlaceholderText(/あなたはReactとTypeScriptの専門家です/i)).toBeDefined();
  });

  it('displays current role text', () => {
    render(<RoleModal {...defaultProps} roleText="Developer role" />);
    expect(screen.getByDisplayValue('Developer role')).toBeDefined();
  });

  it('calls setRoleText on input change', () => {
    render(<RoleModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/あなたはReactとTypeScriptの専門家です/i), {
      target: { value: 'New role' },
    });
    expect(defaultProps.setRoleText).toHaveBeenCalledWith('New role');
  });

  it('calls onSubmit on save button click', () => {
    render(<RoleModal {...defaultProps} />);
    fireEvent.click(screen.getByText('保存'));
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('calls onClose on cancel button click', () => {
    render(<RoleModal {...defaultProps} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

describe('SaveTemplateModal', () => {
  const defaultProps = {
    templateName: '',
    setTemplateName: vi.fn(),
    templateDescription: '',
    setTemplateDescription: vi.fn(),
    templateCategory: '',
    setTemplateCategory: vi.fn(),
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    expect(screen.getAllByText(/テンプレートとして保存/i).length).toBeGreaterThan(0);
  });

  it('renders template name field', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    expect(screen.getByText('テンプレート名 *')).toBeDefined();
  });

  it('renders description field', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    expect(screen.getByText('説明')).toBeDefined();
  });

  it('renders category field', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    expect(screen.getByText('カテゴリ')).toBeDefined();
  });

  it('displays current template name', () => {
    render(<SaveTemplateModal {...defaultProps} templateName="My Template" />);
    expect(screen.getByDisplayValue('My Template')).toBeDefined();
  });

  it('displays current description', () => {
    render(<SaveTemplateModal {...defaultProps} templateDescription="Test description" />);
    expect(screen.getByDisplayValue('Test description')).toBeDefined();
  });

  it('displays current category', () => {
    render(<SaveTemplateModal {...defaultProps} templateCategory="Development" />);
    expect(screen.getByDisplayValue('Development')).toBeDefined();
  });

  it('calls setTemplateName on name input change', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('テンプレート名を入力'), {
      target: { value: 'New Template' },
    });
    expect(defaultProps.setTemplateName).toHaveBeenCalledWith('New Template');
  });

  it('calls setTemplateDescription on description input change', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('テンプレートの説明（オプション）'), {
      target: { value: 'New description' },
    });
    expect(defaultProps.setTemplateDescription).toHaveBeenCalledWith('New description');
  });

  it('calls setTemplateCategory on category input change', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('例：フロントエンド, バックエンド'), {
      target: { value: 'New category' },
    });
    expect(defaultProps.setTemplateCategory).toHaveBeenCalledWith('New category');
  });

  it('calls onSubmit on save button click', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    fireEvent.click(screen.getByText('保存'));
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('calls onClose on cancel button click', () => {
    render(<SaveTemplateModal {...defaultProps} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
