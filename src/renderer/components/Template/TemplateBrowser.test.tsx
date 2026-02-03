// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TemplateBrowser } from './TemplateBrowser';

const { mockFns, mockStoreState } = vi.hoisted(() => ({
  mockFns: {
    loadTemplates: vi.fn(),
    loadPopularTemplates: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    setSelectedTemplate: vi.fn(),
    setSelectedCategory: vi.fn(),
    setSearchQuery: vi.fn(),
    clearFilters: vi.fn(),
    incrementUsageCount: vi.fn().mockResolvedValue(undefined),
    createTask: vi.fn().mockResolvedValue({ id: 'task1' }),
  },
  mockStoreState: {
    templates: [
      { id: 't1', name: 'Template 1', description: 'Desc 1', category: 'general', usageCount: 5, taskData: { title: 'Task', description: 'Desc', priority: 'medium', role: 'developer' } },
    ] as any[],
    isLoading: false,
    error: null as string | null,
    selectedTemplateId: null as string | null,
    selectedCategory: null as string | null,
    searchQuery: '',
  },
}));

vi.mock('../../stores/templateStore', () => ({
  useTemplateStore: () => ({
    ...mockStoreState,
    ...mockFns,
  }),
}));

vi.mock('../../stores/taskStore', () => ({
  useTaskStore: () => ({ createTask: mockFns.createTask }),
}));

vi.mock('./TemplateCard', () => ({
  TemplateCard: ({ template, onSelect, isSelected }: any) => (
    <div data-testid="template-card" data-selected={isSelected}>
      {template.name}
      <button onClick={() => onSelect(template)}>Select</button>
    </div>
  ),
}));

vi.mock('./TemplateModal', () => ({
  TemplateModal: ({ isOpen }: any) => (isOpen ? <div data-testid="template-modal">Modal</div> : null),
}));

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

