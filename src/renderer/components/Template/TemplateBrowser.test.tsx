// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateBrowser } from './TemplateBrowser';

const mockLoadTemplates = vi.fn();
const mockLoadPopularTemplates = vi.fn();
const mockSetSearchQuery = vi.fn();
const mockSetSelectedCategory = vi.fn();
const mockClearFilters = vi.fn();

vi.mock('../../stores/templateStore', () => ({
  useTemplateStore: () => ({
    templates: [
      { id: 't1', name: 'Template 1', description: 'Desc 1', category: 'general', usageCount: 5 },
    ],
    isLoading: false,
    error: null,
    selectedTemplateId: null,
    selectedCategory: null,
    searchQuery: '',
    loadTemplates: mockLoadTemplates,
    loadPopularTemplates: mockLoadPopularTemplates,
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    setSelectedTemplate: vi.fn(),
    setSelectedCategory: mockSetSelectedCategory,
    setSearchQuery: mockSetSearchQuery,
    clearFilters: mockClearFilters,
    incrementUsageCount: vi.fn(),
  }),
}));

vi.mock('../../stores/taskStore', () => ({
  useTaskStore: () => ({ createTask: vi.fn() }),
}));

vi.mock('./TemplateCard', () => ({
  TemplateCard: ({ template }: any) => <div data-testid="template-card">{template.name}</div>,
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

  it('loads templates on mount', () => {
    render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
    expect(mockLoadTemplates).toHaveBeenCalled();
  });

  it('shows template cards', () => {
    render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
    expect(screen.getByText('Template 1')).toBeDefined();
  });

  it('has search input', () => {
    render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
    const search = screen.getByPlaceholderText(/検索/i);
    expect(search).toBeDefined();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<TemplateBrowser isOpen={true} onClose={onClose} sessionId="s1" />);
    const closeBtn = screen.getByText('✕');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
