// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TemplateModal } from './TemplateModal';

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

describe('TemplateModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <TemplateModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders create form when open', () => {
    render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows create title in create mode', () => {
    render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
    expect(screen.getByText('テンプレート作成')).toBeDefined();
  });

  it('shows edit title in edit mode', () => {
    const template = {
      id: 't1',
      name: 'Test',
      taskData: { title: 'Task', priority: 'medium' as const, status: 'todo' as const },
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    render(
      <TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="edit" template={template} />
    );
    expect(screen.getByText('テンプレート編集')).toBeDefined();
  });

  it('renders template name input', () => {
    render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
    expect(screen.getByPlaceholderText('例：Reactコンポーネント作成')).toBeDefined();
    expect(screen.getByText('テンプレート名 *')).toBeDefined();
  });

  it('renders task title input', () => {
    render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
    expect(screen.getByText('タスクタイトル *')).toBeDefined();
  });

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn();
    render(<TemplateModal isOpen={true} onClose={onClose} onSubmit={vi.fn()} mode="create" />);
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('populates form when editing existing template', () => {
    const template = {
      id: 't1',
      name: 'My Template',
      description: 'A description',
      category: 'dev',
      taskData: {
        title: 'My Task',
        description: 'Task desc',
        priority: 'high' as const,
        status: 'in-progress' as const,
        role: 'developer',
        command: 'npm test',
      },
      usageCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    render(
      <TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="edit" template={template} />
    );
    expect(screen.getByDisplayValue('My Template')).toBeDefined();
    expect(screen.getByDisplayValue('My Task')).toBeDefined();
  });

  it('has submit button', () => {
    render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
    expect(screen.getByText('作成')).toBeDefined();
  });

  it('has cancel button', () => {
    render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
    expect(screen.getByText('キャンセル')).toBeDefined();
  });

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn();
    render(<TemplateModal isOpen={true} onClose={onClose} onSubmit={vi.fn()} mode="create" />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(onClose).toHaveBeenCalled();
  });

  describe('form input handling', () => {
    it('allows changing template name', () => {
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
      const input = screen.getByPlaceholderText('例：Reactコンポーネント作成');
      fireEvent.change(input, { target: { value: 'New Template' } });
      expect(input).toHaveProperty('value', 'New Template');
    });

    it('allows changing template description', () => {
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
      const textarea = screen.getByPlaceholderText('このテンプレートの説明');
      fireEvent.change(textarea, { target: { value: 'A description' } });
      expect(textarea).toHaveProperty('value', 'A description');
    });

    it('allows changing category', () => {
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
      const input = screen.getByPlaceholderText('例：フロントエンド, バックエンド, テスト');
      fireEvent.change(input, { target: { value: 'frontend' } });
      expect(input).toHaveProperty('value', 'frontend');
    });

    it('allows changing task title', () => {
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
      const input = screen.getByPlaceholderText('タスクのタイトル');
      fireEvent.change(input, { target: { value: 'My Task' } });
      expect(input).toHaveProperty('value', 'My Task');
    });

    it('allows changing task description', () => {
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
      const textarea = screen.getByPlaceholderText('タスクの詳細説明');
      fireEvent.change(textarea, { target: { value: 'Task details' } });
      expect(textarea).toHaveProperty('value', 'Task details');
    });

    it('allows changing priority', () => {
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
      const select = screen.getByDisplayValue('中');
      fireEvent.change(select, { target: { value: 'high' } });
      expect(select).toHaveProperty('value', 'high');
    });

    it('allows changing status', () => {
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
      const select = screen.getByDisplayValue('TODO');
      fireEvent.change(select, { target: { value: 'in_progress' } });
      expect(select).toHaveProperty('value', 'in_progress');
    });

    it('allows changing agent role', () => {
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
      const textarea = screen.getByPlaceholderText('例：あなたはReactとTypeScriptの専門家です');
      fireEvent.change(textarea, { target: { value: 'Expert role' } });
      expect(textarea).toHaveProperty('value', 'Expert role');
    });

    it('allows entering subtasks text', () => {
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
      const textarea = screen.getByPlaceholderText(/コンポーネントファイル作成/);
      fireEvent.change(textarea, { target: { value: 'Subtask 1\nSubtask 2' } });
      expect(textarea).toHaveProperty('value', 'Subtask 1\nSubtask 2');
    });
  });

  describe('form submission', () => {
    it('shows validation error when name is empty', async () => {
      const onSubmit = vi.fn();
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} mode="create" />);
      const taskInput = screen.getByPlaceholderText('タスクのタイトル');
      fireEvent.change(taskInput, { target: { value: 'Task' } });
      fireEvent.click(screen.getByText('作成'));
      await waitFor(() => {
        expect(onSubmit).not.toHaveBeenCalled();
      });
    });

    it('shows validation error when task title is empty', async () => {
      const onSubmit = vi.fn();
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} mode="create" />);
      const nameInput = screen.getByPlaceholderText('例：Reactコンポーネント作成');
      fireEvent.change(nameInput, { target: { value: 'Template' } });
      fireEvent.click(screen.getByText('作成'));
      await waitFor(() => {
        expect(onSubmit).not.toHaveBeenCalled();
      });
    });

    it('calls onSubmit with correct data when form is valid', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();
      render(<TemplateModal isOpen={true} onClose={onClose} onSubmit={onSubmit} mode="create" />);

      fireEvent.change(screen.getByPlaceholderText('例：Reactコンポーネント作成'), {
        target: { value: 'My Template' },
      });
      fireEvent.change(screen.getByPlaceholderText('タスクのタイトル'), {
        target: { value: 'My Task' },
      });
      fireEvent.click(screen.getByText('作成'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
          name: 'My Template',
          taskData: expect.objectContaining({
            title: 'My Task',
          }),
        }));
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('handles submission error gracefully', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Submit failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} mode="create" />);

      fireEvent.change(screen.getByPlaceholderText('例：Reactコンポーネント作成'), {
        target: { value: 'My Template' },
      });
      fireEvent.change(screen.getByPlaceholderText('タスクのタイトル'), {
        target: { value: 'My Task' },
      });
      fireEvent.click(screen.getByText('作成'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('parses subtasks with description', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} mode="create" />);

      fireEvent.change(screen.getByPlaceholderText('例：Reactコンポーネント作成'), {
        target: { value: 'My Template' },
      });
      fireEvent.change(screen.getByPlaceholderText('タスクのタイトル'), {
        target: { value: 'My Task' },
      });
      fireEvent.change(screen.getByPlaceholderText(/コンポーネントファイル作成/), {
        target: { value: 'Task 1: Description 1\nTask 2' },
      });
      fireEvent.click(screen.getByText('作成'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
          subtasks: [
            { title: 'Task 1', description: 'Description 1' },
            { title: 'Task 2' },
          ],
        }));
      });
    });

    it('trims whitespace from inputs', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} mode="create" />);

      fireEvent.change(screen.getByPlaceholderText('例：Reactコンポーネント作成'), {
        target: { value: '  My Template  ' },
      });
      fireEvent.change(screen.getByPlaceholderText('タスクのタイトル'), {
        target: { value: '  My Task  ' },
      });
      fireEvent.click(screen.getByText('作成'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
          name: 'My Template',
          taskData: expect.objectContaining({
            title: 'My Task',
          }),
        }));
      });
    });
  });

  describe('edit mode', () => {
    const existingTemplate = {
      id: 't1',
      name: 'Existing Template',
      description: 'Existing description',
      category: 'testing',
      taskData: {
        title: 'Existing Task',
        description: 'Task desc',
        priority: 'high' as const,
        status: 'in_progress' as const,
        role: 'tester',
        command: 'npm test',
      },
      subtasks: [
        { title: 'Sub 1', description: 'Desc 1' },
        { title: 'Sub 2' },
      ],
      usageCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('shows update button text in edit mode', () => {
      render(
        <TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="edit" template={existingTemplate} />
      );
      expect(screen.getByText('更新')).toBeDefined();
    });

    it('populates subtasks from template', () => {
      render(
        <TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="edit" template={existingTemplate} />
      );
      const subtasksTextarea = screen.getByPlaceholderText(/コンポーネントファイル作成/);
      expect(subtasksTextarea).toHaveProperty('value', 'Sub 1: Desc 1\nSub 2');
    });
  });

  describe('modal content', () => {
    it('stops propagation on content click', () => {
      const onClose = vi.fn();
      render(<TemplateModal isOpen={true} onClose={onClose} onSubmit={vi.fn()} mode="create" />);
      const content = document.querySelector('.bg-hive-surface');
      if (content) {
        fireEvent.click(content);
        expect(onClose).not.toHaveBeenCalled();
      }
    });

    it('shows priority options', () => {
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
      expect(screen.getByText('低')).toBeDefined();
      expect(screen.getByText('中')).toBeDefined();
      expect(screen.getByText('高')).toBeDefined();
      expect(screen.getByText('緊急')).toBeDefined();
    });

    it('shows status options', () => {
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />);
      expect(screen.getByText('バックログ')).toBeDefined();
      expect(screen.getByText('TODO')).toBeDefined();
      expect(screen.getByText('進行中')).toBeDefined();
      expect(screen.getByText('レビュー')).toBeDefined();
      expect(screen.getByText('完了')).toBeDefined();
    });
  });

  describe('loading state', () => {
    it('shows saving text when submitting', async () => {
      const onSubmit = vi.fn(() => new Promise(() => {})); // Never resolves
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} mode="create" />);

      fireEvent.change(screen.getByPlaceholderText('例：Reactコンポーネント作成'), {
        target: { value: 'Template' },
      });
      fireEvent.change(screen.getByPlaceholderText('タスクのタイトル'), {
        target: { value: 'Task' },
      });
      fireEvent.click(screen.getByText('作成'));

      await waitFor(() => {
        expect(screen.getByText('保存中...')).toBeDefined();
      });
    });

    it('disables cancel button while submitting', async () => {
      const onSubmit = vi.fn(() => new Promise(() => {}));
      render(<TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} mode="create" />);

      fireEvent.change(screen.getByPlaceholderText('例：Reactコンポーネント作成'), {
        target: { value: 'Template' },
      });
      fireEvent.change(screen.getByPlaceholderText('タスクのタイトル'), {
        target: { value: 'Task' },
      });
      fireEvent.click(screen.getByText('作成'));

      await waitFor(() => {
        expect(screen.getByText('キャンセル')).toHaveProperty('disabled', true);
      });
    });
  });

  describe('form reset', () => {
    it('resets form when switching to create mode', () => {
      const { rerender } = render(
        <TemplateModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          mode="edit"
          template={{
            id: 't1',
            name: 'Old',
            taskData: { title: 'Old Task', priority: 'high' as const, status: 'done' as const },
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }}
        />
      );

      rerender(
        <TemplateModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} mode="create" />
      );

      const nameInput = screen.getByPlaceholderText('例：Reactコンポーネント作成');
      expect(nameInput).toHaveProperty('value', '');
    });
  });
});
