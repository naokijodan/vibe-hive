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
});
