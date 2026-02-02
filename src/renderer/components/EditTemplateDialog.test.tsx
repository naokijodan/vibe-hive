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
});
