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
});