describe('TemplateBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.templates = [
      { id: 't1', name: 'Template 1', description: 'Desc 1', category: 'general', usageCount: 5, taskData: { title: 'Task', description: 'Desc', priority: 'medium', role: 'developer' } },
    ];
    mockStoreState.isLoading = false;
    mockStoreState.error = null;
    mockStoreState.selectedTemplateId = null;
    mockStoreState.selectedCategory = null;
    mockStoreState.searchQuery = '';
  });

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
    expect(mockFns.loadTemplates).toHaveBeenCalled();
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

  describe('view mode toggle', () => {
    it('renders view mode buttons', () => {
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(screen.getByText('すべて')).toBeDefined();
      expect(screen.getByText('人気')).toBeDefined();
    });

    it('has all button active by default', () => {
      const { container } = render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      const allBtn = screen.getByText('すべて');
      expect(allBtn.className).toContain('bg-hive-accent');
    });

    it('loads popular templates when popular mode clicked', () => {
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      vi.clearAllMocks();
      fireEvent.click(screen.getByText('人気'));
      expect(mockFns.loadPopularTemplates).toHaveBeenCalledWith(20);
    });

    it('loads all templates when all mode clicked after popular', () => {
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      fireEvent.click(screen.getByText('人気'));
      vi.clearAllMocks();
      fireEvent.click(screen.getByText('すべて'));
      expect(mockFns.loadTemplates).toHaveBeenCalled();
    });
  });

  describe('search and filters', () => {
    it('calls setSearchQuery on input change', () => {
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      const search = screen.getByPlaceholderText(/検索/i);
      fireEvent.change(search, { target: { value: 'test' } });
      expect(mockFns.setSearchQuery).toHaveBeenCalledWith('test');
    });

    it('renders category dropdown', () => {
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(screen.getByText('すべてのカテゴリ')).toBeDefined();
    });

    it('calls setSelectedCategory on category change', () => {
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'general' } });
      expect(mockFns.setSelectedCategory).toHaveBeenCalledWith('general');
    });

    it('shows clear button when category selected', () => {
      mockStoreState.selectedCategory = 'general';
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(screen.getByText('クリア')).toBeDefined();
    });

    it('shows clear button when search query exists', () => {
      mockStoreState.searchQuery = 'test';
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(screen.getByText('クリア')).toBeDefined();
    });

    it('calls clearFilters when clear button clicked', () => {
      mockStoreState.selectedCategory = 'general';
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      fireEvent.click(screen.getByText('クリア'));
      expect(mockFns.clearFilters).toHaveBeenCalled();
    });

    it('hides clear button when no filters active', () => {
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(screen.queryByText('クリア')).toBeNull();
    });
  });

  describe('create new template', () => {
    it('renders create button', () => {
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(screen.getByText('＋ 新規作成')).toBeDefined();
    });

    it('opens modal when create button clicked', () => {
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      fireEvent.click(screen.getByText('＋ 新規作成'));
      expect(screen.getByTestId('template-modal')).toBeDefined();
    });
  });

  describe('loading state', () => {
    it('shows loading message when isLoading', () => {
      mockStoreState.isLoading = true;
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(screen.getByText('読み込み中...')).toBeDefined();
    });
  });

  describe('error state', () => {
    it('shows error message when error exists', () => {
      mockStoreState.error = 'Failed to load templates';
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(screen.getByText('Failed to load templates')).toBeDefined();
    });
  });

  describe('empty state', () => {
    it('shows empty message when no templates', () => {
      mockStoreState.templates = [];
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(screen.getByText('テンプレートがありません')).toBeDefined();
    });

    it('shows create link in empty state', () => {
      mockStoreState.templates = [];
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(screen.getByText('最初のテンプレートを作成')).toBeDefined();
    });

    it('opens modal when create link clicked', () => {
      mockStoreState.templates = [];
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      fireEvent.click(screen.getByText('最初のテンプレートを作成'));
      expect(screen.getByTestId('template-modal')).toBeDefined();
    });
  });

  describe('selected template footer', () => {
    it('hides footer when no template selected', () => {
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(screen.queryByText('このテンプレートを使用')).toBeNull();
    });

    it('shows footer when template selected', () => {
      mockStoreState.selectedTemplateId = 't1';
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(screen.getByText('このテンプレートを使用')).toBeDefined();
    });

    it('shows selected template name in footer', () => {
      mockStoreState.selectedTemplateId = 't1';
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(screen.getByText('Template 1 を選択中')).toBeDefined();
    });

    it('creates task when use template button clicked', async () => {
      mockStoreState.selectedTemplateId = 't1';
      render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      fireEvent.click(screen.getByText('このテンプレートを使用'));
      await waitFor(() => {
        expect(mockFns.incrementUsageCount).toHaveBeenCalledWith('t1');
        expect(mockFns.createTask).toHaveBeenCalled();
      });
    });
  });

  describe('backdrop click', () => {
    it('closes on backdrop click', () => {
      const onClose = vi.fn();
      render(<TemplateBrowser isOpen={true} onClose={onClose} sessionId="s1" />);
      // Get the backdrop (the outer fixed div)
      const backdrop = document.querySelector('.fixed.inset-0');
      fireEvent.click(backdrop!);
      expect(onClose).toHaveBeenCalled();
    });

    it('does not close when clicking modal content', () => {
      const onClose = vi.fn();
      render(<TemplateBrowser isOpen={true} onClose={onClose} sessionId="s1" />);
      const modal = document.querySelector('.bg-hive-surface');
      fireEvent.click(modal!);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('has fixed positioning', () => {
      const { container } = render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(container.innerHTML).toContain('fixed');
    });

    it('has modal dimensions', () => {
      const { container } = render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(container.innerHTML).toContain('w-[900px]');
      expect(container.innerHTML).toContain('h-[700px]');
    });

    it('has z-index for overlay', () => {
      const { container } = render(<TemplateBrowser isOpen={true} onClose={vi.fn()} sessionId="s1" />);
      expect(container.innerHTML).toContain('z-50');
    });
  });
});
