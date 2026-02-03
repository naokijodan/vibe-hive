// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EditTemplateDialog } from './EditTemplateDialog';

const mockTemplate = {
  id: 1, name: 'Edit Me', description: 'Desc', category: 'custom',
  nodes: [], edges: [], createdAt: Date.now(), updatedAt: Date.now(),
};

describe('EditTemplateDialog', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <EditTemplateDialog isOpen={false} template={null} onClose={vi.fn()} onSave={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders form with template data', () => {
    render(
      <EditTemplateDialog isOpen={true} template={mockTemplate as any} onClose={vi.fn()} onSave={vi.fn()} />
    );
    expect(screen.getByDisplayValue('Edit Me')).toBeDefined();
  });

  it('shows dialog header', () => {
    render(
      <EditTemplateDialog isOpen={true} template={mockTemplate as any} onClose={vi.fn()} onSave={vi.fn()} />
    );
    expect(screen.getByText(/Edit Template|テンプレート編集/i)).toBeDefined();
  });

  it('shows description field', () => {
    render(
      <EditTemplateDialog isOpen={true} template={mockTemplate as any} onClose={vi.fn()} onSave={vi.fn()} />
    );
    expect(screen.getByDisplayValue('Desc')).toBeDefined();
  });

  it('shows cancel button', () => {
    render(
      <EditTemplateDialog isOpen={true} template={mockTemplate as any} onClose={vi.fn()} onSave={vi.fn()} />
    );
    expect(screen.getByText(/Cancel|キャンセル/i)).toBeDefined();
  });

  it('shows save button', () => {
    render(
      <EditTemplateDialog isOpen={true} template={mockTemplate as any} onClose={vi.fn()} onSave={vi.fn()} />
    );
    expect(screen.getByText('Update Template')).toBeDefined();
  });

  it('shows category selector', () => {
    render(
      <EditTemplateDialog isOpen={true} template={mockTemplate as any} onClose={vi.fn()} onSave={vi.fn()} />
    );
    expect(screen.getByDisplayValue(/custom/i)).toBeDefined();
  });
});
