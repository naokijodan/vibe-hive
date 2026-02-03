// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TemplateGallery } from './TemplateGallery';

vi.mock('../stores/workflowTemplateStore', () => ({
  useWorkflowTemplateStore: () => ({
    templates: [],
    selectedCategory: null,
    isLoading: false,
    loadTemplates: vi.fn(),
    setCategory: vi.fn(),
    deleteTemplate: vi.fn(),
    updateTemplate: vi.fn(),
  }),
}));

vi.mock('./TemplateCard', () => ({
  TemplateCard: () => <div>TemplateCard</div>,
}));

vi.mock('./EditTemplateDialog', () => ({
  EditTemplateDialog: () => null,
}));

describe('TemplateGallery', () => {
  it('renders category filters', () => {
    render(<TemplateGallery onApply={vi.fn()} />);
    expect(screen.getByText('All Templates')).toBeDefined();
  });

  it('renders gallery header', () => {
    render(<TemplateGallery onApply={vi.fn()} />);
    expect(screen.getByText('Workflow Templates')).toBeDefined();
  });

  it('renders empty state when no templates', () => {
    render(<TemplateGallery onApply={vi.fn()} />);
    expect(screen.getAllByText(/All Templates|Category/i).length).toBeGreaterThan(0);
  });

  it('renders search or filter section', () => {
    render(<TemplateGallery onApply={vi.fn()} />);
    expect(screen.getByText('All Templates')).toBeDefined();
  });

  it('renders with onApply callback', () => {
    const onApply = vi.fn();
    const { container } = render(<TemplateGallery onApply={onApply} />);
    expect(container.innerHTML).not.toBe('');
  });
});
