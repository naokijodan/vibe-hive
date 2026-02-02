// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeedbackModal, SubtaskModal, DependencyModal, RoleModal, SaveTemplateModal } from './TaskCardModals';

describe('FeedbackModal', () => {
  it('renders header and buttons', () => {
    render(
      <FeedbackModal feedbackText="" setFeedbackText={vi.fn()} onSubmit={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByText('レビューフィードバック')).toBeDefined();
    expect(screen.getByText('保存')).toBeDefined();
    expect(screen.getByText('キャンセル')).toBeDefined();
  });
});

describe('SubtaskModal', () => {
  it('renders header', () => {
    render(
      <SubtaskModal subtaskText="" setSubtaskText={vi.fn()} onSubmit={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByText('サブタスク作成')).toBeDefined();
  });
});

describe('DependencyModal', () => {
  it('renders empty state when no tasks', () => {
    render(
      <DependencyModal
        availableTasks={[]}
        selectedDependencies={[]}
        setSelectedDependencies={vi.fn()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('依存関係設定')).toBeDefined();
    expect(screen.getByText('他のタスクがありません')).toBeDefined();
  });
});

describe('RoleModal', () => {
  it('renders header', () => {
    render(
      <RoleModal roleText="" setRoleText={vi.fn()} onSubmit={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getAllByText(/エージェントの役割設定/i).length).toBeGreaterThan(0);
  });
});

describe('SaveTemplateModal', () => {
  it('renders header and form fields', () => {
    render(
      <SaveTemplateModal
        templateName=""
        setTemplateName={vi.fn()}
        templateDescription=""
        setTemplateDescription={vi.fn()}
        templateCategory=""
        setTemplateCategory={vi.fn()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getAllByText(/テンプレートとして保存/i).length).toBeGreaterThan(0);
    expect(screen.getByText('テンプレート名 *')).toBeDefined();
  });
});
