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
});
