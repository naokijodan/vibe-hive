// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TemplateBrowser } from './TemplateBrowser';

vi.mock('../../stores/templateStore', () => ({
  useTemplateStore: () => ({
    templates: [],
    isLoading: false,
    error: null,
    selectedTemplateId: null,
    selectedCategory: null,
    loadTemplates: vi.fn(),
    setSelectedTemplate: vi.fn(),
    setCategory: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
  }),
}));

vi.mock('../../stores/taskStore', () => ({
  useTaskStore: () => ({ addTask: vi.fn() }),
}));

vi.mock('./TemplateCard', () => ({
  TemplateCard: () => <div>TemplateCard</div>,
}));

vi.mock('./TemplateModal', () => ({
  TemplateModal: () => null,
}));

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

describe('TemplateBrowser', () => {
  it('renders nothing when not open', () => {
    const { container } = render(<TemplateBrowser isOpen={false} onClose={vi.fn()} sessionId="s1" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders template browser when open', () => {
    render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
    expect(screen.getByText('テンプレートブラウザ')).toBeDefined();
  });
});
