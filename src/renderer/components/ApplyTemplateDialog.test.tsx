// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ApplyTemplateDialog } from './ApplyTemplateDialog';

const mockTemplate = {
  id: 1, name: 'Test Template', description: 'Desc', category: 'automation',
  nodes: [], edges: [], createdAt: Date.now(), updatedAt: Date.now(),
};

describe('ApplyTemplateDialog', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <ApplyTemplateDialog isOpen={false} onClose={vi.fn()} onApply={vi.fn()} template={null} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders template info when open', () => {
    render(
      <ApplyTemplateDialog isOpen={true} onClose={vi.fn()} onApply={vi.fn()} template={mockTemplate as any} />
    );
    expect(screen.getByText('Test Template')).toBeDefined();
  });

  it('shows dialog header', () => {
    render(
      <ApplyTemplateDialog isOpen={true} onClose={vi.fn()} onApply={vi.fn()} template={mockTemplate as any} />
    );
    expect(screen.getAllByText(/Apply Template/i).length).toBeGreaterThan(0);
  });

  it('shows description text', () => {
    render(
      <ApplyTemplateDialog isOpen={true} onClose={vi.fn()} onApply={vi.fn()} template={mockTemplate as any} />
    );
    expect(screen.getByText(/create a new workflow/i)).toBeDefined();
  });

  it('shows template description', () => {
    render(
      <ApplyTemplateDialog isOpen={true} onClose={vi.fn()} onApply={vi.fn()} template={mockTemplate as any} />
    );
    expect(screen.getByText('Desc')).toBeDefined();
  });

  it('shows category label', () => {
    render(
      <ApplyTemplateDialog isOpen={true} onClose={vi.fn()} onApply={vi.fn()} template={mockTemplate as any} />
    );
    expect(screen.getByText('Automation')).toBeDefined();
  });

  it('shows cancel button', () => {
    render(
      <ApplyTemplateDialog isOpen={true} onClose={vi.fn()} onApply={vi.fn()} template={mockTemplate as any} />
    );
    expect(screen.getByText('Cancel')).toBeDefined();
  });

  it('shows apply button', () => {
    render(
      <ApplyTemplateDialog isOpen={true} onClose={vi.fn()} onApply={vi.fn()} template={mockTemplate as any} />
    );
    const buttons = screen.getAllByRole('button');
    const applyButton = buttons.find(b => b.textContent === 'Apply Template');
    expect(applyButton).toBeDefined();
  });
});
