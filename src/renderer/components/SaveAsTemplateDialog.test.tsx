// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SaveAsTemplateDialog } from './SaveAsTemplateDialog';

describe('SaveAsTemplateDialog', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <SaveAsTemplateDialog isOpen={false} onClose={vi.fn()} onSave={vi.fn()} currentWorkflow={{ nodes: [], edges: [] }} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders form when open', () => {
    render(
      <SaveAsTemplateDialog isOpen={true} onClose={vi.fn()} onSave={vi.fn()} currentWorkflow={{ nodes: [], edges: [] }} />
    );
    expect(screen.getAllByText(/Save|Template/i).length).toBeGreaterThan(0);
  });

  it('shows name input', () => {
    render(
      <SaveAsTemplateDialog isOpen={true} onClose={vi.fn()} onSave={vi.fn()} currentWorkflow={{ nodes: [], edges: [] }} />
    );
    expect(screen.getByPlaceholderText('My Workflow Template')).toBeDefined();
  });

  it('shows description input', () => {
    render(
      <SaveAsTemplateDialog isOpen={true} onClose={vi.fn()} onSave={vi.fn()} currentWorkflow={{ nodes: [], edges: [] }} />
    );
    expect(screen.getByText(/Description|説明/i)).toBeDefined();
  });

  it('shows category selector', () => {
    render(
      <SaveAsTemplateDialog isOpen={true} onClose={vi.fn()} onSave={vi.fn()} currentWorkflow={{ nodes: [], edges: [] }} />
    );
    expect(screen.getByText(/Category|カテゴリ/i)).toBeDefined();
  });

  it('shows cancel button', () => {
    render(
      <SaveAsTemplateDialog isOpen={true} onClose={vi.fn()} onSave={vi.fn()} currentWorkflow={{ nodes: [], edges: [] }} />
    );
    expect(screen.getByText(/Cancel|キャンセル/i)).toBeDefined();
  });

  it('shows category options', () => {
    render(
      <SaveAsTemplateDialog isOpen={true} onClose={vi.fn()} onSave={vi.fn()} currentWorkflow={{ nodes: [], edges: [] }} />
    );
    expect(screen.getByText('Automation')).toBeDefined();
    expect(screen.getByText('Custom')).toBeDefined();
  });
});
